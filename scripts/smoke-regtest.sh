#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required for ./scripts/smoke-regtest.sh" >&2
  exit 1
fi

PORT="${PORT:-8787}"
BASE="http://127.0.0.1:${PORT}"
MSISDN="${SMOKE_MSISDN:-250788123456}"
AMOUNT_RWF="${SMOKE_AMOUNT_RWF:-1350}"

env_get() {
  local key="$1"
  if [[ ! -f .env ]]; then
    return 0
  fi
  local line
  line="$(rg -m1 "^${key}=" .env || true)"
  if [[ -z "$line" ]]; then
    return 0
  fi
  printf '%s' "${line#*=}"
}

NETWORK_API_KEYS="$(env_get NETWORK_API_KEYS)"
AUTH_ARGS=()
if [[ -n "$NETWORK_API_KEYS" ]]; then
  KEY="${NETWORK_API_KEYS%%,*}"
  KEY="${KEY#"${KEY%%[![:space:]]*}"}"
  KEY="${KEY%"${KEY##*[![:space:]]}"}"
  AUTH_ARGS=(-H "Authorization: Bearer ${KEY}")
fi

curl_auth() {
  if ((${#AUTH_ARGS[@]})); then
    curl -sf "${AUTH_ARGS[@]}" "$@"
  else
    curl -sf "$@"
  fi
}

BOOT_ENV="$(mktemp)"
cleanup() {
  if [[ -n "${API_PID:-}" ]] && kill -0 "$API_PID" 2>/dev/null; then
    kill "$API_PID" 2>/dev/null || true
    wait "$API_PID" 2>/dev/null || true
  fi
  rm -f "$BOOT_ENV"
}
trap cleanup EXIT

./scripts/regtest-bootstrap.sh | tee "$BOOT_ENV" >/dev/null
# shellcheck disable=SC1090
set -a
source "$BOOT_ENV"
set +a

export STORE_BACKEND=memory
export MOMO_BACKEND=memory
export LN_BACKEND=lnd_rest
export LND_TLS_INSECURE=true
export RECONCILE_MS=0

npm run dev >/tmp/ln-network-regtest-smoke.log 2>&1 &
API_PID=$!

for _ in $(seq 1 60); do
  if curl -sf "$BASE/health" >/dev/null; then
    break
  fi
  if ! kill -0 "$API_PID" 2>/dev/null; then
    echo "network-api exited early; see /tmp/ln-network-regtest-smoke.log" >&2
    tail -n 60 /tmp/ln-network-regtest-smoke.log >&2 || true
    exit 1
  fi
  sleep 0.5
done

if ! curl -sf "$BASE/health" >/dev/null; then
  echo "network-api did not become healthy; see /tmp/ln-network-regtest-smoke.log" >&2
  tail -n 60 /tmp/ln-network-regtest-smoke.log >&2 || true
  exit 1
fi

BODY=$(printf '{"rail":"momo_rwf","amount_rwf":%s,"msisdn":"%s"}' "$AMOUNT_RWF" "$MSISDN")
CREATED="$(curl_auth -H 'content-type: application/json' -d "$BODY" "$BASE/v1/payments")"
PAYMENT_ID="$(python3 -c "import json,sys; print(json.load(sys.stdin)['payment_id'])" <<<"$CREATED")"
STATUS="$(python3 -c "import json,sys; print(json.load(sys.stdin)['status'])" <<<"$CREATED")"
if [[ "$STATUS" != "INVOICE_ISSUED" ]]; then
  echo "expected INVOICE_ISSUED, got $STATUS" >&2
  echo "$CREATED" >&2
  exit 1
fi

PAID="$(curl_auth -X POST "$BASE/v1/dev/pay/${PAYMENT_ID}")"
PAID_STATUS="$(python3 -c "import json,sys; print(json.load(sys.stdin)['status'])" <<<"$PAID")"
if [[ "$PAID_STATUS" != "COMPLETE" ]]; then
  echo "expected COMPLETE after regtest pay, got $PAID_STATUS" >&2
  echo "$PAID" >&2
  tail -n 80 /tmp/ln-network-regtest-smoke.log >&2 || true
  exit 1
fi

echo "ok regtest pay"
echo "payment_id=${PAYMENT_ID}"
echo "status=${PAID_STATUS}"
