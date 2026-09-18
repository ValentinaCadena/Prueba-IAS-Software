#!/usr/bin/env sh
set -eu
ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
ENV_FILE="$ROOT_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "Missing .env. Run ./scripts/init-local-env.sh first." >&2
  exit 1
fi
grep '^TEST_USERNAME=' "$ENV_FILE"
grep '^TEST_PASSWORD=' "$ENV_FILE"
