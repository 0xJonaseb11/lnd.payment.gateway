# Local Lightning

Default development uses `LN_BACKEND=memory` in `network-api` (hold invoices in process, no node required).

When you are ready for a real LND:

1. Follow skill `lnd-operations` and https://dev.lightning.community/guides/installation/
2. Point `LND_REST_HOST`, `LND_TLS_CERT_PATH`, and `LND_MACAROON_PATH` in `.env`
3. Keep MoMo on `memory` until sandbox keys exist
