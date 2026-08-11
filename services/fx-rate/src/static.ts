import {
  applyBps,
  asUsdtMicros,
  rwfToUsdtMicros,
  usdtMicrosToMsat,
  type Rwf,
  type UsdtMicros,
} from "@ln/shared";
import type { FxPort, LockedQuote } from "./port.ts";

export type StaticFxConfig = {
  feeBps: bigint;
  rwfPerUsdt: bigint;
  usdtPerBtc: bigint;
  ttlSeconds: number;
  now: () => Date;
};

function quoteFromUsdt(
  amountUsdtMicros: UsdtMicros,
  amountRwf: Rwf | null,
  config: StaticFxConfig,
): LockedQuote {
  const feeUsdtMicros = asUsdtMicros(applyBps(amountUsdtMicros, config.feeBps));
  const invoiceUsdtMicros = asUsdtMicros(amountUsdtMicros + feeUsdtMicros);
  const usdtMicrosPerBtc = config.usdtPerBtc * 1_000_000n;
  return {
    amountRwf,
    amountUsdtMicros,
    feeUsdtMicros,
    invoiceUsdtMicros,
    amountMsat: usdtMicrosToMsat(invoiceUsdtMicros, usdtMicrosPerBtc),
    feeBps: config.feeBps,
    rwfPerUsdt: config.rwfPerUsdt,
    usdtPerBtc: config.usdtPerBtc,
    expiresAt: new Date(config.now().getTime() + config.ttlSeconds * 1000),
  };
}

export function createStaticFx(config: StaticFxConfig): FxPort {
  return {
    quoteMomo(amountRwf) {
      const amountUsdtMicros = rwfToUsdtMicros(amountRwf, config.rwfPerUsdt);
      return quoteFromUsdt(amountUsdtMicros, amountRwf, config);
    },
    quoteLedger(amountUsdtMicros) {
      return quoteFromUsdt(amountUsdtMicros, null, config);
    },
  };
}
