# LN payment network: architecture

## Mission

This repo is an **LND payment network**. Payments are denominated in **stable units (USDT micros)**. Lightning hold invoices are the crypto settlement rail (~1s accept). **MTN MoMo RWF** is the fiat offramp rail. Clients call `network-api`; this repo is not a NikoPay app.

## What ships in v1

| Piece | Role |
|-------|------|
| `network-api` | HTTP + orchestration |
| `ln-gateway` | Hold invoice port (memory + LND REST) |
| `momo-gateway` | Disbursements port (memory + HTTP sandbox) |
| `fx-rate` | Integer USDT / BTC / RWF quotes |
| store | Payments + ledger in Supabase Postgres (`PaymentStore`) |
| `packages/shared` | Money, status machine, ids, errors |

Two rails:

1. **`momo_rwf`**: pay Lightning → hold → MoMo RWF → settle or refund.
2. **`ledger`**: pay Lightning → credit USDT micros on an internal account → settle.

## Non-goals (v1)

- Public routing node as the product
- Taproot Assets issuance (`tapd`) as the stablecoin transport
- BitGo as the primary Lightning host

Stablecoin *denomination* is live. Stablecoin *on Lightning channels* waits for Taproot Assets.

## High-level system

```
Wallet ──pays BOLT11──► ln-gateway (LND hold invoice)
                           ▲
network-api ◄──quote/status┤
    │                      │ accept → settle / cancel
    ├── fx-rate (USDT↔BTC↔RWF)
    ├── store (Supabase Postgres)
    ├── ledger (USDT micros)
    └── momo-gateway ──► MTN MoMo Disbursement (RWF)
```

## Principles

1. Lightning accept/settle is the crypto finality signal. Do not wait for blocks.
2. Hold invoices for MoMo: settle preimage only after SUCCESSFUL disbursement.
3. Idempotent MoMo `X-Reference-Id` derived from `payment_id`.
4. Integer money only (`Msat`, `UsdtMicros`, `Rwf`).
5. Gate quotes on MoMo float and inbound LN capacity.
6. UX: "Bitcoin received" is not "RWF delivered".

## State machine

```
INVOICE_ISSUED → LN_ACCEPTED → DISBURSING → COMPLETE
                              ↘ COMPLETE          ↘ REFUNDED
                   (ledger)                        ↘ MANUAL_REVIEW
INVOICE_ISSUED → EXPIRED
```

## API

| Endpoint | Purpose |
|----------|---------|
| `GET /.well-known/ln-network.json` | Discovery |
| `POST /v1/payments` | Create hold invoice (momo or ledger) |
| `GET /v1/payments/{id}` | Status |
| `GET /v1/accounts/{id}` | Ledger balance |
| `POST /v1/dev/pay/{id}` | Test pay (memory payer or `lnd-payer`) |

## Latency

| Step | Target |
|------|--------|
| LN accept | < 1-3 s typical |
| Start MoMo after accept | immediate handoff |
| MoMo credit | operator-dependent; separate UX stage |

## Related

- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
- [OFFRAMP_FLOW.md](OFFRAMP_FLOW.md)
- [ROADMAP.md](ROADMAP.md)
