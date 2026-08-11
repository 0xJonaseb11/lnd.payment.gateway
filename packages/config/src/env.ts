import { z } from "zod";

const BigIntish = z
  .union([z.string(), z.number(), z.bigint()])
  .transform((value) => BigInt(value));

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8787),
  HOST: z.string().default("0.0.0.0"),
  LN_BACKEND: z.enum(["memory", "lnd_rest"]).default("memory"),
  MOMO_BACKEND: z.enum(["memory", "http"]).default("memory"),
  QUOTE_TTL_SECONDS: z.coerce.number().int().positive().default(120),
  FEE_BPS: BigIntish.default(150n),
  RWF_PER_USDT: BigIntish.default(1350n),
  USDT_PER_BTC: BigIntish.default(95_000n),
  MOMO_FLOAT_RWF: BigIntish.default(10_000_000n),
  LN_INBOUND_MSAT: BigIntish.default(50_000_000_000n),
  LND_REST_HOST: z.string().optional(),
  LND_TLS_CERT_PATH: z.string().optional(),
  LND_MACAROON_PATH: z.string().optional(),
  MOMO_BASE_URL: z.string().default("https://sandbox.momodeveloper.mtn.com"),
  MOMO_DISBURSEMENT_SUBSCRIPTION_KEY: z.string().optional(),
  MOMO_API_USER: z.string().optional(),
  MOMO_API_KEY: z.string().optional(),
  MOMO_TARGET_ENV: z.string().default("sandbox"),
  STORE_PATH: z.string().default(""),
  FX_LIVE: z.enum(["true", "false"]).default("false"),
  RECONCILE_MS: z.coerce.number().int().nonnegative().default(15_000),
  LND_TLS_INSECURE: z.enum(["true", "false"]).default("false"),
});

export type AppEnv = z.infer<typeof EnvSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  return EnvSchema.parse(source);
}
