import { loadEnv } from "@ln/config";
import { describe, expect, it } from "vitest";
import { parseApiKeys } from "./auth.ts";
import { createHttpApp } from "./http.ts";
import { wireNetwork } from "./wiring.ts";

function app(apiKeys = parseApiKeys("")) {
  const { network, allowDevPay } = wireNetwork(loadEnv({}));
  return createHttpApp(network, { allowDevPay, apiKeys });
}

describe("http", () => {
  it("creates a momo offramp and completes via test pay", async () => {
    const api = app();
    const created = await api.request("/v1/payments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        rail: "momo_rwf",
        amount_rwf: 1350,
        msisdn: "250788123456",
      }),
    });
    expect(created.status).toBe(201);
    const body = (await created.json()) as { payment_id: string; status: string };
    expect(body.status).toBe("INVOICE_ISSUED");

    const paid = await api.request(`/v1/dev/pay/${body.payment_id}`, {
      method: "POST",
    });
    expect(paid.status).toBe(200);
    const done = (await paid.json()) as { status: string; msisdn: string };
    expect(done.status).toBe("COMPLETE");
    expect(done.msisdn).toContain("***");
  });

  it("rejects a bad msisdn", async () => {
    const api = app();
    const res = await api.request("/v1/payments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        rail: "momo_rwf",
        amount_rwf: 1350,
        msisdn: "0788123456",
      }),
    });
    expect(res.status).toBe(400);
  });

  it("rejects payments without an api key when keys are set", async () => {
    const api = app(parseApiKeys("net_test_key"));
    const res = await api.request("/v1/payments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        rail: "momo_rwf",
        amount_rwf: 1350,
        msisdn: "250788123456",
      }),
    });
    expect(res.status).toBe(401);
  });

  it("accepts a bearer api key", async () => {
    const api = app(parseApiKeys("net_test_key"));
    const res = await api.request("/v1/payments", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer net_test_key",
      },
      body: JSON.stringify({
        rail: "momo_rwf",
        amount_rwf: 1350,
        msisdn: "250788123456",
      }),
    });
    expect(res.status).toBe(201);
  });
});
