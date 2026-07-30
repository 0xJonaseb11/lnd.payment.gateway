# Lightning fundamentals: reference

## From LND overview (dev.lightning.community)

**Payment channels:** Funding tx locks coins; many off-chain updates; closing tx (or breach remedy) hits chain. Revocation secrets punish broadcasting outdated states.

**Multihop:** Alice→Bob→Carol→Dave via nested HTLCs with decrementing timelocks; Dave reveals `R`; others settle off-chain preferably.

**Network layers:**

1. Bitcoin network (chain backend)
2. P2P (peer connect)
3. Channel graph (payment channels)

**Software:** `bitcoind`/`btcd`/`neutrino` + `lnd`/`lncli`. Programmatic control: **gRPC preferred**, REST proxy secondary.

## Payment lifecycle (receive)

1. `addinvoice` / hold invoice with amount + memo + expiry
2. Payer `decodepayreq` then `sendpayment`
3. Payee observes settled/accepted via `lookupinvoice` / subscribe stream

## Units

- 1 BTC = 1e8 satoshi
- Lightning often uses **millisatoshi** (msat): 1 sat = 1000 msat
- Always store integer msat in DB; never floats

## NikoPay mapping

```
User LN payment  →  our LND inbound channel  →  accept/settle
                                              →  MoMo RWF out
```

Channel open/close are rare ops; **per-offramp** work is invoice + MoMo only.
