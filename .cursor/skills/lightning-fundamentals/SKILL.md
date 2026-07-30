---
name: lightning-fundamentals
description: >-
  Bitcoin Lightning Network concepts for NikoPay: payment channels, HTLCs,
  multihop routing, invoices (BOLT11), revocation, and why LN enables ~1s
  finality. Use when explaining Lightning, designing channel/liquidity strategy,
  or before implementing LND or offramp logic.
---

# Lightning fundamentals

## One-paragraph model

Two parties lock coins in a **2-of-2 multisig funding tx** (channel). They update balances off-chain by exchanging signed **commitment transactions**. Old states are **revoked** (breach → punishment). Payments across the network use **HTLCs** (hash + timelock) so multihop routes are atomic: all hops succeed or all fail. Bitcoin is the court of last resort.

## Why this matters for NikoPay

| On-chain BTC | Lightning |
|--------------|-----------|
| ~10 min+ confirms | ms–seconds once channels exist |
| Fee per payment | Amortized channel fees + tiny routing fees |
| Poor micropayments | Natural for remittance slices |

**Finality for offramp:** when our node **accepts/settles** the inbound HTLC/invoice, we treat BTC as received and may trigger MoMo. We do **not** wait for a Bitcoin block for that payment.

## Concepts agents must get right

### Payment channels

- Open = on-chain fund; Close = on-chain settle (cooperative or force)
- Capacity is fixed until resized; **inbound** liquidity needed to *receive*
- NikoPay as receiver needs inbound capacity from well-connected peers / LSP

### HTLCs

- Payee shares `H = hash(R)`; payer routes conditional payments redeemable with `R`
- Timelocks decrement along the path so intermediaries are safe
- Preimage `R` revelation settles the chain of hops

### Invoices (BOLT11)

- Encode amount, payment hash, expiry, destination, optional routing hints
- **Single-use** — never reuse an invoice after fulfillment (preimage known)
- Expired invoices must not be paid or accepted for goods

### Hold (HODL) invoices

- Node receives HTLC (`ACCEPTED`) but withholds preimage until app logic finishes
- Critical for LN→MoMo: settle only after MoMo success; cancel on failure
- Details: skill `lightning-rwf-offramp`

## Trust model

- Intermediary nodes are not trusted with custody of the payment (HTLC atomicity)
- Counterparties can force-close; online watchtowers/monitoring matter for hot nodes
- Offramp still trusts NikoPay for **honest MoMo disbursement** (hold invoices reduce *technical* failure loss, not malice with fake “delivered”)

## Deeper reading

- [reference.md](reference.md) — quotes from LND overview + paper pointers
- [docs/RESOURCES.md](../../../docs/RESOURCES.md)
