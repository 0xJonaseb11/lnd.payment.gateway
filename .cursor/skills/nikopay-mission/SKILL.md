---
name: nikopay-mission
description: >-
  NikoPay product mission, Rwanda RWF offramp goals, competitor context (Tando),
  and 1-second Lightning finality requirements. Use when starting any NikoPay,
  Lightning offramp, MoMo, or LND work in this repo, or when clarifying product
  scope versus USDT TRC20.
---

# NikoPay mission

## What we are building

**NikoPay** ([nikopay.rw](https://www.nikopay.rw/)) makes crypto spendable in Rwanda as **RWF on Mobile Money** (MTN MoMo first; Airtel later).

Today’s live narrative is **USDT (TRC20) → MTN MoMo**. This repository is the **LND payment network** (stablecoin units, hold invoices) with **MoMo RWF** as the offramp. NikoPay is a client of that network.

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
- NikoPay operates **LN receive liquidity + RWF float** to complete the bridge
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
