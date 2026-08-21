# Local Lightning

Default app mode is `LN_BACKEND=memory` (no node required).

Two-node regtest (receiver `lnd` + payer `lnd-payer`) needs Docker:

```
./scripts/regtest-bootstrap.sh
```

That prints env for `.env`. Then:

```
LN_BACKEND=lnd_rest
LND_REST_HOST=https://127.0.0.1:8080
LND_TLS_CERT_PATH=infra/docker/data/lnd/tls.cert
LND_MACAROON_PATH=infra/docker/data/lnd/data/chain/bitcoin/regtest/admin.macaroon
LND_PAYER_REST_HOST=https://127.0.0.1:8081
LND_PAYER_TLS_CERT_PATH=infra/docker/data/lnd-payer/tls.cert
LND_PAYER_MACAROON_PATH=infra/docker/data/lnd-payer/data/chain/bitcoin/regtest/admin.macaroon
LND_TLS_INSECURE=true
```

End-to-end hold invoice pay (bootstrap + API + `POST /v1/dev/pay`):

```
./scripts/smoke-regtest.sh
```

Uses memory MoMo and memory store so the check is Lightning only. Tick the Phase 1 roadmap box after it prints `ok regtest pay`.
