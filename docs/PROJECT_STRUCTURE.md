# Project structure

```
LND/
├── AGENTS.md
├── README.md
├── docs/
├── .cursor/skills/
├── .cursor/rules/
├── packages/
│   ├── shared/               # money, status, ids, errors, logger
│   └── config/               # env schema
├── services/
│   ├── network-api/          # HTTP + payment orchestration
│   ├── ln-gateway/           # LightningPort (memory LND)
│   ├── momo-gateway/         # MomoPort (memory + HTTP)
│   └── fx-rate/              # integer quotes
├── infra/docker/
├── supabase/                 # Postgres schema (network.payments, ledger)
└── scripts/                  # regtest bootstrap + supabase ledger smoke
```

Gateways are **libraries** composed by `network-api`. They are not separate HTTP processes in v1.

## Boundaries

| Package | May call |
|---------|----------|
| `network-api` | fx, ln, momo, store |
| `ln-gateway` | LND only |
| `momo-gateway` | MoMo only |
| `fx-rate` | rates only |

## Stack

| Layer | Choice |
|-------|--------|
| Language | TypeScript (Node 20+) |
| HTTP | Hono, bind `0.0.0.0:$PORT` |
| LN | `LightningPort` (memory + LND REST) |
| Store | Supabase Postgres (`STORE_BACKEND=supabase`) |
| MoMo | Disbursements API |
| Tests | Vitest, mocked ports |

## Env

See `.env.example`. Never commit macaroons, TLS keys, MoMo secrets, or `DATABASE_URL`. Apply `supabase/migrations` with `supabase db push` (or the SQL editor), then set `STORE_BACKEND=supabase` and `DATABASE_URL` to the pooler URI (port 6543, `prepare` is off). Memory store remains the test default.
