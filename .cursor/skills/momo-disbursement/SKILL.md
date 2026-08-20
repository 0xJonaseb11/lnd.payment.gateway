---
name: momo-disbursement
description: >-
  MTN MoMo Disbursements API for Rwanda RWF payouts: sandbox setup, OAuth,
  transfer, status polling, idempotency, MSISDN formats. Use when implementing
  momo-gateway, RWF payouts, MoMo webhooks, or float checks.
---

# MoMo disbursement (RWF)

## Role in this network

After Lightning **ACCEPTED**, `momo-gateway` sends **RWF** to the recipient’s MTN Mobile Money wallet. Collections API is not the offramp path (that would pull from customer). **Disbursements** = B2C payout.

Portal: https://momodeveloper.mtn.com/

## Setup checklist

```
- [ ] Developer account on momodeveloper.mtn.com
- [ ] Subscribe to Disbursements product → subscription key
- [ ] Provision API User + API Key (sandbox)
- [ ] Confirm target environment string for Rwanda production (after KYC)
- [ ] Prefund disbursement float (prod) / use sandbox party IDs (dev)
```

## Auth pattern

1. Create API user (sandbox provisioning) + API key  
2. `POST` token endpoint with Basic(apiUser:apiKey) + `Ocp-Apim-Subscription-Key`  
3. Use `Bearer` access token on disbursement calls  
4. Refresh token before expiry  

Collections vs Disbursements use **separate** subscription keys and credentials: do not mix.

## Transfer

```
POST {BASE}/disbursement/v1_0/transfer
Headers:
  Authorization: Bearer {token}
  X-Reference-Id: {uuid}          # idempotency key: REQUIRED unique per logical payout
  X-Target-Environment: sandbox | <rwanda-prod-env>
  Ocp-Apim-Subscription-Key: {disbursement_key}
  Content-Type: application/json

Body:
  amount: "50000"                 # string decimal in RWF major units per MoMo docs
  currency: "RWF"                 # sandbox may use currency quirks: verify against portal
  externalId: "{payment_id}"
  payee: { partyIdType: "MSISDN", partyId: "2507..." }
  payerMessage: "LN network"
  payeeNote: "LN offramp"
```

Then:

```
GET {BASE}/disbursement/v1_0/transfer/{X-Reference-Id}
```

Map statuses to domain: pending / successful / failed / unknown.

Sandbox base: `https://sandbox.momodeveloper.mtn.com`

## Idempotency (non-negotiable)

- One offramp → one `X-Reference-Id` forever  
- Retries **reuse** the same reference  
- Before new transfer, check DB: if already `DISBURSING`/`MOMO_SUCCESS`, do not create a new reference  

## MSISDN

- Rwanda: country code `250`, no `+` in partyId typically  
- Validate length/prefix before quote  
- Never log full MSISDN in plaintext at info level in production (mask)

## Coupling to Lightning

| MoMo result | LN action |
|-------------|-----------|
| SUCCESSFUL | `SettleInvoice` |
| FAILED | `CancelInvoice` |
| UNKNOWN after retries | `MANUAL_REVIEW`: no settle, no second reference |

## Float

Before issuing quotes, check disbursement account balance. If below threshold + in-flight, reject quote.

## Airtel later

Implement a second adapter behind the same interface (`transfer`, `getStatus`, `getBalance`). Do not fork network-api logic.

## Related

- [reference.md](reference.md)
- Skill `lightning-rwf-offramp`
