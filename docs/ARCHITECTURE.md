# NikoPay Lightning Service: Architecture

## Mission

Convert crypto to **RWF (Rwandan Francs)** via **MTN / Airtel Mobile Money**, with **~1 second finality** for the Bitcoin leg. Lightning Network is chosen because payments settle off-chain in milliseconds-seconds (no block confirmations), enabling MoMo disbursement to start immediately after invoice acceptance/settlement.

Product today ([nikopay.rw](https://www.nikopay.rw/)): USDT (TRC20) → MTN MoMo UI. Lightning is the next rail for **BTC → RWF** (and later Taproot Assets / stablecoins on Lightning). Competitor pattern: [Tando](https://tando.me/) (BTC Lightning → M-Pesa in Kenya).

## Non-goals (v1)

- Running a public routing node as the product (liquidity for *receiving* offramp invoices is enough)
- Replacing the existing USDT TRC20 flow (Lightning is additive)
- Full Taproot Assets production (Phase 2+)

## High-level system

```
┌─────────────┐     quote + BOLT11      ┌──────────────────┐
│ User wallet │◄───────────────────────►│  offramp-api     │
│ (Phoenix,   │     status / webhook    │  (NikoPay)       │
│  Zeus, …)   │                         └────────┬─────────┘
└──────┬──────┘                                  │
       │ pays invoice                            │ orchestrates
       ▼                                         ▼
┌─────────────┐                         ┌──────────────────┐
│ Lightning   │◄── gRPC / hold settle ──│  ln-gateway      │
│ Network     │                         │  (LND or BitGo)  │
└─────────────┘                         └──────────────────┘
                                                 │
                     FX lock + ledger            │
                                                 ▼
                                        ┌──────────────────┐
                                        │  fx-rate +       │
                                        │  ledger          │
                                        └────────┬─────────┘
                                                 │
                                                 ▼
                                        ┌──────────────────┐
                                        │  momo-gateway    │──► MTN MoMo
                                        │  Disbursement    │    Disbursements
                                        └──────────────────┘    (+ Airtel later)
```

## Core design principles

1. **Lightning finality first**: Treat invoice `ACCEPTED` (hold) or `SETTLED` as the crypto settlement signal: never wait for on-chain confirms for the payment itself.
2. **Hold invoices for atomicity (recommended)**: Accept HTLC → disburse RWF → settle preimage only on MoMo success; cancel/expire on failure so sats return to sender.
3. **Idempotency everywhere**: Every offramp has a stable `offramp_id`; MoMo `X-Reference-Id` = deterministic UUID from that id; never double-pay.
4. **Transparent quote**: Lock BTC→RWF rate + fees for a short TTL (e.g. 30-120s); invoice amount = locked sats.
5. **Float awareness**: Refuse quotes when MoMo float or inbound LN liquidity is insufficient.
6. **Auditability**: Append-only ledger of quote → accepted → disbursing → settled/failed/refunded.

## Lightning infrastructure choice

| Path | Pros | Cons | When |
|------|------|------|------|
| **Self-hosted LND** | Hold invoices, full control, learning aligned with this repo | Ops: channels, watchtowers, hot keys | **Default for build & Phase 1** |
| **BitGo Lightning custody** | Managed node/channels | Custodial, tx caps (~$500), less hold-invoice control | Optional enterprise parallel |

**Decision:** Build against **LND gRPC** behind `ln-gateway`. Keep BitGo as an alternate adapter later: not the primary learning path.

## Offramp state machine

```
CREATED → QUOTED → INVOICE_ISSUED → LN_ACCEPTED → DISBURSING
                                              ↘ FAILED_LN
                         DISBURSING → MOMO_SUCCESS → LN_SETTLED → COMPLETE
                                   ↘ MOMO_FAILED → LN_CANCELED → REFUNDED
                                   ↘ MOMO_UNKNOWN → MANUAL_REVIEW
```

- **COMPLETE**: User paid sats; recipient has RWF; hold settled.
- **REFUNDED**: MoMo failed; hold canceled/expired; sats back to sender.
- **MANUAL_REVIEW**: Ambiguous MoMo status after retries: ops playbook, never auto double-disburse.

## API surface (service)

Inspired by Pave-style discovery/quote/status (wallet pays only a BOLT11 invoice):

| Endpoint | Purpose |
|----------|---------|
| `GET /.well-known/nikopay-ln.json` | Discovery: rails, currencies, limits |
| `POST /v1/offramp/quote` | RWF amount + MSISDN → locked rate + BOLT11 |
| `GET /v1/offramp/{id}` | Status for UI / wallet polling |
| `POST /v1/webhooks/momo` | MoMo callback (if enabled) |
| Internal workers | Invoice subscription, settle/cancel, reconciliation |

## Security & compliance boundaries

- **Hot wallet**: Only LN operational balance; excess BTC swept on-chain cold / treasury policy.
- **Macaroons**: Least-privilege (`invoice` + settle for gateway; no admin in app servers).
- **Secrets**: MoMo keys, LND TLS, macaroons via env/secret manager: never in git.
- **KYC/AML**: Service-side (NikoPay), not on the Lightning wallet: follow Rwanda MoMo / remittance requirements as product policy evolves.
- **PII**: MSISDN encrypted at rest; minimize logs.

## Latency budget (~1s crypto finality)

| Step | Target |
|------|--------|
| LN payment reach + accept | < 1-3 s typical |
| Start MoMo transfer after accept | < 100 ms (async worker) |
| MoMo credit to user | Operator-dependent (often seconds); **UX truthfully separates “BTC received” vs “RWF delivered”** |

**Important:** “1 second finality” applies to the **Lightning settlement signal**, not a guarantee that MoMo posts in 1s. Product copy must show both stages (like Tando/NikoPay tracking).

## Liquidity model

- **Inbound LN capacity**: Enough to *receive* user payments (open channels / dual-fund / LSP).
- **RWF float**: MoMo disbursement wallet prefunded; alerts on low balance.
- **Treasury loop**: Periodically sell BTC → RWF to refill MoMo float (out of band / ops).

## Related artifacts

- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
- [OFFRAMP_FLOW.md](OFFRAMP_FLOW.md)
- [ROADMAP.md](ROADMAP.md)
- [RESOURCES.md](RESOURCES.md)
- Skills under `.cursor/skills/`
