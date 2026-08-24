# Deploy the payment gateway

`network-api` is the HTTP gateway. Clients integrate via `/v1/payments`. This doc covers production wiring.

## Minimum production stack

| Piece | Production choice |
|-------|-------------------|
| Gateway | `network-api` (this repo) |
| Store | Supabase Postgres (`STORE_BACKEND=supabase`) |
| Lightning | LND REST (`LN_BACKEND=lnd_rest`) |
| MoMo | HTTP disbursements (`MOMO_BACKEND=http`) |
| Auth | `NETWORK_API_KEYS`, `MOMO_WEBHOOK_SECRET` |

## Database

Apply the schema once:

```
supabase db push
```

Or run `supabase/migrations/20260813133000_network_store.sql` in the SQL editor (schema `network`).

Set:

```
STORE_BACKEND=supabase
DATABASE_URL=postgresql://...@...pooler.supabase.com:6543/postgres
```

Use the pooler URI. Direct `db.*.supabase.co` often fails on IPv4-only hosts.

## Lightning

Point at your receive node:

```
LN_BACKEND=lnd_rest
LND_REST_HOST=https://your-lnd:8080
LND_TLS_CERT_PATH=/secrets/tls.cert
LND_MACAROON_PATH=/secrets/invoice.macaroon
LND_TLS_INSECURE=false
```

The node must subscribe to accepted hold invoices. `ln-gateway` opens `SubscribeInvoices` on startup.

Do not enable `POST /v1/dev/pay` in production. It is off when no payer port is configured and `LN_BACKEND=lnd_rest`.

## MoMo offramp

```
MOMO_BACKEND=http
MOMO_BASE_URL=https://sandbox.momodeveloper.mtn.com
MOMO_DISBURSEMENT_SUBSCRIPTION_KEY=...
MOMO_API_USER=...
MOMO_API_KEY=...
MOMO_TARGET_ENV=sandbox
```

Register your callback URL with MTN and set:

```
MOMO_WEBHOOK_SECRET=...
```

MoMo POSTs to `POST /v1/webhooks/momo` with header `X-Callback-Secret`.

## Client auth

```
NETWORK_API_KEYS=key_one,key_two
```

Gated routes: `/v1/payments`, `/v1/payments/:id`, `/v1/accounts/:id`, `/metrics`.

Public: `/health`, `/.well-known/ln-network.json`.

## Docker

```
docker build -t ln-network-api .
docker run --env-file .env -p 8787:8787 ln-network-api
```

Bind `0.0.0.0:$PORT` for Render and similar hosts.

## Render

1. Web service from this repo.
2. Build: `docker build` or `npm ci && npm run start`.
3. Set env from `.env.example`.
4. Attach Supabase Postgres via `DATABASE_URL`.

## Verify

| Check | Command |
|-------|---------|
| Unit tests | `npm test` |
| Ledger + Supabase | `./scripts/smoke-ledger-supabase.sh` |
| Regtest LND pay | `./scripts/smoke-regtest.sh` (Docker) |
| MoMo sandbox | `./scripts/smoke-momo-sandbox.sh` (live keys) |

## Ops

- `RECONCILE_MS=15000` polls stuck MoMo transfers.
- `GET /metrics` exposes counters when API keys are set.
- Distinguish **Bitcoin received** (`LN_ACCEPTED`) from **RWF delivered** (`COMPLETE`) in client UX.
