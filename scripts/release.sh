#!/usr/bin/env bash
# Release on the MCP host (checkout /apps/zyfai-mcp-server).
#
#   pnpm run release
#
# Git pull runs as deploy (that user has the GitHub SSH key). Install and
# build run as the current user: sudoers does not allow `sudo -u deploy pnpm`.
# PM2 is the deploy user's daemon (PM2_HOME=/home/deploy/.pm2).
#
# `pm2 restart --update-env` copies this process environment onto the app and
# overwrites matching keys. The server also loads .env, but dotenv does not
# override variables that are already set. This script restarts PM2 with a
# clean environment: PATH, HOME, PM2_HOME, and the assignments in .env. Keys
# that exist only on the running process are left in place. .env wins where
# both are set. `pm2 save` writes that back so a reboot does not drop it.
#
# Nginx for mcp.zyf.ai is not changed.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

GIT_USER="${GIT_USER:-deploy}"
GIT_BRANCH="${GIT_BRANCH:-main}"
PM2_HOME="${PM2_HOME:-/home/deploy/.pm2}"
PM2_APP="${PM2_APP:-zyfai-mcp-server}"
ENV_FILE="${ENV_FILE:-$ROOT/.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE" >&2
  exit 1
fi

if ! PM2_BIN="$(command -v pm2)"; then
  echo "pm2 is not on PATH" >&2
  exit 1
fi

PM2_ENV_FILE="$(mktemp)"
chmod 600 "$PM2_ENV_FILE"
trap 'rm -f "$PM2_ENV_FILE"' EXIT

git_as_deploy() {
  if [[ "$(id -un)" == "$GIT_USER" ]]; then
    git -C "$ROOT" "$@"
  else
    sudo -u "$GIT_USER" -H git -C "$ROOT" "$@"
  fi
}

# Write a shell-quoted env file. Does not export into this process and does not print values.
write_env_file() {
  local src="$1" dest="$2"
  local line key value
  : > "$dest"
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    line="${line#"${line%%[![:space:]]*}"}"
    [[ -z "$line" || "$line" == \#* ]] && continue
    if [[ "$line" == export[[:space:]]* ]]; then
      line="${line#export}"
      line="${line#"${line%%[![:space:]]*}"}"
    fi
    [[ "$line" == *=* ]] || continue
    key="${line%%=*}"
    value="${line#*=}"
    key="${key%"${key##*[![:space:]]}"}"
    [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
    if [[ ${#value} -ge 2 && "$value" == \"*\" && "$value" == *\" ]]; then
      value="${value:1:$((${#value} - 2))}"
    elif [[ ${#value} -ge 2 && "$value" == \'*\' && "$value" == *\' ]]; then
      value="${value:1:$((${#value} - 2))}"
    fi
    printf '%s=%q\n' "$key" "$value" >> "$dest"
  done < "$src"
}

# Print one key from the quoted env file. Empty if unset. Does not print other keys.
read_env_key() {
  local key="$1"
  [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || return 1
  bash --noprofile --norc -c '
    set -a
    # shellcheck disable=SC1090
    . "$1"
    name=$2
    printf %s "${!name-}"
  ' _ "$PM2_ENV_FILE" "$key"
}

pm2_as_app() {
  # Restore PATH, HOME, and PM2_HOME after sourcing .env so a line in that
  # file cannot point this restart at a different daemon or drop node from PATH.
  local -a prefix
  prefix=(
    env -i
    "PATH=${PATH}"
    "HOME=${HOME}"
    "PM2_HOME=${PM2_HOME}"
    "USER=${USER:-$(id -un)}"
    "LOGNAME=${LOGNAME:-$(id -un)}"
  )
  if [[ -n "${LANG:-}" ]]; then
    prefix+=("LANG=${LANG}")
  fi
  if [[ -n "${TMPDIR:-}" ]]; then
    prefix+=("TMPDIR=${TMPDIR}")
  fi
  "${prefix[@]}" bash --noprofile --norc -c '
    set -a
    # shellcheck disable=SC1090
    . "$1"
    set +a
    export PATH="$2"
    export HOME="$3"
    export PM2_HOME="$4"
    export USER="$5"
    export LOGNAME="$6"
    shift 6
    exec "$@"
  ' _ "$PM2_ENV_FILE" "$PATH" "$HOME" "$PM2_HOME" "${USER:-$(id -un)}" "${LOGNAME:-$(id -un)}" "$@"
}

require_api_key() {
  local key
  key="$(read_env_key ZYFAI_API_KEY)"
  if [[ -z "$key" ]]; then
    echo "ZYFAI_API_KEY is empty in $ENV_FILE. Refusing to restart." >&2
    exit 1
  fi
}

write_env_file "$ENV_FILE" "$PM2_ENV_FILE"
require_api_key

if [[ ! -d "$PM2_HOME" ]]; then
  echo "PM2 home not found: $PM2_HOME" >&2
  exit 1
fi

pid="$(pm2_as_app "$PM2_BIN" pid "$PM2_APP" | tr -d '[:space:]')"
if [[ -z "$pid" || "$pid" == "0" ]]; then
  echo "No PM2 process named ${PM2_APP} under PM2_HOME=${PM2_HOME}" >&2
  echo "Check: PM2_HOME=${PM2_HOME} pm2 ls" >&2
  exit 1
fi

dirty="$(git_as_deploy status --porcelain)"
if [[ -n "$dirty" ]]; then
  echo "Checkout has local changes. Commit or stash them before releasing." >&2
  printf '%s\n' "$dirty" >&2
  exit 1
fi

echo "Pulling origin/${GIT_BRANCH} as ${GIT_USER}"
git_as_deploy pull --ff-only "origin" "$GIT_BRANCH"

echo "Installing from the lockfile"
pnpm install --frozen-lockfile

echo "Building"
pnpm run build

write_env_file "$ENV_FILE" "$PM2_ENV_FILE"
require_api_key

PORT="$(read_env_key PORT)"
PORT="${PORT:-3005}"

echo "Restarting PM2 app ${PM2_APP}"
pm2_as_app "$PM2_BIN" restart "$PM2_APP" --update-env
pm2_as_app "$PM2_BIN" save

health_url="http://127.0.0.1:${PORT}/health"
echo "Waiting for ${health_url}"
ok=0
for _ in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS -o /dev/null "$health_url"; then
    ok=1
    break
  fi
  sleep 1
done

if [[ "$ok" != "1" ]]; then
  echo "Health check failed: ${health_url}" >&2
  echo "Logs: PM2_HOME=${PM2_HOME} pm2 logs ${PM2_APP} --lines 50 --nostream" >&2
  exit 1
fi

echo "Release is up. ${health_url} returned 200."
