# MoMo disbursement: reference

## Products (portal)

| Product | This network |
|---------|-------------|
| Disbursements | **Primary**: pay out RWF |
| Collections | Optional: customer deposits / other products |
| Remittance | Evaluate later for cross-border |

## Env vars (names)

```
MOMO_BASE_URL=https://sandbox.momodeveloper.mtn.com
MOMO_DISBURSEMENT_SUBSCRIPTION_KEY=
MOMO_API_USER=
MOMO_API_KEY=
MOMO_TARGET_ENV=sandbox
MOMO_CALLBACK_HOST=   # if using callbacks
```

## Error pitfalls

- Missing/duplicate `X-Reference-Id`
- Wrong `X-Target-Environment`
- Using Collections token on Disbursements
- Assuming sandbox currency equals production `RWF` without checking portal sample
- Not handling async: HTTP 202-style accept ≠ money delivered

## Testing strategy

1. Unit-test gateway with recorded HTTP fixtures  
2. Sandbox transfer to documented test MSISDN  
3. Force fail path (invalid party) → ensure LN cancel still triggered in orchestration tests with mocks  

## Official docs

- Getting started: https://momodeveloper.mtn.com/api-documentation/getting-started  
- API list: https://momodeveloper.mtn.com/apis  

Always re-check portal for Rwanda-specific production host and target environment strings before mainnet money movement.
