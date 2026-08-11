# Local Lightning

Default app mode is `LN_BACKEND=memory` (no node required).

Regtest node pair:

```
docker compose -f infra/docker/compose.yml up -d
```

Then set:

```
LN_BACKEND=lnd_rest
LND_REST_HOST=https://127.0.0.1:8080
LND_TLS_CERT_PATH=infra/docker/data/lnd/tls.cert
LND_MACAROON_PATH=infra/docker/data/lnd/data/chain/bitcoin/regtest/admin.macaroon
LND_TLS_INSECURE=true
```

Create a wallet with `lncli --network=regtest create` against the container if the node has no wallet yet.
