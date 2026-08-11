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
└── scripts/
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
| LN | `LightningPort` (memory now, LND REST/gRPC next) |
| MoMo | Disbursements API |
| Tests | Vitest, mocked ports |

## Env

See `.env.example`. Never commit macaroons, TLS keys, or MoMo secrets.
