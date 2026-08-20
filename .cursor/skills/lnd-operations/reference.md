# LND operations: reference

## Install (from upstream guide; pin Go version to current LND docs when building)

```bash
# After Go toolchain is installed and PATH set:
git clone https://github.com/lightningnetwork/lnd
cd lnd
make install
```

## Example bitcoind + lnd (testnet-shaped)

`bitcoin.conf` fragment:

```
server=1
txindex=1
zmqpubrawblock=tcp://127.0.0.1:28332
zmqpubrawtx=tcp://127.0.0.1:28333
```

`lnd` flags (illustrative):

```
lnd --bitcoin.active --bitcoin.testnet --bitcoin.node=bitcoind \
  --bitcoind.rpcuser=USER --bitcoind.rpcpass=PASS \
  --bitcoind.zmqpubrawblock=tcp://127.0.0.1:28332 \
  --bitcoind.zmqpubrawtx=tcp://127.0.0.1:28333
```

Simnet/regtest: swap network flags; mine blocks locally for channel confs.

## Wallet

```
lncli create    # first run: backup 24-word seed
lncli unlock    # subsequent starts
```

## Useful lncli

```
lncli getinfo
lncli connect <pubkey>@host:9735
lncli openchannel --node_key=... --local_amt=...
lncli listchannels
lncli addinvoice --amt=... --memo=...
lncli lookupinvoice --rhash=...
lncli decodepayreq <bolt11>
```

## gRPC from apps

- Host: typically `localhost:10009`
- Transport credentials: LND TLS cert
- Per-RPC creds: macaroon bytes metadata
- Prefer streaming invoice subscription over polling when possible

## Units reminder

APIs mix sat and msat: normalize to **msat integers** in this codebase.
