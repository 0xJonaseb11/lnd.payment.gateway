# AGENTS.md — NikoPay Lightning

> **Mission:** Make crypto spendable as **RWF on Mobile Money** with **~1 second Lightning finality** on the Bitcoin leg. This repo gathers Lightning knowledge and the blueprint/skills to build NikoPay’s **BTC (Lightning) → MTN/Airtel MoMo** offramp.

---

## Product context

| | |
|--|--|
| **Product** | [NikoPay](https://www.nikopay.rw/) — stablecoins/crypto → Rwandan Francs via Mobile Money |
| **Today** | USDT (TRC20) → MTN MoMo (UI live; waitlist) |
| **This repo** | Lightning Network rail: **sats in → RWF out** |
| **Finality goal** | LN accept/settle in ~1s; MoMo payout starts immediately after (MoMo latency separate in UX) |
| **Competitor** | [Tando](https://tando.me/) — Lightning → M-Pesa (Kenya) |

---

## Agent quickstart

1. Read **this file** (mission + index).
2. Load skill **`nikopay-mission`** then **`nikopay-architecture`**.
3. For implementation, load **`lightning-rwf-offramp`** (+ `lnd-operations` / `momo-disbursement` as needed).
4. Follow phase order in [`docs/ROADMAP.md`](docs/ROADMAP.md).
5. Place code only under the layout in [`docs/PROJECT_STRUCTURE.md`](docs/PROJECT_STRUCTURE.md).

**Do not** start with Taproot Assets or BitGo as the primary path. **Do** use **hold invoices** so MoMo failure can refund sats.

---

## Blueprint artifacts (source of truth)

| Doc | Purpose |
|-----|---------|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System design, state machine, liquidity, security |
| [`docs/PROJECT_STRUCTURE.md`](docs/PROJECT_STRUCTURE.md) | Repo/service layout and stack defaults |
| [`docs/OFFRAMP_FLOW.md`](docs/OFFRAMP_FLOW.md) | Sequence diagrams, API shapes, failure paths |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Phased delivery gates |
| [`docs/RESOURCES.md`](docs/RESOURCES.md) | Curated external docs (paper, LND, MoMo, Taproot, BitGo) |

---

## Skills (focus — load these)

Project skills live in [`.cursor/skills/`](.cursor/skills/). Descriptions trigger discovery; read `SKILL.md` fully before coding in that domain.

| Skill | When to use |
|-------|-------------|
| [`nikopay-mission`](.cursor/skills/nikopay-mission/SKILL.md) | Any NikoPay / RWF / scope question |
| [`nikopay-architecture`](.cursor/skills/nikopay-architecture/SKILL.md) | Scaffolding, file placement, conventions |
| [`lightning-fundamentals`](.cursor/skills/lightning-fundamentals/SKILL.md) | Channels, HTLCs, invoices, finality model |
| [`lnd-operations`](.cursor/skills/lnd-operations/SKILL.md) | Install LND, macaroons, channels, gRPC |
| [`lightning-rwf-offramp`](.cursor/skills/lightning-rwf-offramp/SKILL.md) | **Core product flow** BTC LN → RWF |
| [`momo-disbursement`](.cursor/skills/momo-disbursement/SKILL.md) | MTN MoMo Disbursements API |
| [`taproot-assets`](.cursor/skills/taproot-assets/SKILL.md) | Phase 2+ multi-asset LN (supervisor track) |

---

## Target architecture (summary)

```
Wallet ──pays BOLT11──► LND (ln-gateway)
                           ▲
Offramp API ◄──quote/status─┤
    │                      │ hold accept → settle/cancel
    ├── fx-rate (BTC↔RWF)
    └── momo-gateway ──► MTN MoMo Disbursement (RWF)
```

**Atomicity:** Hold invoice → disburse RWF → settle preimage on success; cancel on failure.

---

## Resource map

Full table: [`docs/RESOURCES.md`](docs/RESOURCES.md). Highlights:

### Lightning theory

- Intro concepts (channels, HTLCs, blockchain as arbiter) — see skill `lightning-fundamentals`
- [White paper](https://lightning.network/lightning-network-paper.pdf)
- [Docs index](https://lightning.network/docs/) · [Summary](https://lightning.network/lightning-network-summary.pdf)
- Slides: [technical](https://lightning.network/lightning-network-technical-summary.pdf) · [overview](https://lightning.network/lightning-network.pdf) · [SF Social](https://lightning.network/lightning-network-presentation-sfbitcoinsocial-2015-05-26.pdf) · [Time](https://lightning.network/lightning-network-presentation-time-2015-07-06.pdf)

### LND (build target)

- [Overview](https://dev.lightning.community/overview/) — **required conceptual read**
- [Installation](https://dev.lightning.community/guides/installation/) — **required setup**

### Optional / later

- [BitGo Lightning](https://developers.bitgo.com/docs/bitcoin-lightning/) — custody adapter, not v1 default
- [Taproot Assets](https://docs.lightning.engineering/the-lightning-network/taproot-assets) — multi-asset LN; supervisor priority for later phases

### Fiat rail

- [MoMo Getting Started](https://momodeveloper.mtn.com/api-documentation/getting-started) — Disbursements for RWF payout

---

## Non-negotiables for agents

1. ~1s goal applies to **Lightning settlement signal**, not a MoMo SLA claim.
2. **Idempotent** MoMo transfers; never double-pay.
3. **No secrets** in git (macaroons, MoMo keys, `.env`).
4. Respect **`docs/ROADMAP.md`** phase order.
5. Prefer updating skills/docs when architecture decisions change.

---

## Lightning intro (condensed)

Lightning scales Bitcoin with **off-chain bidirectional payment channels**. Parties update balances by exchanging signed transactions without broadcasting each payment. **HTLCs** enable multihop atomic payments across the channel graph. Security is enforced by Bitcoin scripts if counterparties cheat or go offline. Result: high volume, low fees, **millisecond-to-second** payments — the reason NikoPay chooses Lightning for fast offramp initiation.
