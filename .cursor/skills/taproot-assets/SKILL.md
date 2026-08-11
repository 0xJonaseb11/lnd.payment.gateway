---
name: taproot-assets
description: >-
  Taproot Assets (tapd) for multi-asset Bitcoin and Lightning: stablecoins on LN,
  edge swaps, and future NikoPay USDT-on-Lightning path. Use when evaluating or
  implementing Taproot Assets, tapd, or asset-denominated Lightning invoices.
---

# Taproot Assets (Phase 2+)

## When to use this skill

Only after the LND payment network and MoMo rail are stable (`docs/ROADMAP.md` Phase 5). Taproot Assets is how stablecoins move *on* Lightning channels. v1 already *denominates* in USDT micros while settling BTC hold invoices.

## What it is

Protocol to **issue assets on Bitcoin** (Taproot metadata) and transfer them **in Lightning channels** for instant, low-fee asset payments. BTC remains the routing backbone; edge nodes can swap asset ↔ BTC.

Docs:

- https://docs.lightning.engineering/the-lightning-network/taproot-assets
- https://docs.lightning.engineering/the-lightning-network/taproot-assets/taproot-assets-on-lightning.md

## Why NikoPay might care later

| Today | Future with Taproot Assets |
|-------|----------------------------|
| USDT on TRC20 → MoMo | USDT (or RWF-pegged asset) **on Lightning** → MoMo |
| Separate chain bridges | LN invoice UX unified with BTC rail |
| On-chain TRON latency | LN-speed stablecoin leg |

Atomic BTC↔asset forwards at edge nodes can let wallets pay in BTC while NikoPay receives a stable asset (or vice versa).

## Design constraints

- Needs `tapd` + asset-aware channels + universe/proofs ops
- Exchange rates at edge nodes are **integrator-defined** (not protocol-set)
- Liquidity in **both** BTC and asset channels
- Still need MoMo RWF float: assets don’t remove fiat rail

## Agent rules

1. Do not block BTC offramp work on Taproot Assets  
2. If prototyping, isolate under `services/tap-gateway/` (future): do not overload `ln-gateway` until interfaces are clear  
3. Prefer querying Lightning Labs docs with `?ask=` on `.md` URLs for up-to-date protocol details  

## Decision record (current)

**Adopt later:** keep watching; implement BTC hold-invoice offramp first; revisit when stable asset issuance + channel liquidity is operationally realistic for Rwanda corridor.
