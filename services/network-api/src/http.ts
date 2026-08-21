import { isAppError, Rail } from "@ln/shared";
import { Hono } from "hono";
import { parseApiKeys, requireApiKey, requireSecret } from "./auth.ts";
import { CreatePaymentBody, toPaymentResponse } from "./dto.ts";
import {
  asCreateRwf,
  asCreateUsdt,
  type NetworkService,
} from "./service.ts";

type AppBindings = {
  Variables: {
    allowDevPay: boolean;
  };
};

export function createHttpApp(
  network: NetworkService,
  options: {
    allowDevPay: boolean;
    apiKeys?: ReadonlySet<string>;
    webhookSecret?: string;
  },
): Hono<AppBindings> {
  const app = new Hono<AppBindings>();
  const apiKeys = options.apiKeys ?? parseApiKeys("");
  const gated = requireApiKey(apiKeys);
  const webhook = requireSecret(options.webhookSecret ?? "", "x-callback-secret");

  app.onError((err, c) => {
    if (isAppError(err)) {
      return c.json(
        { error: { code: err.code, message: err.message } },
        err.status as 400,
      );
    }
    return c.json(
      { error: { code: "INTERNAL", message: "request failed" } },
      500,
    );
  });

  app.get("/health", (c) => c.json({ ok: true }));

  app.get("/.well-known/ln-network.json", (c) =>
    c.json({
      name: "LN payment network",
      rails: ["momo_rwf", "ledger"],
      unit: "USDT",
      offramp: "mtn_momo",
      hold_invoices: true,
    }),
  );

  app.post("/v1/payments", gated, async (c) => {
    const parsed = CreatePaymentBody.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json(
        { error: { code: "INVALID_BODY", message: "invalid payment request" } },
        400,
      );
    }
    const body = parsed.data;
    const payment =
      body.rail === "momo_rwf"
        ? await network.create({
            rail: Rail.momo_rwf,
            amountRwf: asCreateRwf(body.amount_rwf),
            msisdn: body.msisdn,
            provider: body.provider,
          })
        : await network.create({
            rail: Rail.ledger,
            amountUsdtMicros: asCreateUsdt(body.amount_usdt_micros),
            accountId: body.account_id,
          });
    return c.json(toPaymentResponse(payment), 201);
  });

  app.get("/v1/payments/:id", gated, async (c) => {
    const payment = await network.get(c.req.param("id"));
    return c.json(toPaymentResponse(payment));
  });

  app.get("/v1/accounts/:id", gated, async (c) =>
    c.json(await network.account(c.req.param("id"))),
  );

  app.get("/metrics", gated, (c) => c.json(network.metrics()));

  app.post("/v1/webhooks/momo", webhook, async (c) => {
    const body = (await c.req.json()) as {
      referenceId?: string;
      externalId?: string;
    };
    const referenceId = body.referenceId ?? body.externalId;
    if (!referenceId) {
      return c.json(
        { error: { code: "INVALID_BODY", message: "missing referenceId" } },
        400,
      );
    }
    const payment = await network.onMomoCallback(referenceId);
    return c.json(toPaymentResponse(payment));
  });

  app.post("/v1/dev/pay/:id", gated, async (c) => {
    if (!options.allowDevPay) {
      return c.json(
        { error: { code: "DEV_DISABLED", message: "test pay is off" } },
        403,
      );
    }
    const payment = await network.payForTest(c.req.param("id"));
    return c.json(toPaymentResponse(payment));
  });

  return app;
}
