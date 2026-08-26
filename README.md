# LN payment network

Open source payment gateway for **Lightning hold invoices** with **MoMo RWF offramp** and an internal **ledger** rail. USDT micros are the unit of account. Clients call `POST /v1/payments`.

Built for integrators: wallets, remittance apps, and any service that needs Lightning in and local currency out.

## What it does

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

Create a MoMo offramp (add `-H 'Authorization: Bearer <key>'` when `NETWORK_API_KEYS` is set):

```
curl -s localhost:8787/v1/payments \
  -H 'content-type: application/json' \
  -d '{"rail":"momo_rwf","amount_rwf":1350,"msisdn":"250788123456"}'
```

Simulate Lightning pay (memory backend only):

```
curl -s -X POST localhost:8787/v1/dev/pay/pay_...
```

Discovery: `GET /.well-known/ln-network.json`

## Docs

| Doc | Purpose |
|-----|---------|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System design |
| [`docs/OFFRAMP_FLOW.md`](docs/OFFRAMP_FLOW.md) | API, auth, statuses |
| [`docs/DEPLOY.md`](docs/DEPLOY.md) | Production wiring |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Phase gates |
| [`docs/CODING_STANDARDS.md`](docs/CODING_STANDARDS.md) | Quality bar |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | PR flow |

## Smoke tests

| Script | Needs |
|--------|-------|
| `./scripts/smoke-ledger-supabase.sh` | Supabase `DATABASE_URL` |
| `./scripts/smoke-regtest.sh` | Docker + two LND nodes |
| `./scripts/smoke-momo-sandbox.sh` | Live MoMo sandbox keys |

## Production

```
npm run start
```

Or Docker: see [`docs/DEPLOY.md`](docs/DEPLOY.md).

Set `STORE_BACKEND=supabase`, `LN_BACKEND=lnd_rest`, `MOMO_BACKEND=http`, and lock down `NETWORK_API_KEYS` plus `MOMO_WEBHOOK_SECRET`.

## Layout

```
packages/shared     money, status, errors
services/ln-gateway LightningPort
services/momo-gateway MoMo disbursement
services/fx-rate    integer quotes
services/network-api HTTP + orchestration
supabase/           payments + ledger schema
scripts/            bootstrap + smokes
```

## License

MIT. See [`LICENSE`](LICENSE).
