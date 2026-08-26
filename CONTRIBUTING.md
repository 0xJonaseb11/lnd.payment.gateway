# Contributing

Thanks for helping improve the LN payment network.

## Setup

```
cp .env.example .env
npm ci
npm test
npm run dev
```

## Before you open a PR

1. Run `npm test` and `npm run typecheck`.
2. Keep changes focused. Match existing layout under `services/` and `packages/`.
3. No comments in TypeScript application code. Names and types carry meaning.
4. Integer money only (`msat`, RWF, USDT micros). No floats for value.
5. Do not commit secrets, macaroons, TLS keys, or `.env`.

## Branch flow

Open PRs against **`dev`**. `main` is the release line after review.

## Docs

Update `docs/` when behavior or env vars change. Start with `docs/ARCHITECTURE.md` and `docs/CODING_STANDARDS.md`.

