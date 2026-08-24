#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE=(docker compose -f "$ROOT/infra/docker/compose.yml")
BTC=(bitcoin-cli -regtest -rpcuser=ln -rpcpassword=ln)
LN=(lncli --network=regtest)

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required for regtest bootstrap" >&2
  exit 1
fi

json_field() {
  python3 -c "import json,sys; print(json.load(sys.stdin)$1)"
}

wait_ln() {
  local svc="$1"
  for _ in $(seq 1 60); do
    if "${COMPOSE[@]}" exec -T "$svc" "${LN[@]}" getinfo >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  echo "timeout waiting for $svc" >&2
  exit 1
}

wait_channel() {
  for _ in $(seq 1 60); do
    local active
    active="$("${COMPOSE[@]}" exec -T lnd "${LN[@]}" listchannels | python3 -c 'import json,sys; ch=json.load(sys.stdin).get("channels") or []; print(sum(1 for c in ch if c.get("active")))')"
    if [[ "$active" != "0" ]]; then
      return 0
    fi
    sleep 2
  done
  echo "timeout waiting for active channel" >&2
  exit 1
}

"${COMPOSE[@]}" up -d
wait_ln lnd
wait_ln lnd-payer

ADDR="$("${COMPOSE[@]}" exec -T lnd-payer "${LN[@]}" newaddress p2wkh | json_field '["address"]')"
"${COMPOSE[@]}" exec -T bitcoind "${BTC[@]}" generatetoaddress 101 "$ADDR" >/dev/null

for _ in $(seq 1 30); do
  SYNC="$("${COMPOSE[@]}" exec -T lnd-payer "${LN[@]}" getinfo | json_field '["synced_to_chain"]')"
  if [ "$SYNC" = "True" ] || [ "$SYNC" = "true" ]; then
    break
  fi
  sleep 2
done

PUB="$("${COMPOSE[@]}" exec -T lnd "${LN[@]}" getinfo | json_field '["identity_pubkey"]')"
"${COMPOSE[@]}" exec -T lnd-payer "${LN[@]}" connect "$PUB@lnd:9735" >/dev/null || true

CHANNELS="$("${COMPOSE[@]}" exec -T lnd "${LN[@]}" listchannels | python3 -c 'import json,sys; print(len(json.load(sys.stdin).get("channels") or []))')"
if [[ "$CHANNELS" = "0" ]]; then
  "${COMPOSE[@]}" exec -T lnd-payer "${LN[@]}" openchannel --node_key="$PUB" --local_amt=1000000 >/dev/null
  "${COMPOSE[@]}" exec -T bitcoind "${BTC[@]}" generatetoaddress 6 "$ADDR" >/dev/null
fi
wait_channel

echo "LN_BACKEND=lnd_rest"
echo "LND_REST_HOST=https://127.0.0.1:8080"
echo "LND_TLS_CERT_PATH=$ROOT/infra/docker/data/lnd/tls.cert"
echo "LND_MACAROON_PATH=$ROOT/infra/docker/data/lnd/data/chain/bitcoin/regtest/admin.macaroon"
echo "LND_PAYER_REST_HOST=https://127.0.0.1:8081"
echo "LND_PAYER_TLS_CERT_PATH=$ROOT/infra/docker/data/lnd-payer/tls.cert"
echo "LND_PAYER_MACAROON_PATH=$ROOT/infra/docker/data/lnd-payer/data/chain/bitcoin/regtest/admin.macaroon"
echo "LND_TLS_INSECURE=true"
