---
name: lightning-rwf-offramp
description: >-
  Implements NikoPay Lightning BTC to RWF Mobile Money offramp: quotes, hold
  invoices, MoMo disbursement coupling, idempotency, and status machine. Use when
  building offramp-api, end-to-end LN payout flows, or anything BTC/sats to RWF.
---

# Lightning → RWF offramp

## Read first

1. [docs/ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)
2. [docs/OFFRAMP_FLOW.md](../../../docs/OFFRAMP_FLOW.md)
3. Skills: `momo-disbursement`, `lnd-operations`, `nikopay-mission`

## Canonical flow

```
Quote (RWF + MSISDN) → lock FX → hold BOLT11
→ user pays → LN ACCEPTED (~1s crypto finality)
→ MoMo transfer (idempotent)
→ success: SettleInvoice → COMPLETE
→ fail: CancelInvoice → REFUNDED
```

## Implementation rules

1. **Hold invoices by default**: do not settle LN before MoMo success.
2. **Idempotent MoMo**: `X-Reference-Id` deterministic from `offramp_id`.
3. **Conditional state transitions**: DB update `WHERE status = expected`.
4. **Gate quotes**: refuse if MoMo float low or inbound LN liquidity low.
5. **Honest UX**: “Bitcoin received” ≠ “RWF delivered”.
6. **Integer money**: msat + RWF minor units; no floats.
7. **Single-use invoices**: new invoice per quote; honor TTL.

## Service boundaries

| Service | Owns |
|---------|------|
| `offramp-api` | Orchestration + HTTP |
| `ln-gateway` | LND only |
| `momo-gateway` | MoMo only |
| `fx-rate` | Rate + fee + TTL |
| `reconciliation` | Ledger / stuck txs |

Do not call MoMo from `ln-gateway` or LND from `momo-gateway`.

## State machine (mandatory names)

`CREATED` → `QUOTED` → `INVOICE_ISSUED` → `LN_ACCEPTED` → `DISBURSING` → `MOMO_SUCCESS` → `LN_SETTLED` → `COMPLETE`

Failure branches: `EXPIRED` · `MOMO_FAILED` → `LN_CANCELED` → `REFUNDED` · `MOMO_UNKNOWN` → `MANUAL_REVIEW`

## API to implement

- `GET /.well-known/nikopay-ln.json`: discovery
- `POST /v1/offramp/quote`: issue hold invoice
- `GET /v1/offramp/:id`: status
- Worker: subscribe invoices; on ACCEPTED enqueue disburse
- Worker: MoMo terminal status → settle/cancel

## Latency

Optimize time from payment propagation → `LN_ACCEPTED` handling (<1-3s typical). MoMo is asynchronous; do not block HTTP on MoMo completion for the payer’s Lightning stack (settle happens in worker).

## Tests required before “done”

- Simnet pay + mock MoMo success → settled
- Mock MoMo fail → canceled / refund path
- Duplicate webhook → one disbursement
- Expired quote → no disburse

## Out of scope here

- USDT TRC20 bridge
- Taproot Assets (see skill `taproot-assets`)
- BitGo as primary (adapter only later)

## Examples

See [examples.md](examples.md) for orchestration pseudocode.
