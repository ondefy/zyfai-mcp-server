# Host Node / PM2 / pnpm upgrade (MCP)

Match [`.nvmrc`](../.nvmrc) **22.23.4** and the pnpm version in [`package.json`](../package.json). SSH humans only; agents do not run this on shared hosts. Routine releases: [`scripts/release.sh`](../scripts/release.sh) / `pnpm run release`.

Production checkout is typically `/apps/zyfai-mcp-server` (user `deploy`). PM2 app name: **`zyfai-mcp-server`** (`PM2_HOME=/home/deploy/.pm2`).

PM2 keeps each worker's old `PATH` until reload with **`--update-env`**. Do not `pm2 restart all`.

## 1. Pre-flight

```bash
whoami
node -v && command -v pm2 pnpm
sudo -u deploy -H bash -lc 'PM2_HOME=/home/deploy/.pm2 pm2 ls'
```

## 2. Toolchain (nvm)

Install Node as the user that runs builds (often `deploy` or your SSH user with nvm):

```bash
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

OLD_NODE="$(node -v)"
nvm install 22.23.4
nvm alias default 22.23.4
nvm use 22.23.4

nvm reinstall-packages "${OLD_NODE}"   # or: npm install -g pm2
corepack enable
corepack prepare pnpm@$(node -p "require('./package.json').packageManager.split('@')[1]") --activate

hash -r
node -v && pnpm -v && command -v pm2
```

## 3. PM2 daemon

```bash
PM2_HOME=/home/deploy/.pm2 pm2 update
```

## 4. Reload MCP only

Prefer a normal release (pull + build + restart with clean env):

```bash
cd /apps/zyfai-mcp-server
pnpm run release
```

Toolchain-only (no pull):

```bash
PM2_HOME=/home/deploy/.pm2 pm2 restart zyfai-mcp-server --update-env
PM2_HOME=/home/deploy/.pm2 pm2 save
```

## 5. Verify

```bash
readlink -f /proc/$(PM2_HOME=/home/deploy/.pm2 pm2 pid zyfai-mcp-server)/exe
PM2_HOME=/home/deploy/.pm2 pm2 log zyfai-mcp-server --lines 50 --nostream
curl -s https://mcp.zyf.ai/health
```

## Rollback

- **Node:** revert nvm default → reinstall `pm2` / corepack → `pm2 restart zyfai-mcp-server --update-env`.
- **Deploy:** checkout previous SHA, `pnpm install --frozen-lockfile`, `pnpm run build`, `pnpm run release`.
