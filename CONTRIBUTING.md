# Contributing

Thanks for helping improve the LN payment network.

## Setup

```
cp .env.example .env
npm ci
npm test
npm run typecheck
npm run dev
```

Node 20+ is required.

## Before you open a PR

1. Run `npm test` and `npm run typecheck`.
2. Keep changes focused. Match existing layout under `services/` and `packages/`.
3. No comments in TypeScript application code. Names and types carry meaning.
4. Integer money only (`msat`, RWF, USDT micros). No floats for value.
5. Do not commit secrets, macaroons, TLS keys, or `.env`.
6. Update `CHANGELOG.md` under Unreleased when behavior or public API changes.

## Branch flow

Open PRs against **`dev`**. `main` is the release line.

## Scope

This repo is a payment gateway. Prefer thin handlers, dumb gateways, and orchestration in `network-api`. Do not add a wallet UI here.

## Code of conduct

Be direct, respectful, and specific in reviews and issues.
