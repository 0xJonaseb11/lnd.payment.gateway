---
name: ln-payment-network
description: >-
  LND payment network that processes stablecoin-denominated payments, with
  hold invoices and MoMo RWF offramp. Use when building network-api, rails,
  ledger credits, quotes, or anything beyond NikoPay-only scope.
---

# LN payment network

## Read first

1. [docs/ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)
2. [docs/OFFRAMP_FLOW.md](../../../docs/OFFRAMP_FLOW.md)
3. Skills: `lightning-rwf-offramp`, `lnd-operations`, `momo-disbursement`

## Product

Not a NikoPay-only repo. This is a **payment network**:

- Unit of account: **USDT micros**
- Settlement: **LND hold invoices** (memory port now, real LND next)
- Offramp: **MoMo RWF** (`rail: momo_rwf`)
- Internal credit: **ledger** (`rail: ledger`)

NikoPay is a client of this network.

## Code map

| Path | Job |
|------|-----|
| `packages/shared` | Money, status, ids, `AppError` |
| `services/ln-gateway` | `LightningPort` |
| `services/momo-gateway` | `MomoPort` |
| `services/fx-rate` | Integer quotes |
| `services/network-api` | Orchestration + Hono |

## Rules

1. Hold invoices for MoMo. Settle only on SUCCESSFUL.
2. `momoReferenceId(paymentId)` is the only disbursement key.
3. Conditional status updates. Duplicate accept is a no-op.
4. No comments in TS. No floats for money.
5. Do not call MoMo from `ln-gateway`.

## Run

```
npm test
npm run dev
```

Memory backend: `POST /v1/dev/pay/:id` simulates Lightning pay.

## Next

Run `./scripts/regtest-bootstrap.sh` when you want real LND pay. Keep orchestration on `PayerPort`. Do not pay from the receive node.
