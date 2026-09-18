#!/usr/bin/env sh
set -eu
ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
ENV_FILE="$ROOT_DIR/.env"
if [ -f "$ENV_FILE" ]; then
  echo ".env already exists. Current local credential:"
  grep '^TEST_USERNAME=' "$ENV_FILE" || true
  grep '^TEST_PASSWORD=' "$ENV_FILE" || true
  exit 0
fi
if command -v openssl >/dev/null 2>&1; then
  PASSWORD=$(openssl rand -hex 10)
else
  PASSWORD="candidate-$(date +%s)"
fi
cat > "$ENV_FILE" <<ENV
TEST_USERNAME=candidate
TEST_PASSWORD=$PASSWORD
BACKEND_PORT=3000
FRONTEND_PORT=8080
ENV
chmod 600 "$ENV_FILE" 2>/dev/null || true
echo "Local environment created in .env (ignored by Git)."
echo "TEST_USERNAME=candidate"
echo "TEST_PASSWORD=$PASSWORD"
echo "Do not commit .env or copy the password into evidence/reports."
