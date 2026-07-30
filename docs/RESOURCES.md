# Curated resources

Authoritative links for NikoPay Lightning → RWF. Prefer these over random web summaries.

## Mission / product

| Resource | Why |
|----------|-----|
| [nikopay.rw](https://www.nikopay.rw/) | Current product (USDT→MoMo UI); Lightning is planned rail |
| [tando.me](https://tando.me/) | Competitor pattern: LN → mobile money (Kenya M-Pesa) |
| [Pave protocol](https://github.com/GBKS/pave-protocol/blob/main/SPEC.md) | Open quote/discovery/hold-invoice pattern for LN→fiat rails |

## Lightning fundamentals

| Resource | Why |
|----------|-----|
| [Lightning Network paper (PDF)](https://lightning.network/lightning-network-paper.pdf) | Original design: channels, HTLCs, enforceability |
| [lightning.network/docs](https://lightning.network/docs/) | Paper + summaries + slides index |
| [Summary PDF](https://lightning.network/lightning-network-summary.pdf) | Short overview |
| [Technical summary PDF](https://lightning.network/lightning-network-technical-summary.pdf) | Technical slides |
| [SF Bitcoin Social slides](https://lightning.network/lightning-network-presentation-sfbitcoinsocial-2015-05-26.pdf) | Presentation |
| [Time & Bitcoin slides](https://lightning.network/lightning-network-presentation-time-2015-07-06.pdf) | Presentation |

## LND (primary implementation target)

| Resource | Why |
|----------|-----|
| [LND Overview](https://dev.lightning.community/overview/) | Channels, HTLCs, invoices, payment lifecycle, gRPC |
| [Installation guide](https://dev.lightning.community/guides/installation/) | **Required** local/testnet setup |
| [API reference](https://lightning.engineering/api-docs/) | gRPC/REST methods |
| [Invoices (Lightning Labs)](https://docs.lightning.engineering/the-lightning-network/payment-lifecycle/understanding-lightning-invoices.md) | BOLT11 |

## Enterprise LN (optional adapter)

| Resource | Why |
|----------|-----|
| [BitGo Bitcoin Lightning](https://developers.bitgo.com/docs/bitcoin-lightning/) | Custody LN wallets, units (msat), create wallet |
| [BitGo LN overview](https://developers.bitgo.com/docs/wallets-lightning-overview/) | Managed node, invoice/pay guides, limits |

## Taproot Assets (Phase 2+ / supervisor priority)

| Resource | Why |
|----------|-----|
| [Taproot Assets](https://docs.lightning.engineering/the-lightning-network/taproot-assets) | Issue assets on Bitcoin, move on LN |
| [Taproot Assets on Lightning](https://docs.lightning.engineering/the-lightning-network/taproot-assets/taproot-assets-on-lightning.md) | Stablecoins on LN, edge swaps, BTC-routed invoices |
| [tapd](https://docs.lightning.engineering/lightning-network-tools/taproot-assets) | Daemon implementation |

Query Lightning Labs docs with `?ask=` on `.md` URLs when detail is missing.

## Mobile Money (RWF payout)

| Resource | Why |
|----------|-----|
| [MoMo Getting Started](https://momodeveloper.mtn.com/api-documentation/getting-started) | Portal onboarding |
| [momodeveloper.mtn.com](https://momodeveloper.mtn.com/) | Products: Collections, Disbursements, Remittance |
| Disbursements | `POST /disbursement/v1_0/transfer` + status GET: **primary for offramp** |

Sandbox base: `https://sandbox.momodeveloper.mtn.com`  
Production: country-specific target environment (Rwanda) after KYC approval.

## Internal blueprints

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
- [OFFRAMP_FLOW.md](OFFRAMP_FLOW.md)
- [ROADMAP.md](ROADMAP.md)
