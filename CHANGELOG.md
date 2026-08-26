# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- README oriented for production deploy
- Removed local smoke / bootstrap scripts from the tree

### Added

- `CONTRIBUTING.md` and `CHANGELOG.md`

## [0.1.0] - 2026-08-25

### Added

- `network-api` HTTP gateway with `momo_rwf` and `ledger` rails
- Hold-invoice flow: accept → MoMo or ledger fulfill → settle / cancel / refund
- LND REST adapter and optional second-node payer for local pay
- MoMo HTTP disbursement client, webhook path, and reconcile loop
- Supabase Postgres store (`network` schema) plus memory and file stores
- API keys (`NETWORK_API_KEYS`) and MoMo webhook secret (`MOMO_WEBHOOK_SECRET`)
- Live FX option, metrics endpoint, Docker image, CI, MIT license

### Security

- Timing-safe API key and webhook secret checks
- Discovery and health stay public; payment and metrics routes gated when keys are set
