# Offramp examples

## Happy path

See `services/network-api/src/service.ts`: `create` then `onInvoiceAccepted`.

MoMo success → `settle`. MoMo fail → `cancel`. Duplicate accept is ignored after `INVOICE_ISSUED`.
