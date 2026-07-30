---
name: nikopay-architecture
description: >-
  NikoPay Lightning service blueprint: repo layout, service boundaries, stack
  defaults, roadmap phases, and coding conventions. Use when scaffolding
  services, placing files, choosing tech, or directing other agents on structure.
---

# NikoPay architecture skill

## Start here every time

1. [docs/ARCHITECTURE.md](../../../docs/ARCHITECTURE.md) — system design  
2. [docs/PROJECT_STRUCTURE.md](../../../docs/PROJECT_STRUCTURE.md) — where code goes  
3. [docs/ROADMAP.md](../../../docs/ROADMAP.md) — phase gates  
4. Domain skill for the task (`lightning-rwf-offramp`, `lnd-operations`, `momo-disbursement`, …)

## Repo layout (do not invent parallel trees)

```
services/offramp-api|ln-gateway|momo-gateway|fx-rate|reconciliation
packages/shared|config
infra/docker
docs/
.cursor/skills/
```

## Defaults

| Concern | Choice |
|---------|--------|
| Language | TypeScript (Node 20+) |
| DB | Postgres |
| LN | LND gRPC via `ln-gateway` |
| MoMo | Disbursements API via `momo-gateway` |
| Atomicity | Hold invoices |

## Conventions

- Money: integer `msat`, integer RWF (agree minor/major in `packages/shared` and stick to it)
- IDs: opaque `offramp_id`; MoMo reference derived deterministically
- Errors: typed codes; never leak macaroons/MSISDN in client errors
- Secrets: env / secret manager only
- Tests: orchestration tests with mocked LN + MoMo; one simnet e2e smoke

## Scaffolding order

```
Phase 0 docker lnd → Phase 1 ln-gateway + shared → Phase 2 momo-gateway
→ wire offramp-api → fx-rate real → reconciliation
```

## Anti-patterns

- Fat controllers calling LND + MoMo directly from Next.js route handlers without gateways
- Settling invoices before MoMo success
- New top-level folders that duplicate `services/` or `docs/`
- Implementing Taproot Assets or BitGo before hold-invoice BTC path

## When stuck

Re-read `lightning-rwf-offramp` + `OFFRAMP_FLOW.md`. If product scope unclear, `nikopay-mission`.
