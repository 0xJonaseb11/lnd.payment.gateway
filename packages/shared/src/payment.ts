import type { Msat, Rwf, UsdtMicros } from "./money.ts";
import type { PaymentStatus } from "./status.ts";

export const Rail = {
  momo_rwf: "momo_rwf",
  ledger: "ledger",
} as const;

export type Rail = (typeof Rail)[keyof typeof Rail];

export type MomoDestination = {
  readonly type: "mtn_momo";
  readonly msisdn: string;
};

export type Payment = {
  readonly id: string;
  readonly rail: Rail;
  readonly status: PaymentStatus;
  readonly amountRwf: Rwf | null;
  readonly amountUsdtMicros: UsdtMicros;
  readonly amountMsat: Msat;
  readonly feeBps: bigint;
  readonly feeUsdtMicros: UsdtMicros;
  readonly destination: MomoDestination | null;
  readonly accountId: string | null;
  readonly paymentHash: string;
  readonly preimage: string;
  readonly bolt11: string;
  readonly expiresAt: Date;
  readonly createdAt: Date;
};

export type LedgerAccount = {
  readonly id: string;
  readonly usdtMicros: UsdtMicros;
};
