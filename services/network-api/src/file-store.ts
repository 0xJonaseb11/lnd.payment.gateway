import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  asMsat,
  asRwf,
  asUsdtMicros,
  type LedgerAccount,
  type Payment,
  type PaymentStatus,
} from "@ln/shared";
import { createMemoryStore, type PaymentStore } from "./store.ts";

type Snapshot = {
  payments: Array<Record<string, string | null>>;
  accounts: Array<{ id: string; usdt_micros: string }>;
};

function serialize(payment: Payment): Record<string, string | null> {
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
    expires_at: payment.expiresAt.toISOString(),
    created_at: payment.createdAt.toISOString(),
  };
}

function deserialize(row: Record<string, string | null>): Payment {
  return {
    id: row.id ?? "",
    rail: row.rail === "ledger" ? "ledger" : "momo_rwf",
    status: (row.status ?? "INVOICE_ISSUED") as PaymentStatus,
    amountRwf: row.amount_rwf ? asRwf(BigInt(row.amount_rwf)) : null,
    amountUsdtMicros: asUsdtMicros(BigInt(row.amount_usdt_micros ?? "0")),
    amountMsat: asMsat(BigInt(row.amount_msat ?? "0")),
    feeBps: BigInt(row.fee_bps ?? "0"),
    feeUsdtMicros: asUsdtMicros(BigInt(row.fee_usdt_micros ?? "0")),
    destination:
      row.msisdn && (row.destination_type === "mtn_momo" || row.destination_type === "airtel_momo")
        ? { type: row.destination_type, msisdn: row.msisdn }
        : null,
    accountId: row.account_id ?? null,
    paymentHash: row.payment_hash ?? "",
    preimage: row.preimage ?? "",
    bolt11: row.bolt11 ?? "",
    expiresAt: new Date(row.expires_at ?? 0),
    createdAt: new Date(row.created_at ?? 0),
  };
}

export function createFileStore(path: string): PaymentStore {
  const inner = createMemoryStore();
  try {
    const raw = readFileSync(path, "utf8");
    const snap = JSON.parse(raw) as Snapshot;
    for (const row of snap.payments ?? []) {
      inner.insert(deserialize(row));
    }
    for (const acc of snap.accounts ?? []) {
      inner.credit(acc.id, asUsdtMicros(BigInt(acc.usdt_micros)));
    }
  } catch {
    mkdirSync(dirname(path), { recursive: true });
  }

  const persist = () => {
    mkdirSync(dirname(path), { recursive: true });
    const accounts = new Map<string, LedgerAccount>();
    const payments = inner.list();
    for (const payment of payments) {
      if (payment.accountId) {
        accounts.set(payment.accountId, inner.getAccount(payment.accountId));
      }
    }
    const snap: Snapshot = {
      payments: payments.map(serialize),
      accounts: [...accounts.values()].map((row) => ({
        id: row.id,
        usdt_micros: row.usdtMicros.toString(),
      })),
    };
    writeFileSync(path, JSON.stringify(snap));
  };

  return {
    insert(payment) {
      inner.insert(payment);
      persist();
    },
    get: (id) => inner.get(id),
    byPaymentHash: (hash) => inner.byPaymentHash(hash),
    list: () => inner.list(),
    transition(id, from, to, patch) {
      const next = inner.transition(id, from, to, patch);
      persist();
      return next;
    },
    getAccount: (id) => inner.getAccount(id),
    credit(accountId, micros) {
      const next = inner.credit(accountId, micros);
      persist();
      return next;
    },
  };
}
