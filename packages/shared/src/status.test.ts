import { describe, expect, it } from "vitest";
import { AppError } from "./errors.ts";
import { assertTransition, canTransition, PaymentStatus } from "./status.ts";

describe("status", () => {
  it("allows invoice to accepted", () => {
    expect(
      canTransition(PaymentStatus.INVOICE_ISSUED, PaymentStatus.LN_ACCEPTED),
    ).toBe(true);
  });

  it("rejects complete from issued", () => {
    expect(() =>
      assertTransition(PaymentStatus.INVOICE_ISSUED, PaymentStatus.COMPLETE),
    ).toThrow(AppError);
  });

  it("allows manual review to complete", () => {
    expect(
      canTransition(PaymentStatus.MANUAL_REVIEW, PaymentStatus.COMPLETE),
    ).toBe(true);
  });
});
