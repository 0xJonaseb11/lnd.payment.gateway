#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

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

PORT="$(env_get PORT)"
PORT="${PORT:-8787}"
BASE="http://127.0.0.1:${PORT}"
STORE_BACKEND="$(env_get STORE_BACKEND)"
DATABASE_URL="$(env_get DATABASE_URL)"
NETWORK_API_KEYS="$(env_get NETWORK_API_KEYS)"

if [[ "$STORE_BACKEND" != "supabase" ]]; then
  echo "STORE_BACKEND must be supabase (got: ${STORE_BACKEND:-unset})" >&2
  exit 1
fi
if [[ -z "$DATABASE_URL" ]]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

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

ACCOUNT_ID="acc_smoke_$(date +%s)"
CREDIT_MICROS="1000000"
BODY=$(printf '{"rail":"ledger","amount_usdt_micros":"%s","account_id":"%s"}' "$CREDIT_MICROS" "$ACCOUNT_ID")

cleanup() {
  if [[ -n "${API_PID:-}" ]] && kill -0 "$API_PID" 2>/dev/null; then
    kill "$API_PID" 2>/dev/null || true
    wait "$API_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

LN_BACKEND=memory npm run dev >/tmp/ln-network-smoke.log 2>&1 &
API_PID=$!

for _ in $(seq 1 40); do
  if curl -sf "$BASE/health" >/dev/null; then
    break
  fi
  if ! kill -0 "$API_PID" 2>/dev/null; then
    echo "network-api exited early; see /tmp/ln-network-smoke.log" >&2
    tail -n 40 /tmp/ln-network-smoke.log >&2 || true
    exit 1
  fi
  sleep 0.25
done

if ! curl -sf "$BASE/health" >/dev/null; then
  echo "network-api did not become healthy; see /tmp/ln-network-smoke.log" >&2
  tail -n 40 /tmp/ln-network-smoke.log >&2 || true
  exit 1
fi

BEFORE="$(curl_auth "$BASE/v1/accounts/${ACCOUNT_ID}")"
BEFORE_MICROS="$(python3 -c "import json,sys; print(json.load(sys.stdin)['usdt_micros'])" <<<"$BEFORE")"

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
  echo "expected COMPLETE, got $PAID_STATUS" >&2
  echo "$PAID" >&2
  exit 1
fi

AFTER="$(curl_auth "$BASE/v1/accounts/${ACCOUNT_ID}")"
AFTER_MICROS="$(python3 -c "import json,sys; print(json.load(sys.stdin)['usdt_micros'])" <<<"$AFTER")"
EXPECTED="$(python3 -c "print(int('${BEFORE_MICROS}') + int('${CREDIT_MICROS}'))")"
if [[ "$AFTER_MICROS" != "$EXPECTED" ]]; then
  echo "ledger balance mismatch: before=${BEFORE_MICROS} after=${AFTER_MICROS} expected=${EXPECTED}" >&2
  exit 1
fi

echo "ok ledger credit"
echo "payment_id=${PAYMENT_ID}"
echo "account_id=${ACCOUNT_ID}"
echo "usdt_micros=${AFTER_MICROS}"
