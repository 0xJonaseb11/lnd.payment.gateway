import { serve } from "@hono/node-server";
import { loadEnv } from "@ln/config";
import { log } from "@ln/shared";
import { parseApiKeys } from "./auth.ts";
import { createHttpApp } from "./http.ts";
import { wireNetwork } from "./wiring.ts";

const env = loadEnv();
const { network, allowDevPay, reconcileMs } = wireNetwork(env);
const app = createHttpApp(network, {
  allowDevPay,
  apiKeys: parseApiKeys(env.NETWORK_API_KEYS),
});

if (reconcileMs > 0) {
  setInterval(() => {
    void network.reconcile();
  }, reconcileMs);
}

serve({ fetch: app.fetch, hostname: env.HOST, port: env.PORT }, (info) => {
  log("info", "network-api listening", { host: info.address, port: info.port });
});
