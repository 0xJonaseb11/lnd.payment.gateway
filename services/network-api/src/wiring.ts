import { loadEnv, type AppEnv } from "@ln/config";
import { createLiveFx, createStaticFx } from "@ln/fx-rate";
import { createLndRest, createMemoryLightning } from "@ln/ln-gateway";
import {
  createHttpMomo,
  createMemoryMomo,
  type MomoPort,
} from "@ln/momo-gateway";
import { AppError, asMsat, asRwf } from "@ln/shared";
import { createFileStore } from "./file-store.ts";
import { createMetrics } from "./metrics.ts";
import { createNetworkService, type NetworkService } from "./service.ts";
import { createMemoryStore } from "./store.ts";

function momoFromEnv(env: AppEnv): MomoPort {
  if (
    env.MOMO_BACKEND === "http" &&
    env.MOMO_DISBURSEMENT_SUBSCRIPTION_KEY &&
    env.MOMO_API_USER &&
    env.MOMO_API_KEY
  ) {
    return createHttpMomo({
      baseUrl: env.MOMO_BASE_URL,
      subscriptionKey: env.MOMO_DISBURSEMENT_SUBSCRIPTION_KEY,
      apiUser: env.MOMO_API_USER,
      apiKey: env.MOMO_API_KEY,
      targetEnv: env.MOMO_TARGET_ENV,
    });
  }
  return createMemoryMomo(asRwf(env.MOMO_FLOAT_RWF));
}

function lnFromEnv(env: AppEnv) {
  if (env.LN_BACKEND === "lnd_rest") {
    if (!env.LND_REST_HOST || !env.LND_TLS_CERT_PATH || !env.LND_MACAROON_PATH) {
      throw new AppError("LND_CONFIG", "lnd rest env is incomplete", 500);
    }
    return createLndRest({
      host: env.LND_REST_HOST,
      tlsCertPath: env.LND_TLS_CERT_PATH,
      macaroonPath: env.LND_MACAROON_PATH,
      tlsInsecure: env.LND_TLS_INSECURE === "true",
    });
  }
  return createMemoryLightning(asMsat(env.LN_INBOUND_MSAT));
}

export function wireNetwork(env: AppEnv = loadEnv()): {
  network: NetworkService;
  allowDevPay: boolean;
  reconcileMs: number;
} {
  const store = env.STORE_PATH
    ? createFileStore(env.STORE_PATH)
    : createMemoryStore();
  const ln = lnFromEnv(env);
  const momo = momoFromEnv(env);
  const fxConfig = {
    feeBps: env.FEE_BPS,
    rwfPerUsdt: env.RWF_PER_USDT,
    usdtPerBtc: env.USDT_PER_BTC,
    ttlSeconds: env.QUOTE_TTL_SECONDS,
    now: () => new Date(),
  };
  const fx =
    env.FX_LIVE === "true" ? createLiveFx(fxConfig) : createStaticFx(fxConfig);
  return {
    network: createNetworkService({
      store,
      ln,
      momo,
      fx,
      now: () => new Date(),
      metrics: createMetrics(),
    }),
    allowDevPay: env.LN_BACKEND === "memory",
    reconcileMs: env.RECONCILE_MS,
  };
}
