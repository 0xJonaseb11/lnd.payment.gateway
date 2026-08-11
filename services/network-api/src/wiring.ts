import { loadEnv, type AppEnv } from "@ln/config";
import { createStaticFx } from "@ln/fx-rate";
import { createMemoryLightning } from "@ln/ln-gateway";
import {
  createHttpMomo,
  createMemoryMomo,
  type MomoPort,
} from "@ln/momo-gateway";
import { asMsat, asRwf } from "@ln/shared";
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

export function wireNetwork(env: AppEnv = loadEnv()): {
  network: NetworkService;
  allowDevPay: boolean;
} {
  const store = createMemoryStore();
  const ln = createMemoryLightning(asMsat(env.LN_INBOUND_MSAT));
  const momo = momoFromEnv(env);
  const fx = createStaticFx({
    feeBps: env.FEE_BPS,
    rwfPerUsdt: env.RWF_PER_USDT,
    usdtPerBtc: env.USDT_PER_BTC,
    ttlSeconds: env.QUOTE_TTL_SECONDS,
    now: () => new Date(),
  });
  return {
    network: createNetworkService({
      store,
      ln,
      momo,
      fx,
      now: () => new Date(),
    }),
    allowDevPay: env.LN_BACKEND === "memory",
  };
}
