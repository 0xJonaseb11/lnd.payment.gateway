# AGENTS.md: LN payment network

> **Mission:** Run a Lightning payment network that processes **stablecoin-denominated** payments with **~1 second LN finality**, and offramp to **RWF on MTN MoMo**. This repo is network tooling, not a wallet app.

---

## Product context

| | |
|--|--|
| **Network** | LND hold invoices, USDT micros as unit of account |
| **Offramp** | MoMo Disbursements (RWF) |
| **Also** | Internal ledger rail (credit USDT after LN accept) |
| **Clients** | Any app that can `POST /v1/payments` with an API key |
| **Competitor pattern** | [Tando](https://tando.me/): Lightning → mobile money |

---

## Agent quickstart

1. Read **this file**.
2. Load **`ln-payment-network`** then **`network-architecture`**.
3. For MoMo offramp detail, load **`lightning-rwf-offramp`** and **`momo-disbursement`**.
4. Place code under `services/*` and `packages/*`.
5. Follow [`docs/ROADMAP.md`](docs/ROADMAP.md).

**Do** use hold invoices so MoMo failure refunds sats. **Do not** start with BitGo. Taproot Assets is Phase 5 (stablecoins *on* LN channels).

---

## Blueprint artifacts

| Doc | Purpose |
|-----|---------|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Network design, rails, state machine |
| [`docs/PROJECT_STRUCTURE.md`](docs/PROJECT_STRUCTURE.md) | Layout and stack |
| [`docs/OFFRAMP_FLOW.md`](docs/OFFRAMP_FLOW.md) | MoMo rail sequence and API |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Phase gates |
| [`docs/RESOURCES.md`](docs/RESOURCES.md) | External docs |
| [`docs/CODING_STANDARDS.md`](docs/CODING_STANDARDS.md) | Quality bar |

---

## Coding rules (quality bar)

Enforce via [`.cursor/rules/`](.cursor/rules/). Summary:

- **No comments** in app/TS code. Clarity via names and types only.
- **NatSpec allowed** on Solidity (`*.sol`) only.
- Strict TypeScript, branded money/IDs, validate at boundaries.
- Thin handlers; dumb gateways; orchestration in `network-api`.
- Idempotent MoMo; conditional state transitions; efficient LN accept path.
- Tests: deterministic, mocked ports; behavior over snapshots.
- **Voice:** no em dashes, no AI filler, sentence case only.
- **UI:** reuse existing tokens if a UI exists; do not invent a look.

| Rule | Applies |
|------|---------|
| [`coding-quality`](.cursor/rules/coding-quality.mdc) | Always |
| [`ln-network`](.cursor/rules/ln-network.mdc) | Always (mission) |
| [`voice-and-copy`](.cursor/rules/voice-and-copy.mdc) | Always |
| [`typescript-conventions`](.cursor/rules/typescript-conventions.mdc) | `*.ts` / `*.tsx` |
| [`service-layering`](.cursor/rules/service-layering.mdc) | `services/**` |
| [`api-conventions`](.cursor/rules/api-conventions.mdc) | `network-api/**` |
| [`frontend-ui`](.cursor/rules/frontend-ui.mdc) | UI files |
| [`testing-conventions`](.cursor/rules/testing-conventions.mdc) | `*.test.ts` / `*.spec.ts` |
| [`solidity-natspec`](.cursor/rules/solidity-natspec.mdc) | `*.sol` |

---

## Skills

| Skill | When to use |
|-------|-------------|
| [`ln-payment-network`](.cursor/skills/ln-payment-network/SKILL.md) | Network scope, rails, run/test |
| [`network-mission`](.cursor/skills/network-mission/SKILL.md) | Product scope / RWF offramp questions |
| [`network-architecture`](.cursor/skills/network-architecture/SKILL.md) | File placement, conventions |
| [`lightning-fundamentals`](.cursor/skills/lightning-fundamentals/SKILL.md) | Channels, HTLCs, invoices |
| [`lnd-operations`](.cursor/skills/lnd-operations/SKILL.md) | Install LND, macaroons, gRPC |
| [`lightning-rwf-offramp`](.cursor/skills/lightning-rwf-offramp/SKILL.md) | MoMo offramp coupling |
| [`momo-disbursement`](.cursor/skills/momo-disbursement/SKILL.md) | MTN Disbursements API |
| [`taproot-assets`](.cursor/skills/taproot-assets/SKILL.md) | Phase 5 multi-asset LN |

---

## Target architecture

```
Wallet ──pays BOLT11──► ln-gateway (LND)
                           ▲
network-api ◄──quote/status┤
    │                      │ hold accept → settle/cancel
    ├── fx-rate (USDT↔BTC↔RWF)
    ├── store (Supabase Postgres)
    ├── ledger (USDT micros)
    └── momo-gateway ──► MTN MoMo (RWF)
```

**Atomicity (MoMo rail):** Hold invoice → disburse RWF → settle preimage on success; cancel on failure.

---

## Non-negotiables

1. ~1s goal applies to the **Lightning settlement signal**, not a MoMo SLA.
2. **Idempotent** MoMo transfers; never double-pay.
3. **No secrets** in git.
4. Respect **`docs/ROADMAP.md`**.
5. Update skills/docs when architecture changes.
6. Clean, comment-free TS (NatSpec on contracts only), efficient hot paths.

---

## Run

```
npm test
npm run dev
```

`LN_BACKEND=memory` (default): `POST /v1/dev/pay/:id` simulates payment.
