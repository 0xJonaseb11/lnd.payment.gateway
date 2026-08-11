import { serve } from "@hono/node-server";
import { loadEnv } from "@ln/config";
import { log } from "@ln/shared";
import { createHttpApp } from "./http.ts";
import { wireNetwork } from "./wiring.ts";

const env = loadEnv();
const { network, allowDevPay } = wireNetwork(env);
const app = createHttpApp(network, { allowDevPay });

serve({ fetch: app.fetch, hostname: env.HOST, port: env.PORT }, (info) => {
  log("info", "network-api listening", { host: info.address, port: info.port });
});
