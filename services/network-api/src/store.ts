import {
  AppError,
  assertTransition,
  asUsdtMicros,
  momoReferenceId,
  PaymentStatus,
  Rail,
  type LedgerAccount,
  type Payment,
  type UsdtMicros,
} from "@ln/shared";

const RECONCILE_STATUSES: ReadonlySet<string> = new Set([
  PaymentStatus.DISBURSING,
  PaymentStatus.MANUAL_REVIEW,
]);

export type PaymentStore = {
  insert(payment: Payment): Promise<void>;
  get(id: string): Promise<Payment | undefined>;
  byPaymentHash(hash: string): Promise<Payment | undefined>;
  byMomoReference(referenceId: string): Promise<Payment | undefined>;
  listReconcilable(): Promise<Payment[]>;
  transition(
    id: string,
    from: Payment["status"],
    to: Payment["status"],
    patch?: Partial<Payment>,
  ): Promise<Payment>;
  getAccount(id: string): Promise<LedgerAccount>;
  credit(accountId: string, micros: UsdtMicros): Promise<LedgerAccount>;
};

export type MemoryStore = PaymentStore & {
  snapshot(): { payments: Payment[]; accounts: LedgerAccount[] };
};

export function createMemoryStore(): MemoryStore {
  const payments = new Map<string, Payment>();
  const byHash = new Map<string, string>();
  const byMomoRef = new Map<string, string>();
  const accounts = new Map<string, LedgerAccount>();

  return {
    async insert(payment) {
      if (payments.has(payment.id)) {
        throw new AppError("PAYMENT_EXISTS", "payment id already used", 409);
      }
      payments.set(payment.id, payment);
      byHash.set(payment.paymentHash, payment.id);
      if (payment.rail === Rail.momo_rwf) {
        byMomoRef.set(momoReferenceId(payment.id), payment.id);
      }
    },

    async get(id) {
      return payments.get(id);
    },

    async byPaymentHash(hash) {
      const id = byHash.get(hash);
      return id ? payments.get(id) : undefined;
    },

    async byMomoReference(referenceId) {
      const id = byMomoRef.get(referenceId);
      return id ? payments.get(id) : undefined;
    },

    async listReconcilable() {
      return [...payments.values()].filter((row) =>
        RECONCILE_STATUSES.has(row.status),
      );
    },

    async transition(id, from, to, patch) {
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

    async getAccount(id) {
      return accounts.get(id) ?? { id, usdtMicros: asUsdtMicros(0n) };
    },

    async credit(accountId, micros) {
      const current = await this.getAccount(accountId);
      const next = {
        id: accountId,
        usdtMicros: asUsdtMicros(current.usdtMicros + micros),
      };
      accounts.set(accountId, next);
      return next;
    },

    snapshot() {
      return {
        payments: [...payments.values()],
        accounts: [...accounts.values()],
      };
    },
  };
}
