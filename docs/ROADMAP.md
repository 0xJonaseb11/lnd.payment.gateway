# Roadmap — Lightning → RWF for NikoPay

Agents should implement in phase order. Do not skip liquidity/idempotency foundations.

## Phase 0 — Agent readiness (this repo)

- [x] Restructured `AGENTS.md`
- [x] Architecture + structure + flow docs
- [x] Project skills under `.cursor/skills/`
- [ ] Local Docker: bitcoind/btcd + LND simnet/regtest
- [ ] Smoke: create invoice, pay, settle

## Phase 1 — LN receive path (no MoMo yet)

- [ ] `packages/shared` status machine + money types
- [ ] `ln-gateway` gRPC client (macaroon + TLS)
- [ ] Hold invoice create / subscribe / settle / cancel
- [ ] `offramp-api` quote stub (fixed FX) → BOLT11
- [ ] Integration tests on simnet

**Exit criteria:** Pay invoice from second LND; API observes `LN_ACCEPTED` then settle.

## Phase 2 — MoMo sandbox disbursement

- [ ] `momo-gateway` token + transfer + status
- [ ] Wire `LN_ACCEPTED` → disbursement with idempotent reference
- [ ] Settle hold only on MoMo `SUCCESSFUL`
- [ ] Cancel hold on MoMo `FAILED`
- [ ] `MANUAL_REVIEW` path for unknown

**Exit criteria:** End-to-end simnet LN + MoMo sandbox credit (or recorded sandbox success).

## Phase 3 — Production hardening

- [ ] Real FX source + fee policy + quote TTL
- [ ] Float + inbound liquidity gates
- [ ] Postgres ledger + reconciliation job
- [ ] Watchtower / backup / macaroon rotation runbooks
- [ ] Observability (metrics: accept latency, settle latency, MoMo success rate)
- [ ] Security review of hot wallet + secrets

**Exit criteria:** Testnet (or limited mainnet) pilot with ops dashboard.

## Phase 4 — Product integration

- [ ] NikoPay UI: Lightning rail beside USDT
- [ ] Receipts + realtime status (BTC received / RWF sent)
- [ ] Limits, fraud checks, support tooling
- [ ] Airtel Money adapter (same `momo-gateway` interface)

## Phase 5 — Taproot Assets (supervisor track)

- [ ] Evaluate USDT/stable asset on LN via `tapd`
- [ ] Edge node / swap design vs plain BTC offramp
- [ ] Only after Phase 3 stability

## Explicit out of order

| Temptation | Why wait |
|------------|----------|
| BitGo before LND | Blocks learning hold-invoice control |
| Taproot Assets before BTC offramp | Extra moving parts |
| Mainnet channels before idempotent MoMo | Capital risk |
| Claiming 1s RWF delivery | MoMo is not LN; UX must be honest |
