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

Create a MoMo offramp:

```
curl -s localhost:8787/v1/payments \
  -H 'content-type: application/json' \
  -d '{"rail":"momo_rwf","amount_rwf":1350,"msisdn":"250788123456"}'
```

With `LN_BACKEND=memory`, complete it:

```
curl -s -X POST localhost:8787/v1/dev/pay/pay_...
```

## Layout

```
packages/shared     money, status, errors
services/ln-gateway LightningPort
services/momo-gateway MoMo disbursement
services/fx-rate    integer quotes
services/network-api HTTP + orchestration
```
