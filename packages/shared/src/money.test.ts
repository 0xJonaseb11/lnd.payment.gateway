import { describe, expect, it } from "vitest";
import { applyBps, asRwf, asUsdtMicros, rwfToUsdtMicros, usdtMicrosToMsat } from "./money.ts";

describe("money", () => {
  it("converts rwf to usdt micros at 1350", () => {
    const micros = rwfToUsdtMicros(asRwf(1350n), 1350n);
    expect(micros).toBe(1_000_000n);
  });

  it("applies fee bps with ceil", () => {
    expect(applyBps(1_000_000n, 150n)).toBe(15_000n);
  });

  it("converts usdt micros to msat with ceil", () => {
    const usdtPerBtc = 95_000n * 1_000_000n;
    const msat = usdtMicrosToMsat(asUsdtMicros(1_015_000n), usdtPerBtc);
    expect(msat).toBe(1_068_422n);
  });
});
