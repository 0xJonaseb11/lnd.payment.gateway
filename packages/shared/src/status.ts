import { AppError } from "./errors.ts";

export const PaymentStatus = {
  INVOICE_ISSUED: "INVOICE_ISSUED",
  LN_ACCEPTED: "LN_ACCEPTED",
  DISBURSING: "DISBURSING",
  COMPLETE: "COMPLETE",
  REFUNDED: "REFUNDED",
  MANUAL_REVIEW: "MANUAL_REVIEW",
  EXPIRED: "EXPIRED",
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

const ALLOWED: Record<PaymentStatus, readonly PaymentStatus[]> = {
  INVOICE_ISSUED: [PaymentStatus.LN_ACCEPTED, PaymentStatus.EXPIRED],
  LN_ACCEPTED: [PaymentStatus.DISBURSING, PaymentStatus.COMPLETE],
  DISBURSING: [
    PaymentStatus.COMPLETE,
    PaymentStatus.REFUNDED,
    PaymentStatus.MANUAL_REVIEW,
  ],
  COMPLETE: [],
  REFUNDED: [],
  MANUAL_REVIEW: [],
  EXPIRED: [],
};

export function canTransition(from: PaymentStatus, to: PaymentStatus): boolean {
  return ALLOWED[from].includes(to);
}

export function assertTransition(from: PaymentStatus, to: PaymentStatus): void {
  if (!canTransition(from, to)) {
    throw new AppError(
      "ILLEGAL_TRANSITION",
      `cannot move ${from} to ${to}`,
      409,
    );
  }
}
