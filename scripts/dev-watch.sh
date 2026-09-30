#!/usr/bin/env bash
# One nodemon start: wait for tsc -w + linked SDK watch first JS emit (see dev-zyfai-sdk-watch.sh).
set -euo pipefail
cd "$(dirname "$0")/.."

WAIT_TARGETS=(build/index.js)
if [[ -f ../zyfai-sdk/dist/index.mjs ]]; then
  WAIT_TARGETS+=(../zyfai-sdk/dist/index.mjs)
fi

pnpm dlx concurrently -k -n tsc,mcp -c blue,green \
  "tsc -w --preserveWatchOutput" \
  "pnpm dlx wait-on -t 120000 ${WAIT_TARGETS[*]} && sleep 2.5 && pnpm dlx nodemon -q --config nodemon.json"
