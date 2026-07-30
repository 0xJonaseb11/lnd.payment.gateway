# Project structure

Blueprint for the NikoPay Lightning → RWF service. Agents MUST place new code under these paths unless the user directs otherwise.

```
LND/
├── AGENTS.md                 # Mission hub + skill index (start here)
├── README.md
├── docs/                     # Blueprints for humans + agents
│   ├── ARCHITECTURE.md
│   ├── PROJECT_STRUCTURE.md  # this file
│   ├── OFFRAMP_FLOW.md
│   ├── RESOURCES.md
│   └── ROADMAP.md
├── .cursor/
│   ├── skills/               # Domain skills (primary agent guidance)
│   └── rules/                # Short always-on conventions
├── services/
│   ├── offramp-api/          # Public HTTP: quote, status, discovery, webhooks
│   ├── ln-gateway/           # LND (or BitGo) adapter: invoices, subscribe, settle/cancel
│   ├── momo-gateway/         # MTN MoMo Disbursements (+ Airtel later)
│   ├── fx-rate/              # BTC/RWF quotes, fee schedule, TTL locks
│   └── reconciliation/       # Ledger, float checks, ops reports
├── packages/
│   ├── shared/               # Types, state machine, ids, errors, logging
│   └── config/               # Env schema (zod/etc), network presets
├── infra/
│   └── docker/               # bitcoind/btcd + lnd + api compose for local/testnet
├── apps/                     # Optional thin UIs / admin (later)
│   └── admin/                # Ops: floats, stuck offramps, manual review
└── scripts/                  # Dev helpers (channel open, simnet mine, smoke tests)
```

## Service responsibilities

### `offramp-api`

- Orchestrates the offramp lifecycle
- Issues quotes via `fx-rate`
- Asks `ln-gateway` for hold invoices
- On `LN_ACCEPTED`, calls `momo-gateway.transfer`
- On MoMo success/failure, settle or cancel via `ln-gateway`
- Persists state in DB (Postgres recommended)

### `ln-gateway`

- Thin wrapper over LND gRPC (preferred) or REST proxy
- `AddHoldInvoice` / `SettleInvoice` / `CancelInvoice` / `SubscribeInvoices`
- Channel balance / inbound liquidity checks for quote gating
- Never embeds MoMo or FX logic

### `momo-gateway`

- OAuth token for Disbursements product
- `POST /disbursement/v1_0/transfer` with idempotent `X-Reference-Id`
- Status poll + webhook handler normalization
- Currency `RWF`, MSISDN `250…` (Rwanda), `X-Target-Environment` per sandbox/prod

### `fx-rate`

- Source of BTC/RWF (and later USDT/RWF) mid + spread
- Fee policy (e.g. NikoPay service fee %)
- Quote objects with `expires_at` and satoshi amount

### `reconciliation`

- Daily settle reports: sats in vs RWF out
- Detect stuck `DISBURSING` / `MOMO_UNKNOWN`
- Float thresholds and alerts

### `packages/shared`

- `OfframpStatus` enum matching [ARCHITECTURE.md](ARCHITECTURE.md)
- `OfframpId`, money types (`Msats`, `Rwf`)
- Error codes for API clients

## Suggested stack (default)

| Layer | Choice |
|-------|--------|
| Language | TypeScript (Node 20+) for API gateways — matches web product velocity |
| HTTP | Fastify or Hono |
| DB | Postgres + migrations |
| Queue/jobs | Postgres-backed worker or Redis/BullMQ |
| LN | LND gRPC (`@lightninglabs/ln-service` or native grpc) |
| Local net | Docker Compose: `bitcoind` regtest/simnet or `btcd` + `lnd` |
| Deploy | Later: VPS/K8s with persistent volumes for LND |

Agents may deviate only with an explicit architecture note in the PR/commit rationale.

## Env surface (names only)

```
# LND
LND_GRPC_HOST=
LND_TLS_CERT_PATH=
LND_MACAROON_PATH=

# MoMo
MOMO_DISBURSEMENT_SUBSCRIPTION_KEY=
MOMO_API_USER=
MOMO_API_KEY=
MOMO_TARGET_ENV=sandbox|mtnrwanda
MOMO_BASE_URL=

# App
DATABASE_URL=
QUOTE_TTL_SECONDS=
FX_BTC_RWF_SOURCE=
```

## What not to put in the repo

- Live macaroons, TLS keys, MoMo production keys
- LND chain data directories
- Real customer MSISDNs in fixtures (use sandbox numbers)
