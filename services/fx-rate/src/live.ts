import { AppError } from "@ln/shared";
import type { FxPort } from "./port.ts";
import { createStaticFx, type StaticFxConfig } from "./static.ts";

export function parseWholeUsd(amount: string): bigint {
  const whole = amount.split(".")[0] ?? "";
  if (!/^[0-9]+$/.test(whole)) {
    throw new AppError("INVALID_FX", "btc usd amount is not a whole number");
  }
  return BigInt(whole);
}

export async function fetchUsdtPerBtc(): Promise<bigint> {
  const res = await fetch("https://api.coinbase.com/v2/prices/BTC-USD/spot");
  if (!res.ok) {
    throw new AppError("FX_FEED", "btc usd feed failed", 502);
  }
  const body = (await res.json()) as { data?: { amount?: string } };
  return parseWholeUsd(body.data?.amount ?? "");
}

export function createLiveFx(config: StaticFxConfig): FxPort {
  const state = { ...config };
  const refresh = async () => {
    try {
      state.usdtPerBtc = await fetchUsdtPerBtc();
    } catch {
      return;
    }
  };
  void refresh();
  return {
    quoteMomo(amountRwf) {
      return createStaticFx(state).quoteMomo(amountRwf);
    },
    quoteLedger(amountUsdtMicros) {
      return createStaticFx(state).quoteLedger(amountUsdtMicros);
    },
  };
}
