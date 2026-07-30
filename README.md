# NikoPay Lightning (LND learning + offramp service)

Build the **Bitcoin Lightning → RWF Mobile Money** rail for [NikoPay](https://www.nikopay.rw/).

## Start here

| Audience | Start |
|----------|--------|
| Humans | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) → [`docs/ROADMAP.md`](docs/ROADMAP.md) |
| Agents | [`AGENTS.md`](AGENTS.md) → `.cursor/skills/` |

## Goal

User pays a Lightning invoice → NikoPay receives sats (~1s finality) → MTN MoMo (then Airtel) credits **RWF**.

## Layout

```
docs/           Blueprints
.cursor/skills/ Agent skills (primary)
services/       offramp-api, ln-gateway, momo-gateway, …
packages/       shared types/config
infra/docker/   Local LND stack (forthcoming)
```

## Status

Blueprint + skills complete. Implementation follows `docs/ROADMAP.md` Phase 0+.
