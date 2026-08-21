# Roadmap: LN payment network

## Phase 0: Agent readiness

- [x] Skills, rules, blueprints
- [x] Shared domain + ports + network-api
- [x] Vitest: momo success/fail/unknown, duplicate accept, expiry, float gate, ledger rail
- [x] Compose stack for real LND (optional beside memory backend)

## Phase 1: Real LND

- [x] `LightningPort` REST adapter (`createLndRest`)
- [x] SubscribeInvoices → `onInvoiceAccepted`
- [x] Simnet pay from a second node (`lnd-payer` + `PayerPort`)

## Phase 2: MoMo sandbox

- [x] HTTP disbursement client (`createHttpMomo`)
- [x] Callback/webhook path (`POST /v1/webhooks/momo`)
- [ ] End-to-end sandbox credit with live MoMo keys

## Phase 3: Persistence and ops

- [x] File store (`STORE_PATH`, local fallback)
- [x] Supabase store (`STORE_BACKEND=supabase`, `DATABASE_URL`)
- [x] Live ledger smoke (`./scripts/smoke-ledger-supabase.sh`)
- [x] Live BTC-USD feed (`FX_LIVE=true`)
- [x] Reconciliation job
- [x] `/metrics` counters

## Phase 4: Network clients

- [x] Authenticated access to `/v1/payments` for external clients
- [x] Airtel destination type behind the same MoMo port
- [x] Status payload separates rail, provider, and amount_rwf

## Phase 5: Taproot Assets

- [ ] USDT (or other) on LN via `tapd`
- [ ] Keep MoMo offramp; swap FX at the edge if needed
