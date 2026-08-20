---
name: lnd-operations
description: >-
  Install, configure, and operate LND for this payment network: chain backends,
  wallets, macaroons, channels, invoices, gRPC, simnet/testnet. Use when setting
  up LND, Docker lightning stacks, lncli, hold invoices, or ln-gateway
  integration.
---

# LND operations

## Default stance for this repo

- **Primary:** self-hosted **LND** + gRPC behind `services/ln-gateway`
- **Dev network:** simnet/regtest first, then testnet, then mainnet
- **Auth:** macaroons + TLS (never `--no-macaroons` outside throwaway local)

Official install: https://dev.lightning.community/guides/installation/

## Backend modes

| Backend | Use |
|---------|-----|
| `bitcoind` + ZMQ | Common production-like |
| `btcd` | Alternative full node |
| `neutrino` | Light client; ok for experiments |

Need ZMQ rawblock + rawtx for bitcoind. Avoid pruned backends unless you fully understand birth/channel history constraints.

## Minimal mental checklist

```
Task Progress:
- [ ] Chain backend synced (or simnet ready)
- [ ] lnd started with correct network flags
- [ ] lncli create / unlock wallet (backup cipher seed offline)
- [ ] Macaroon paths known (invoice vs admin)
- [ ] Peer connect + inbound capacity plan
- [ ] gRPC reachable from ln-gateway with TLS
```

## Interfaces

- `lncli`: ops and debugging
- **gRPC**: application integration (preferred)
- REST proxy: only if gRPC blocked; streaming weaker

## Invoice ops (app-facing)

| Need | Direction |
|------|-----------|
| Normal receive | `AddInvoice` |
| Offramp atomicity | **Hold invoice** + `SettleInvoice` / `CancelInvoice` |
| Watch payment | `SubscribeInvoices` / `LookupInvoice` |
| Liquidity gate | Channel balances / remote balance inbound |

Exact RPC names can vary slightly by LND version: verify against current API docs when implementing.

## Macaroon least privilege

- App servers: **invoice** macaroon (+ settle/cancel capability as required), not full admin
- Admin macaroon: break-glass / channel ops only
- Store paths via env; never commit `*.macaroon` or `tls.key`

## Channel lifecycle (ops, not per payment)

1. `ConnectPeer` pubkey@host
2. `OpenChannel` local amt (confirmations required)
3. Operate
4. `CloseChannel` cooperative when done

Autopilot optional; for offramp **receiving**, prioritize **inbound** liquidity (loop-in, dual fund, LSP, or peer push).

## BitGo (optional later)

BitGo manages node/channels for custody LN wallets (`subType: lightningCustody`). Use only as an alternate `ln-gateway` adapter after LND path works. See https://developers.bitgo.com/docs/bitcoin-lightning/

## Related

- [reference.md](reference.md): commands and conf snippets
- Skill `lightning-rwf-offramp` for product wiring
- `infra/docker/` for compose (when added)
