# LN payment network

Production payment gateway for **Lightning hold invoices**, **MoMo RWF offramp**, and an internal **ledger** rail. Unit of account: USDT micros.

Clients integrate with `POST /v1/payments`. This repo is network tooling, not a wallet app.

## Rails

| Rail | Flow |
|------|------|
| `momo_rwf` | BOLT11 → LN accept → MTN MoMo disbursement → settle or refund |
| `ledger` | BOLT11 → LN accept → credit USDT micros on an account |

Hold invoices protect payers: if MoMo fails, the HTLC is canceled.

## Production

Required stack:

| Piece | Setting |
|-------|---------|
| Store | `STORE_BACKEND=supabase` + `DATABASE_URL` |
| Lightning | `LN_BACKEND=lnd_rest` + LND REST host, TLS cert, macaroon |
| MoMo | `MOMO_BACKEND=http` + disbursement credentials |
| Auth | `NETWORK_API_KEYS` and `MOMO_WEBHOOK_SECRET` |

Apply `supabase/migrations/01_network_store.sql`, then:

```
cp .env.example .env
# fill production values
npm ci
npm test
npm run start
```

Docker:

```
docker build -t ln-network-api .
docker run --env-file .env -p 8787:8787 ln-network-api
```

Bind `0.0.0.0:$PORT`. Do not enable a payer in production; `POST /v1/dev/pay` stays off when no payer is configured.

## Local development

```
cp .env.example .env
npm ci
npm test
npm run dev
```

Defaults use memory LN and MoMo backends. Optional local LND nodes: `infra/docker/compose.yml`.

```
curl -s localhost:8787/v1/payments \
  -H 'content-type: application/json' \
  -H 'Authorization: Bearer <key>' \
  -d '{"rail":"momo_rwf","amount_rwf":1350,"msisdn":"250788123456"}'
```

Discovery: `GET /.well-known/ln-network.json`

## API

| Endpoint | Purpose |
|----------|---------|
| `POST /v1/payments` | Create hold invoice (`momo_rwf` or `ledger`) |
| `GET /v1/payments/:id` | Status |
| `GET /v1/accounts/:id` | Ledger balance |
| `POST /v1/webhooks/momo` | MoMo callback |
| `GET /metrics` | Counters |
| `GET /health` | Liveness |
| `POST /v1/dev/pay/:id` | Test pay (dev / regtest only) |

Statuses: `INVOICE_ISSUED` · `LN_ACCEPTED` · `DISBURSING` · `COMPLETE` · `REFUNDED` · `MANUAL_REVIEW` · `EXPIRED`

### Auth

When `NETWORK_API_KEYS` is set (comma-separated), gated routes need `Authorization: Bearer <key>` or `X-Api-Key`.

When `MOMO_WEBHOOK_SECRET` is set, webhooks need `X-Callback-Secret`.

Public always: `/health`, `/.well-known/ln-network.json`.

## Layout

```
packages/shared       money, status, errors
services/ln-gateway   LightningPort
services/momo-gateway MoMo disbursement
services/fx-rate      integer quotes
services/network-api  HTTP + orchestration
supabase/             payments + ledger schema
infra/docker/         optional local LND compose
```

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md). Release notes: [`CHANGELOG.md`](CHANGELOG.md).

## License

MIT. See [`LICENSE`](LICENSE).
