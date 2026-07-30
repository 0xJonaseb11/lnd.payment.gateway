# Offramp examples

## Happy path (orchestration pseudocode)

```ts
async function onQuote(req) {
  await assertMomoFloat(req.amount_rwf);
  await assertInboundLiquidity(estimateMsat(req));
  const quote = await fx.lock({ amountRwf: req.amount_rwf, msisdn: req.msisdn });
  const { preimage, paymentHash } = generateHoldSecret(); // store preimage server-side
  const bolt11 = await ln.addHoldInvoice({
    hash: paymentHash,
    valueMsat: quote.amount_msat,
    expiry: quote.ttl_seconds,
  });
  return db.insertOfframp({ status: "INVOICE_ISSUED", quote, bolt11, paymentHash });
}

async function onInvoiceAccepted(offrampId) {
  await db.transition(offrampId, from: "INVOICE_ISSUED", to: "LN_ACCEPTED");
  await db.transition(offrampId, from: "LN_ACCEPTED", to: "DISBURSING");
  const ref = uuidV5(offrampId, NIKOPAY_NS);
  const result = await momo.transfer({ referenceId: ref, ... });
  if (result.status === "SUCCESSFUL") {
    await ln.settle(preimage);
    await db.transition(offrampId, to: "COMPLETE");
  } else if (result.status === "FAILED") {
    await ln.cancel(paymentHash);
    await db.transition(offrampId, to: "REFUNDED");
  } else {
    await db.transition(offrampId, to: "MANUAL_REVIEW");
  }
}
```

## Discovery document (sketch)

```json
{
  "name": "NikoPay Lightning",
  "base_url": "https://api.nikopay.rw/ln/v1",
  "currencies": ["RWF"],
  "rails": ["mtn_momo"],
  "min_rwf": 1000,
  "max_rwf": 500000,
  "hold_invoices": true
}
```
