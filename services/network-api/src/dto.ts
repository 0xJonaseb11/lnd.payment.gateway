import { maskMsisdn, type Payment } from "@ln/shared";
import { z } from "zod";

const Msisdn = z.string().regex(/^250[0-9]{9}$/, "msisdn must be 250 plus 9 digits");

export const CreatePaymentBody = z.discriminatedUnion("rail", [
  z.object({
    rail: z.literal("momo_rwf"),
    amount_rwf: z.number().int().positive().max(5_000_000),
    msisdn: Msisdn,
    provider: z.enum(["mtn_momo", "airtel_momo"]).default("mtn_momo"),
  }),
  z.object({
    rail: z.literal("ledger"),
    amount_usdt_micros: z.string().regex(/^[0-9]+$/),
    account_id: z.string().min(3).max(64),
  }),
]);

export type CreatePaymentBody = z.infer<typeof CreatePaymentBody>;

export function toPaymentResponse(payment: Payment) {
  return {
    payment_id: payment.id,
    rail: payment.rail,
    status: payment.status,
    bolt11: payment.bolt11,
    amount_msat: payment.amountMsat.toString(),
    amount_usdt_micros: payment.amountUsdtMicros.toString(),
    amount_rwf: payment.amountRwf === null ? null : payment.amountRwf.toString(),
    fee_bps: payment.feeBps.toString(),
    fee_usdt_micros: payment.feeUsdtMicros.toString(),
    provider: payment.destination?.type ?? null,
    msisdn: payment.destination ? maskMsisdn(payment.destination.msisdn) : null,
    account_id: payment.accountId,
    expires_at: payment.expiresAt.toISOString(),
  };
}
