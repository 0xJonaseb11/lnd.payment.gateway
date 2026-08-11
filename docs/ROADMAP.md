# Roadmap: LN payment network

## Phase 0: Agent readiness

- [x] Skills, rules, blueprints
- [x] Shared domain + ports + network-api
- [x] Vitest: momo success/fail/unknown, duplicate accept, expiry, float gate, ledger rail
- [x] Compose stack for real LND (optional beside memory backend)

## Phase 1: Real LND

- [x] `LightningPort` REST adapter (`createLndRest`)
- [x] SubscribeInvoices → `onInvoiceAccepted`
- [ ] Simnet pay from a second node (ops: run compose, open channel)

## Phase 2: MoMo sandbox

- [x] HTTP disbursement client (`createHttpMomo`)
- [x] Callback/webhook path (`POST /v1/webhooks/momo`)
- [ ] End-to-end sandbox credit with live MoMo keys

## Phase 3: Persistence and ops

- [x] File store (`STORE_PATH`)
- [x] Live BTC-USD feed (`FX_LIVE=true`)
- [x] Reconciliation job
- [x] `/metrics` counters
- [ ] Postgres when volume needs it

## Phase 4: Product

- [ ] NikoPay UI as a client of `/v1/payments`
- [x] Airtel destination type behind the same MoMo port
- [x] Status payload separates rail, provider, and amount_rwf

## Phase 5: Taproot Assets

- [ ] USDT (or other) on LN via `tapd`
- [ ] Keep MoMo offramp; swap FX at the edge if needed
