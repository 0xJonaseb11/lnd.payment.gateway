import { asRwf } from "@ln/shared";
import { describe, expect, it } from "vitest";
import { createStaticFx } from "./static.ts";

describe("static fx", () => {
  it("locks momo quote in usdt and msat", () => {
    const fx = createStaticFx({
      feeBps: 150n,
      rwfPerUsdt: 1350n,
      usdtPerBtc: 95_000n,
      ttlSeconds: 60,
      now: () => new Date("2026-08-11T08:00:00Z"),
    });
    const quote = fx.quoteMomo(asRwf(1350n));
    expect(quote.amountUsdtMicros).toBe(1_000_000n);
    expect(quote.feeUsdtMicros).toBe(15_000n);
    expect(quote.invoiceUsdtMicros).toBe(1_015_000n);
    expect(quote.amountMsat > 0n).toBe(true);
  });
});
