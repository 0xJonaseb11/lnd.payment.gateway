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
MSISDN="${SMOKE_MSISDN:-250788123456}"
AMOUNT_RWF="${SMOKE_AMOUNT_RWF:-1350}"
MOMO_BACKEND="$(env_get MOMO_BACKEND)"
MOMO_KEY="$(env_get MOMO_DISBURSEMENT_SUBSCRIPTION_KEY)"
MOMO_USER="$(env_get MOMO_API_USER)"
MOMO_API_KEY="$(env_get MOMO_API_KEY)"
NETWORK_API_KEYS="$(env_get NETWORK_API_KEYS)"

if [[ -z "$MOMO_BACKEND" || -z "$MOMO_KEY" || -z "$MOMO_USER" || -z "$MOMO_API_KEY" ]]; then
  echo "MOMO_BACKEND, MOMO_DISBURSEMENT_SUBSCRIPTION_KEY, MOMO_API_USER, and MOMO_API_KEY are required" >&2
  exit 1
fi
if [[ "$MOMO_BACKEND" != "http" ]]; then
  echo "MOMO_BACKEND must be http (got: $MOMO_BACKEND)" >&2
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

cleanup() {
  if [[ -n "${API_PID:-}" ]] && kill -0 "$API_PID" 2>/dev/null; then
    kill "$API_PID" 2>/dev/null || true
    wait "$API_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

export LN_BACKEND=memory
export MOMO_BACKEND=http
export STORE_BACKEND=memory
export RECONCILE_MS=5000

npm run dev >/tmp/ln-network-momo-smoke.log 2>&1 &
API_PID=$!

for _ in $(seq 1 40); do
  if curl -sf "$BASE/health" >/dev/null; then
    break
  fi
  if ! kill -0 "$API_PID" 2>/dev/null; then
    echo "network-api exited early; see /tmp/ln-network-momo-smoke.log" >&2
    tail -n 60 /tmp/ln-network-momo-smoke.log >&2 || true
    exit 1
  fi
  sleep 0.25
done

BODY=$(printf '{"rail":"momo_rwf","amount_rwf":%s,"msisdn":"%s"}' "$AMOUNT_RWF" "$MSISDN")
CREATED="$(curl_auth -H 'content-type: application/json' -d "$BODY" "$BASE/v1/payments")"
PAYMENT_ID="$(python3 -c "import json,sys; print(json.load(sys.stdin)['payment_id'])" <<<"$CREATED")"

curl_auth -X POST "$BASE/v1/dev/pay/${PAYMENT_ID}" >/dev/null

for _ in $(seq 1 36); do
  STATUS="$(curl_auth "$BASE/v1/payments/${PAYMENT_ID}" | python3 -c "import json,sys; print(json.load(sys.stdin)['status'])")"
  case "$STATUS" in
    COMPLETE)
      echo "ok momo sandbox"
      echo "payment_id=${PAYMENT_ID}"
      echo "status=${STATUS}"
      exit 0
      ;;
    REFUNDED|MANUAL_REVIEW|EXPIRED)
      echo "momo sandbox ended in ${STATUS}" >&2
      curl_auth "$BASE/v1/payments/${PAYMENT_ID}" >&2 || true
      tail -n 80 /tmp/ln-network-momo-smoke.log >&2 || true
      exit 1
      ;;
  esac
  sleep 5
done

echo "timeout waiting for terminal status; last=${STATUS:-unknown}" >&2
tail -n 80 /tmp/ln-network-momo-smoke.log >&2 || true
exit 1
