import {
  asMsat,
  asRwf,
  asUsdtMicros,
  momoReferenceId,
  PaymentStatus,
  Rail,
  type Payment,
} from "@ln/shared";
import { describe, expect, it } from "vitest";
import { fromPaymentRow, toPaymentRow } from "./payment-row.ts";
import { createMemoryStore } from "./store.ts";

function sample(overrides: Partial<Payment> = {}): Payment {
  return {
    id: "pay_11111111-1111-4111-8111-111111111111",
    rail: Rail.momo_rwf,
    status: PaymentStatus.INVOICE_ISSUED,
    amountRwf: asRwf(1350n),
    amountUsdtMicros: asUsdtMicros(1_000_000n),
    amountMsat: asMsat(1_068_422n),
    feeBps: 150n,
    feeUsdtMicros: asUsdtMicros(15_000n),
    destination: { type: "mtn_momo", msisdn: "250788123456" },
    accountId: null,
    paymentHash: "ab".repeat(32),
    preimage: "cd".repeat(32),
    bolt11: "lnmem1test",
    expiresAt: new Date("2026-08-13T12:00:00.000Z"),
    createdAt: new Date("2026-08-13T11:58:00.000Z"),
    ...overrides,
  };
}

describe("memory store", () => {
  it("looks up momo rail by derived reference", async () => {
    const store = createMemoryStore();
    const payment = sample();
    await store.insert(payment);
    const found = await store.byMomoReference(momoReferenceId(payment.id));
    expect(found?.id).toBe(payment.id);
  });

  it("lists only disbursing and manual review rows", async () => {
    const store = createMemoryStore();
    await store.insert(sample({ id: "pay_a", paymentHash: "aa".repeat(32) }));
    await store.insert(
      sample({
        id: "pay_b",
        paymentHash: "bb".repeat(32),
        status: PaymentStatus.DISBURSING,
      }),
    );
    const open = await store.listReconcilable();
    expect(open.map((row) => row.id)).toEqual(["pay_b"]);
  });

  it("rejects a stale status transition", async () => {
    const store = createMemoryStore();
    await store.insert(sample());
    await expect(
      store.transition(
        sample().id,
        PaymentStatus.LN_ACCEPTED,
        PaymentStatus.DISBURSING,
      ),
    ).rejects.toMatchObject({ code: "STALE_STATUS" });
  });

  it("credits ledger accounts atomically from zero", async () => {
    const store = createMemoryStore();
    const first = await store.credit("acc_demo", asUsdtMicros(2_000_000n));
    const second = await store.credit("acc_demo", asUsdtMicros(500_000n));
    expect(first.usdtMicros).toBe(2_000_000n);
    expect(second.usdtMicros).toBe(2_500_000n);
  });
});

describe("payment row mapping", () => {
  it("round-trips integer money and momo destination", () => {
    const payment = sample();
    const row = toPaymentRow(payment);
    expect(row.momo_reference_id).toBe(momoReferenceId(payment.id));
    expect(fromPaymentRow(row)).toEqual(payment);
  });

  it("leaves ledger momo reference empty", () => {
    const payment = sample({
      rail: Rail.ledger,
      amountRwf: null,
      destination: null,
      accountId: "acc_demo",
    });
    expect(toPaymentRow(payment).momo_reference_id).toBeNull();
  });
});
