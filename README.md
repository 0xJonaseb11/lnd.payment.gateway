# LN payment network

Open source payment gateway: **Lightning hold invoices**, **MoMo RWF offramp**, and an internal **ledger** rail. Unit of account: USDT micros. Clients call `POST /v1/payments`.

## Rails

| Rail | Flow |
|------|------|
| `momo_rwf` | BOLT11 → LN accept → MTN MoMo disbursement → settle or refund |
| `ledger` | BOLT11 → LN accept → credit USDT micros on an account |

Hold invoices protect payers: if MoMo fails, the HTLC is canceled.

## Quick start

```
cp .env.example .env
npm ci
npm test
npm run dev
```

```
curl -s localhost:8787/v1/payments \
  -H 'content-type: application/json' \
  -d '{"rail":"momo_rwf","amount_rwf":1350,"msisdn":"250788123456"}'
```

Memory pay: `curl -s -X POST localhost:8787/v1/dev/pay/pay_...`

Discovery: `GET /.well-known/ln-network.json`

## API

| Endpoint | Purpose |
|----------|---------|
| `POST /v1/payments` | Create hold invoice (`momo_rwf` or `ledger`) |
| `GET /v1/payments/:id` | Status |
| `GET /v1/accounts/:id` | Ledger balance |
| `POST /v1/webhooks/momo` | MoMo callback |
| `GET /health` | Liveness |
| `POST /v1/dev/pay/:id` | Test pay (memory / regtest payer only) |


Statuses: `INVOICE_ISSUED` · `LN_ACCEPTED` · `DISBURSING` · `COMPLETE` · `REFUNDED` · `MANUAL_REVIEW` · `EXPIRED`

## Auth

When `NETWORK_API_KEYS` is set, gated routes need `Authorization: Bearer <key>` or `X-Api-Key`. Empty keys leave routes open for local tests.

When `MOMO_WEBHOOK_SECRET` is set, webhooks need `X-Callback-Secret`.

Public always: `/health`, `/.well-known/ln-network.json`.

## Production

```
npm run start
# or
docker build -t ln-network-api .
docker run --env-file .env -p 8787:8787 ln-network-api
```

Typical env: `STORE_BACKEND=supabase`, `DATABASE_URL=...`, `LN_BACKEND=lnd_rest`, `MOMO_BACKEND=http`, plus `NETWORK_API_KEYS` and `MOMO_WEBHOOK_SECRET`. See `.env.example`.

Smokes (optional): `./scripts/smoke-ledger-supabase.sh`, `./scripts/smoke-regtest.sh`, `./scripts/smoke-momo-sandbox.sh`.

## Layout

```
packages/shared      money, status, errors
services/ln-gateway  LightningPort
services/momo-gateway MoMo disbursement
services/fx-rate     integer quotes
services/network-api HTTP + orchestration
supabase/            payments + ledger schema
scripts/             bootstrap + smokes
```

## License

MIT. See [`LICENSE`](LICENSE).
