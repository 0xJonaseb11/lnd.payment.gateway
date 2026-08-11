import {
  AppError,
  assertTransition,
  asUsdtMicros,
  type LedgerAccount,
  type Payment,
  type PaymentStatus,
  type UsdtMicros,
} from "@ln/shared";

export type PaymentStore = {
  insert(payment: Payment): void;
  get(id: string): Payment | undefined;
  byPaymentHash(hash: string): Payment | undefined;
  transition(
    id: string,
    from: PaymentStatus,
    to: PaymentStatus,
    patch?: Partial<Payment>,
  ): Payment;
  getAccount(id: string): LedgerAccount;
  credit(accountId: string, micros: UsdtMicros): LedgerAccount;
};

export function createMemoryStore(): PaymentStore {
  const payments = new Map<string, Payment>();
  const byHash = new Map<string, string>();
  const accounts = new Map<string, LedgerAccount>();

  return {
    insert(payment) {
      if (payments.has(payment.id)) {
        throw new AppError("PAYMENT_EXISTS", "payment id already used", 409);
      }
      payments.set(payment.id, payment);
      byHash.set(payment.paymentHash, payment.id);
    },

    get(id) {
      return payments.get(id);
    },

    byPaymentHash(hash) {
      const id = byHash.get(hash);
      return id ? payments.get(id) : undefined;
    },

    transition(id, from, to, patch) {
      const current = payments.get(id);
      if (!current) {
        throw new AppError("PAYMENT_NOT_FOUND", "unknown payment", 404);
      }
      if (current.status !== from) {
        throw new AppError(
          "STALE_STATUS",
          `expected ${from}, found ${current.status}`,
          409,
        );
      }
      assertTransition(from, to);
      const next: Payment = { ...current, ...patch, status: to };
      payments.set(id, next);
      return next;
    },

    getAccount(id) {
      return accounts.get(id) ?? { id, usdtMicros: asUsdtMicros(0n) };
    },

    credit(accountId, micros) {
      const current = this.getAccount(accountId);
      const next = {
        id: accountId,
        usdtMicros: asUsdtMicros(current.usdtMicros + micros),
      };
      accounts.set(accountId, next);
      return next;
    },
  };
}
