import {
  asMsat,
  asRwf,
  asUsdtMicros,
  momoReferenceId,
  Rail,
  type LedgerAccount,
  type Payment,
  type PaymentStatus,
} from "@ln/shared";

export type PaymentWrite = {
  id: string;
  rail: string;
  status: string;
  amount_rwf: string | null;
  amount_usdt_micros: string;
  amount_msat: string;
  fee_bps: string;
  fee_usdt_micros: string;
  destination_type: string | null;
  msisdn: string | null;
  account_id: string | null;
  payment_hash: string;
  preimage: string;
  bolt11: string;
  momo_reference_id: string | null;
  expires_at: Date;
  created_at: Date;
};

export type PaymentRow = {
  id: string;
  rail: string;
  status: string;
  amount_rwf: string | number | bigint | null;
  amount_usdt_micros: string | number | bigint;
  amount_msat: string | number | bigint;
  fee_bps: string | number | bigint;
  fee_usdt_micros: string | number | bigint;
  destination_type: string | null;
  msisdn: string | null;
  account_id: string | null;
  payment_hash: string;
  preimage: string;
  bolt11: string;
  momo_reference_id: string | null;
  expires_at: Date | string;
  created_at: Date | string;
};

export type AccountRow = {
  id: string;
  usdt_micros: string | number | bigint;
};

function asBigInt(value: string | number | bigint): bigint {
  return typeof value === "bigint" ? value : BigInt(value);
}

function asDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function momoRefFor(payment: Payment): string | null {
  return payment.rail === Rail.momo_rwf ? momoReferenceId(payment.id) : null;
}

export function toPaymentRow(payment: Payment): PaymentWrite {
  return {
    id: payment.id,
    rail: payment.rail,
    status: payment.status,
    amount_rwf: payment.amountRwf === null ? null : payment.amountRwf.toString(),
    amount_usdt_micros: payment.amountUsdtMicros.toString(),
    amount_msat: payment.amountMsat.toString(),
    fee_bps: payment.feeBps.toString(),
    fee_usdt_micros: payment.feeUsdtMicros.toString(),
    destination_type: payment.destination?.type ?? null,
    msisdn: payment.destination?.msisdn ?? null,
    account_id: payment.accountId,
    payment_hash: payment.paymentHash,
    preimage: payment.preimage,
    bolt11: payment.bolt11,
    momo_reference_id: momoRefFor(payment),
    expires_at: payment.expiresAt,
    created_at: payment.createdAt,
  };
}

export function fromPaymentRow(row: PaymentRow): Payment {
  return {
    id: row.id,
    rail: row.rail === Rail.ledger ? Rail.ledger : Rail.momo_rwf,
    status: row.status as PaymentStatus,
    amountRwf: row.amount_rwf === null ? null : asRwf(asBigInt(row.amount_rwf)),
    amountUsdtMicros: asUsdtMicros(asBigInt(row.amount_usdt_micros)),
    amountMsat: asMsat(asBigInt(row.amount_msat)),
    feeBps: asBigInt(row.fee_bps),
    feeUsdtMicros: asUsdtMicros(asBigInt(row.fee_usdt_micros)),
    destination:
      row.msisdn && (row.destination_type === "mtn_momo" || row.destination_type === "airtel_momo")
        ? { type: row.destination_type, msisdn: row.msisdn }
        : null,
    accountId: row.account_id,
    paymentHash: row.payment_hash,
    preimage: row.preimage,
    bolt11: row.bolt11,
    expiresAt: asDate(row.expires_at),
    createdAt: asDate(row.created_at),
  };
}

export function fromAccountRow(row: AccountRow): LedgerAccount {
  return {
    id: row.id,
    usdtMicros: asUsdtMicros(asBigInt(row.usdt_micros)),
  };
}

export function paymentUpdateRow(payment: Payment): Omit<PaymentWrite, "id"> {
  const row = toPaymentRow(payment);
  return {
    rail: row.rail,
    status: row.status,
    amount_rwf: row.amount_rwf,
    amount_usdt_micros: row.amount_usdt_micros,
    amount_msat: row.amount_msat,
    fee_bps: row.fee_bps,
    fee_usdt_micros: row.fee_usdt_micros,
    destination_type: row.destination_type,
    msisdn: row.msisdn,
    account_id: row.account_id,
    payment_hash: row.payment_hash,
    preimage: row.preimage,
    bolt11: row.bolt11,
    momo_reference_id: row.momo_reference_id,
    expires_at: row.expires_at,
    created_at: row.created_at,
  };
}
