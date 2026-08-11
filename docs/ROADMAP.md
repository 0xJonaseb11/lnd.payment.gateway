# Roadmap: LN payment network

## Phase 0: Agent readiness

- [x] Skills, rules, blueprints
- [x] Shared domain + ports + network-api
- [x] Vitest: momo success/fail/unknown, duplicate accept, expiry, float gate, ledger rail
- [ ] Compose stack for real LND (optional beside memory backend)

## Phase 1: Real LND

- [ ] `LightningPort` REST or gRPC adapter
- [ ] SubscribeInvoices → `onInvoiceAccepted`
- [ ] Simnet pay from a second node

## Phase 2: MoMo sandbox

- [x] HTTP disbursement client (`createHttpMomo`)
- [ ] End-to-end sandbox credit with `MOMO_BACKEND=http`
- [ ] Callback/webhook path

## Phase 3: Persistence and ops

- [ ] Postgres store (replace memory maps)
- [ ] Real FX source
- [ ] Reconciliation job
- [ ] Observability on accept and MoMo success rate

## Phase 4: Product

- [ ] NikoPay UI as a client of `/v1/payments`
- [ ] Airtel adapter behind `MomoPort`
- [ ] Receipts: Bitcoin received vs RWF delivered

## Phase 5: Taproot Assets

- [ ] USDT (or other) on LN via `tapd`
- [ ] Keep MoMo offramp; swap FX at the edge if needed
