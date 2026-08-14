import postgres from "postgres";
import {
  AppError,
  assertTransition,
  asUsdtMicros,
  PaymentStatus,
  type LedgerAccount,
  type Payment,
  type UsdtMicros,
} from "@ln/shared";
import {
  fromAccountRow,
  fromPaymentRow,
  paymentUpdateRow,
  toPaymentRow,
  type AccountRow,
  type PaymentRow,
} from "./payment-row.ts";
import type { PaymentStore } from "./store.ts";

const RECONCILE = [PaymentStatus.DISBURSING, PaymentStatus.MANUAL_REVIEW] as const;

function isLocalDb(url: string): boolean {
  return /localhost|127\.0\.0\.1/.test(url);
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: unknown }).code === "23505"
  );
}

export function createSupabaseStore(databaseUrl: string): PaymentStore {
  const sql = isLocalDb(databaseUrl)
    ? postgres(databaseUrl, { prepare: false, max: 8 })
    : postgres(databaseUrl, { prepare: false, max: 8, ssl: "require" });
  return createPgStore(sql);
}

export function createPgStore(sql: postgres.Sql): PaymentStore {
  return {
    async insert(payment) {
      try {
        await sql`insert into network.payments ${sql(toPaymentRow(payment))}`;
      } catch (err) {
        if (isUniqueViolation(err)) {
          throw new AppError("PAYMENT_EXISTS", "payment id already used", 409);
        }
        throw err;
      }
    },

    async get(id) {
      const rows = await sql<PaymentRow[]>`
        select * from network.payments where id = ${id} limit 1
      `;
      const row = rows[0];
      return row ? fromPaymentRow(row) : undefined;
    },

    async byPaymentHash(hash) {
      const rows = await sql<PaymentRow[]>`
        select * from network.payments where payment_hash = ${hash} limit 1
      `;
      const row = rows[0];
      return row ? fromPaymentRow(row) : undefined;
    },

    async byMomoReference(referenceId) {
      const rows = await sql<PaymentRow[]>`
        select * from network.payments
        where momo_reference_id = ${referenceId}
        limit 1
      `;
      const row = rows[0];
      return row ? fromPaymentRow(row) : undefined;
    },

    async listReconcilable() {
      const rows = await sql<PaymentRow[]>`
        select * from network.payments
        where status in ${sql(RECONCILE)}
      `;
      return rows.map(fromPaymentRow);
    },

    async transition(id, from, to, patch) {
      assertTransition(from, to);
      return sql.begin(async (tx) => {
        const locked = await tx<PaymentRow[]>`
          select * from network.payments where id = ${id} for update
        `;
        const currentRow = locked[0];
        if (!currentRow) {
          throw new AppError("PAYMENT_NOT_FOUND", "unknown payment", 404);
        }
        const current = fromPaymentRow(currentRow);
        if (current.status !== from) {
          throw new AppError(
            "STALE_STATUS",
            `expected ${from}, found ${current.status}`,
            409,
          );
        }
        const next: Payment = { ...current, ...patch, status: to };
        const updated = await tx<PaymentRow[]>`
          update network.payments
          set ${sql(paymentUpdateRow(next))}
          where id = ${id} and status = ${from}
          returning *
        `;
        const row = updated[0];
        if (!row) {
          throw new AppError(
            "STALE_STATUS",
            `expected ${from}, found ${current.status}`,
            409,
          );
        }
        return fromPaymentRow(row);
      });
    },

    async getAccount(id) {
      const rows = await sql<AccountRow[]>`
        select * from network.ledger_accounts where id = ${id} limit 1
      `;
      const row = rows[0];
      return row ? fromAccountRow(row) : { id, usdtMicros: asUsdtMicros(0n) };
    },

    async credit(accountId, micros: UsdtMicros): Promise<LedgerAccount> {
      const rows = await sql<AccountRow[]>`
        insert into network.ledger_accounts (id, usdt_micros)
        values (${accountId}, ${micros.toString()})
        on conflict (id) do update
        set usdt_micros = network.ledger_accounts.usdt_micros + excluded.usdt_micros
        returning *
      `;
      const row = rows[0];
      if (!row) {
        throw new AppError("LEDGER_CREDIT", "ledger credit did not return a row", 500);
      }
      return fromAccountRow(row);
    },
  };
}
