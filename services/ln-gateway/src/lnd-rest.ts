import { readFileSync } from "node:fs";
import { request as httpsRequest, type AgentOptions } from "node:https";
import { Agent } from "node:https";
import { AppError, asMsat, type Msat } from "@ln/shared";
import type { HoldInvoice, LightningPort } from "./port.ts";

export type LndRestConfig = {
  host: string;
  tlsCertPath: string;
  macaroonPath: string;
  tlsInsecure: boolean;
};

function hexToBase64(hex: string): string {
  return Buffer.from(hex, "hex").toString("base64");
}

function toHexHash(value: string): string {
  if (/^[0-9a-fA-F]+$/.test(value) && value.length === 64) {
    return value.toLowerCase();
  }
  return Buffer.from(value, "base64").toString("hex");
}

function lndFetch(
  config: LndRestConfig,
  agent: Agent,
  macaroonHex: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; text: string }> {
  const url = new URL(path, config.host);
  return new Promise((resolve, reject) => {
    const req = httpsRequest(
      {
        hostname: url.hostname,
        port: url.port,
        path: `${url.pathname}${url.search}`,
        method,
        agent,
        headers: {
          "Grpc-Metadata-macaroon": macaroonHex,
          "Content-Type": "application/json",
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () =>
          resolve({
            status: res.statusCode ?? 0,
            text: Buffer.concat(chunks).toString("utf8"),
          }),
        );
      },
    );
    req.on("error", reject);
    if (body !== undefined) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

export function createLndRest(config: LndRestConfig): LightningPort {
  const macaroonHex = readFileSync(config.macaroonPath).toString("hex");
  const agentOpts: AgentOptions = {
    ca: readFileSync(config.tlsCertPath),
    rejectUnauthorized: !config.tlsInsecure,
  };
  const agent = new Agent(agentOpts);
  const handlers: Array<(paymentHashHex: string) => unknown> = [];
  let started = false;

  async function json<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await lndFetch(config, agent, macaroonHex, method, path, body);
    if (res.status < 200 || res.status >= 300) {
      throw new AppError("LND_RPC", "lnd rest call failed", 502);
    }
    return res.text ? (JSON.parse(res.text) as T) : ({} as T);
  }

  function subscribe(): void {
    const url = new URL("/v1/invoices/subscribe", config.host);
    const req = httpsRequest(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: "GET",
        agent,
        headers: { "Grpc-Metadata-macaroon": macaroonHex },
      },
      (res) => {
        let buf = "";
        res.on("data", (chunk: Buffer) => {
          buf += chunk.toString("utf8");
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) {
              continue;
            }
            try {
              const parsed = JSON.parse(trimmed) as {
                result?: { state?: string | number; r_hash?: string };
                state?: string | number;
                r_hash?: string;
              };
              const row = parsed.result ?? parsed;
              const state = row.state;
              const accepted = state === "ACCEPTED" || state === 3;
              if (accepted && row.r_hash) {
                const hash = toHexHash(row.r_hash);
                for (const handler of handlers) {
                  void handler(hash);
                }
              }
            } catch {
              continue;
            }
          }
        });
      },
    );
    req.on("error", () => undefined);
    req.end();
  }

  return {
    async addHoldInvoice(input) {
      const res = await json<{ payment_request?: string }>("POST", "/v2/invoices/hodl", {
        hash: hexToBase64(input.paymentHash),
        value_msat: input.valueMsat.toString(),
        expiry: String(input.expirySeconds),
      });
      if (!res.payment_request) {
        throw new AppError("LND_INVOICE", "hold invoice missing payment_request", 502);
      }
      const hold: HoldInvoice = {
        bolt11: res.payment_request,
        paymentHash: input.paymentHash,
        preimage: input.preimage,
        valueMsat: input.valueMsat,
      };
      return hold;
    },

    async settle(preimageHex) {
      await json("POST", "/v2/invoices/settle", {
        preimage: hexToBase64(preimageHex),
      });
    },

    async cancel(paymentHashHex) {
      await json("POST", "/v2/invoices/cancel", {
        payment_hash: hexToBase64(paymentHashHex),
      });
    },

    async inboundMsat(): Promise<Msat> {
      const res = await json<{
        remote_balance?: { msat?: string; sat?: string };
      }>("GET", "/v1/balance/channels");
      const msat = BigInt(res.remote_balance?.msat ?? "0");
      return asMsat(msat);
    },

    onAccepted(handler) {
      handlers.push(handler);
      if (!started) {
        started = true;
        subscribe();
      }
    },

    async payForTest() {
      throw new AppError("DEV_DISABLED", "test pay is memory-backend only", 403);
    },
  };
}
