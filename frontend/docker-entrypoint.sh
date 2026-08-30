#!/bin/sh
set -e
# Dependencies are installed during `docker build`. Re-sync only when package-lock.json changes.
STAMP=/app/node_modules/.saransh-lock-hash
if [ -f package-lock.json ]; then
    HASH=$(sha256sum package-lock.json | awk '{print $1}')
    OLD=$(cat "$STAMP" 2>/dev/null || echo "")
    if [ "$HASH" != "$OLD" ]; then
        echo "saransh web: package-lock.json changed — syncing dependencies (npm ci)…"
        npm ci
        echo "$HASH" > "$STAMP"
    fi
fi
exec "$@"
