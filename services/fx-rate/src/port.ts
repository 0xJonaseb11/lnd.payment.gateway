import type { Msat, Rwf, UsdtMicros } from "@ln/shared";

export type LockedQuote = {
  readonly amountRwf: Rwf | null;
  readonly amountUsdtMicros: UsdtMicros;
  readonly feeUsdtMicros: UsdtMicros;
  readonly invoiceUsdtMicros: UsdtMicros;
  readonly amountMsat: Msat;
  readonly feeBps: bigint;
  readonly rwfPerUsdt: bigint;
  readonly usdtPerBtc: bigint;
  readonly expiresAt: Date;
};

export type FxPort = {
  quoteMomo(amountRwf: Rwf): LockedQuote;
  quoteLedger(amountUsdtMicros: UsdtMicros): LockedQuote;
};
