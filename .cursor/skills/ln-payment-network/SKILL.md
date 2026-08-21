---
name: ln-payment-network
description: >-
  LND payment network that processes stablecoin-denominated payments, with
  hold invoices and MoMo RWF offramp. Use when building network-api, rails,
  ledger credits, quotes, or client integrations.
---

# LN payment network

## Read first

1. [docs/ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)
2. [docs/OFFRAMP_FLOW.md](../../../docs/OFFRAMP_FLOW.md)
3. Skills: `lightning-rwf-offramp`, `lnd-operations`, `momo-disbursement`

## Product

This is a **payment network**:

- Unit of account: **USDT micros**
- Settlement: **LND hold invoices** (memory port now, real LND next)
- Offramp: **MoMo RWF** (`rail: momo_rwf`)
- Internal credit: **ledger** (`rail: ledger`)

Clients call `/v1/payments`.

## Code map

| Path | Job |
|------|-----|
| `packages/shared` | Money, status, ids, `AppError` |
| `services/ln-gateway` | `LightningPort` |
| `services/momo-gateway` | `MomoPort` |
| `services/fx-rate` | Integer quotes |
| `services/network-api` | Orchestration + Hono + `PaymentStore` |

## Rules

1. Hold invoices for MoMo. Settle only on SUCCESSFUL.
2. `momoReferenceId(paymentId)` is the only disbursement key.
3. Conditional status updates. Duplicate accept is a no-op.
4. No comments in TS. No floats for money.
5. Do not call MoMo from `ln-gateway`.
6. Persistence is Supabase Postgres. Do not orchestrate LN or MoMo in Edge Functions.

## Run

```
npm test
npm run dev
```

Memory backend: `POST /v1/dev/pay/:id` simulates Lightning pay.

## Auth

`NETWORK_API_KEYS` gates `/v1/payments`, status, accounts, metrics, and `/v1/dev/pay`. `MOMO_WEBHOOK_SECRET` gates `POST /v1/webhooks/momo` via `X-Callback-Secret`. Empty values stay open for tests. Details: `docs/OFFRAMP_FLOW.md`.

## Next

Run `./scripts/smoke-regtest.sh` when Docker is available (ticks Phase 1 regtest smoke). MoMo sandbox E2E needs live `MOMO_*` keys.
