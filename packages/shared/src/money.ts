import { AppError } from "./errors.ts";

declare const msatBrand: unique symbol;
declare const rwfBrand: unique symbol;
declare const usdtMicrosBrand: unique symbol;

export type Msat = bigint & { readonly [msatBrand]: true };
export type Rwf = bigint & { readonly [rwfBrand]: true };
export type UsdtMicros = bigint & { readonly [usdtMicrosBrand]: true };

const USDT_MICROS_PER_UNIT = 1_000_000n;
const MSAT_PER_BTC = 100_000_000_000n;

function requireNonNegative(n: bigint, code: string): bigint {
  if (n < 0n) {
    throw new AppError(code, "amount must be >= 0");
  }
  return n;
}

export function asMsat(n: bigint): Msat {
  return requireNonNegative(n, "INVALID_MSAT") as Msat;
}

export function asRwf(n: bigint): Rwf {
  return requireNonNegative(n, "INVALID_RWF") as Rwf;
}

export function asUsdtMicros(n: bigint): UsdtMicros {
  return requireNonNegative(n, "INVALID_USDT") as UsdtMicros;
}

export function usdtUnitsToMicros(units: bigint): UsdtMicros {
  return asUsdtMicros(units * USDT_MICROS_PER_UNIT);
}

export function divCeil(n: bigint, d: bigint): bigint {
  if (d <= 0n) {
    throw new AppError("INVALID_DIVISOR", "divisor must be > 0");
  }
  return (n + d - 1n) / d;
}

export function applyBps(amount: bigint, bps: bigint): bigint {
  if (bps < 0n) {
    throw new AppError("INVALID_FEE", "fee bps must be >= 0");
  }
  return divCeil(amount * bps, 10_000n);
}

export function usdtMicrosToMsat(
  micros: UsdtMicros,
  usdtMicrosPerBtc: bigint,
): Msat {
  if (usdtMicrosPerBtc <= 0n) {
    throw new AppError("INVALID_FX", "usdt per btc must be > 0");
  }
  return asMsat(divCeil(micros * MSAT_PER_BTC, usdtMicrosPerBtc));
}

export function rwfToUsdtMicros(rwf: Rwf, rwfPerUsdt: bigint): UsdtMicros {
  if (rwfPerUsdt <= 0n) {
    throw new AppError("INVALID_FX", "rwf per usdt must be > 0");
  }
  return asUsdtMicros(divCeil(rwf * USDT_MICROS_PER_UNIT, rwfPerUsdt));
}
