# Coding standards

Canonical quality bar for NikoPay Lightning. Rules in `.cursor/rules/` enforce this during edits; this doc is the human/agent reference.

## Principles

1. Readable without comments: names and types explain intent.
2. Small, correct changes: no speculative frameworks.
3. Strict boundaries: gateways stay dumb; orchestration stays central.
4. Safe money: integers only; idempotent mutations.
5. Fast critical path: LN accept to enqueue disburse with minimal work on the subscription thread.
6. Human voice and real product UI: no AI-sounding copy; follow NikoPay theme only.

## Comments policy

| Code | Comments |
|------|----------|
| TypeScript / app services | None |
| Tests | None (test names document intent) |
| Solidity | NatSpec required on public API |

## Voice and UI

| Rule | Requirement |
|------|-------------|
| Em dashes | Never (`—`). Use commas, periods, colons, or parentheses. |
| Capitalization | Sentence case. No Title Case Labels. |
| Copy | Plain, specific. No AI filler words or hype stacks. |
| Theme | Reuse NikoPay tokens/components. Do not invent a palette or "AI SaaS" look. |
| Layout | No purple glows, pill-chip hero clutter, or decorative card grids. |

Details: `.cursor/rules/voice-and-copy.mdc`, `.cursor/rules/frontend-ui.mdc`.

## Naming

| Kind | Convention |
|------|------------|
| Files / dirs | `kebab-case` folders; pick one of `camelCase.ts` or `kebab-case.ts` per package and keep it |
| Types / classes | `PascalCase` |
| Functions / vars | `camelCase` |
| Constants | `SCREAMING_SNAKE` or `as const` objects |
| Status strings | Exact enum from architecture (`LN_ACCEPTED`, ...) |
| HTTP JSON | `snake_case` |
| Money fields | `amount_msat`, `amount_rwf` (never ambiguous `amount` at boundaries) |

## Layering checklist

- [ ] Route/handler only validates and maps
- [ ] Domain service owns state transitions
- [ ] `ln-gateway` has zero MoMo imports
- [ ] `momo-gateway` has zero LND imports
- [ ] Errors typed with stable `code`
- [ ] Idempotency key stable across retries

## Efficiency checklist

- [ ] No N+1 DB or RPC in loops
- [ ] No unbounded `Promise.all` on user-sized lists without concurrency limits
- [ ] Subscriptions preferred over tight poll loops
- [ ] Logging structured and sampled on hot paths (no full BOLT11/PII at info level)
- [ ] Dependencies justified; no unused packages

## Rules index

| Rule file | Scope |
|-----------|--------|
| `coding-quality.mdc` | Always |
| `voice-and-copy.mdc` | Always |
| `typescript-conventions.mdc` | `*.ts` / `*.tsx` |
| `service-layering.mdc` | `services/**` |
| `api-conventions.mdc` | `services/offramp-api/**` |
| `frontend-ui.mdc` | UI files |
| `testing-conventions.mdc` | `*.test.ts` / `*.spec.ts` |
| `solidity-natspec.mdc` | `*.sol` |
| `nikopay-lightning.mdc` | Always (mission) |
