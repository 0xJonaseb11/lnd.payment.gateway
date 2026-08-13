import { loadEnv, type AppEnv } from "@ln/config";
import { createLiveFx, createStaticFx } from "@ln/fx-rate";
import {
  createLndPayer,
  createLndRest,
  createMemoryLightning,
  createMemoryPayer,
  type LightningPort,
  type MemoryLightning,
  type PayerPort,
} from "@ln/ln-gateway";
import {
  createHttpMomo,
  createMemoryMomo,
  type MomoPort,
} from "@ln/momo-gateway";
import { AppError, asMsat, asRwf } from "@ln/shared";
import { createFileStore } from "./file-store.ts";
import { createMetrics } from "./metrics.ts";
import { createNetworkService, type NetworkService } from "./service.ts";
import { createMemoryStore, type PaymentStore } from "./store.ts";
import { createSupabaseStore } from "./supabase-store.ts";

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

function lnFromEnv(env: AppEnv): LightningPort {
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

function payerFromEnv(env: AppEnv, ln: LightningPort): PayerPort | undefined {
  if (env.LN_BACKEND === "memory") {
    return createMemoryPayer(ln as MemoryLightning);
  }
  if (
    env.LND_PAYER_REST_HOST &&
    env.LND_PAYER_TLS_CERT_PATH &&
    env.LND_PAYER_MACAROON_PATH
  ) {
    return createLndPayer({
      host: env.LND_PAYER_REST_HOST,
      tlsCertPath: env.LND_PAYER_TLS_CERT_PATH,
      macaroonPath: env.LND_PAYER_MACAROON_PATH,
      tlsInsecure: env.LND_TLS_INSECURE === "true",
    });
  }
  return undefined;
}

function storeFromEnv(env: AppEnv): PaymentStore {
  if (env.STORE_BACKEND === "supabase") {
    if (!env.DATABASE_URL) {
      throw new AppError("STORE_CONFIG", "DATABASE_URL is required for supabase", 500);
    }
    return createSupabaseStore(env.DATABASE_URL);
  }
  if (env.STORE_BACKEND === "file" || env.STORE_PATH) {
    if (!env.STORE_PATH) {
      throw new AppError("STORE_CONFIG", "STORE_PATH is required for file store", 500);
    }
    return createFileStore(env.STORE_PATH);
  }
  return createMemoryStore();
}

export function wireNetwork(env: AppEnv = loadEnv()): {
  network: NetworkService;
  allowDevPay: boolean;
  reconcileMs: number;
} {
  const store = storeFromEnv(env);
  const ln = lnFromEnv(env);
  const payer = payerFromEnv(env, ln);
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
      ...(payer ? { payer } : {}),
    }),
    allowDevPay: payer !== undefined,
    reconcileMs: env.RECONCILE_MS,
  };
}
