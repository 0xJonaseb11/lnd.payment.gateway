# LN payment network

Lightning Network service that processes **stablecoin-denominated** payments (USDT micros) with hold invoices, and offramps to **RWF via MTN MoMo**.

## Start here

| Audience | Start |
|----------|--------|
| Humans | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |
| Agents | [`AGENTS.md`](AGENTS.md) |

## Run

```
cp .env.example .env
npm test
npm run dev
```

Create a MoMo offramp (add `-H 'Authorization: Bearer <key>'` when `NETWORK_API_KEYS` is set):

```
curl -s localhost:8787/v1/payments \
  -H 'content-type: application/json' \
  -d '{"rail":"momo_rwf","amount_rwf":1350,"msisdn":"250788123456"}'
```

With a payer (memory, or `lnd-payer` after bootstrap):

```
curl -s -X POST localhost:8787/v1/dev/pay/pay_...
```

Two-node regtest: `./scripts/regtest-bootstrap.sh`

Regtest hold-invoice pay (needs Docker):

```
./scripts/smoke-regtest.sh
```

Live ledger against Supabase (requires `STORE_BACKEND=supabase` and `DATABASE_URL`):

```
./scripts/smoke-ledger-supabase.sh
```

## Layout

```
packages/shared     money, status, errors
services/ln-gateway LightningPort
services/momo-gateway MoMo disbursement
services/fx-rate    integer quotes
services/network-api HTTP + orchestration
supabase/           payments + ledger schema
scripts/            regtest bootstrap + smokes
```

Supabase is the payment store. Set `STORE_BACKEND=supabase` and `DATABASE_URL` after applying `supabase/migrations`. Tests keep the memory store.
