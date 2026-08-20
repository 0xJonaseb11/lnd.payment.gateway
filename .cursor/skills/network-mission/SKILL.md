---
name: network-mission
description: >-
  LN payment network mission: Rwanda RWF offramp goals, competitor context
  (Tando), and 1-second Lightning finality. Use when starting Lightning offramp,
  MoMo, or LND work in this repo, or when clarifying scope versus USDT TRC20.
---

# Network mission

## What we are building

This repository is **LND payment network tooling**. It processes **stablecoin-denominated** payments (USDT micros) with hold invoices, and offramps to **RWF on MTN MoMo** (Airtel later). Clients call `/v1/payments`. It is infrastructure, not a retail wallet app.

## Why Lightning

- Off-chain payments: milliseconds-seconds, no block waits
- Low fees for remittance-sized amounts
- Enforceable via Bitcoin as arbiter (channels + HTLCs)
- Matches competitor **Tando** (Kenya): user pays LN invoice → local mobile money credited

## Success definition

| Layer | Success |
|-------|---------|
| Crypto | LN invoice accepted/settled in ~1s typical |
| Fiat | MoMo disbursement follows immediately after accept; UX shows both stages |
| Product | Transparent rate + fee; trackable receipt; no double payout |
| Trust | Prefer hold invoices so MoMo failure refunds sats |

## Positioning

- Bridge, not a retail exchange UI for trading
- Sender keeps funds in their LN wallet until they pay the invoice
- The network operator holds **LN receive liquidity + RWF float** to complete the bridge
- Compliance/KYC is a **service** concern (Rwanda rails), not something wallets embed in BOLT11

## Competitor takeaways (Tando)

- Any LN wallet can pay; recipient needs only MoMo
- Instant *feel* depends on LN liquidity + MoMo API reliability
- Clear separation: BTC in → local currency out

## Do / Don’t

**Do**

- Read `docs/ARCHITECTURE.md` + `docs/OFFRAMP_FLOW.md` before coding
- Use skills: `lightning-rwf-offramp`, `lnd-operations`, `momo-disbursement`
- Follow `docs/ROADMAP.md` phase order

**Don’t**

- Claim MoMo always posts in 1 second
- Start with Taproot Assets or BitGo before a working LND hold-invoice offramp
- Mix USDT-TRC20 settlement logic into the LN gateway

## Related

- Blueprint index: [AGENTS.md](../../../AGENTS.md)
- Resources: [docs/RESOURCES.md](../../../docs/RESOURCES.md)
