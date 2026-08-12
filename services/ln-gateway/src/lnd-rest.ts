import { request as httpsRequest } from "node:https";
import { AppError, asMsat, type Msat } from "@ln/shared";
import {
  createLndSession,
  hexToBase64,
  toHexHash,
  type LndRestConfig,
} from "./lnd-http.ts";
import type { HoldInvoice, LightningPort } from "./port.ts";

export type { LndRestConfig };

export function createLndRest(config: LndRestConfig): LightningPort {
  const session = createLndSession(config);
  const handlers: Array<(paymentHashHex: string) => unknown> = [];
  let started = false;

  function subscribe(): void {
    const url = new URL("/v1/invoices/subscribe", config.host);
    const req = httpsRequest(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: "GET",
        agent: session.agent,
        headers: { "Grpc-Metadata-macaroon": session.macaroonHex },
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
              const accepted = row.state === "ACCEPTED" || row.state === 3;
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
      const res = await session.json<{ payment_request?: string }>(
        "POST",
        "/v2/invoices/hodl",
        {
          hash: hexToBase64(input.paymentHash),
          value_msat: input.valueMsat.toString(),
          expiry: String(input.expirySeconds),
        },
      );
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
      await session.json("POST", "/v2/invoices/settle", {
        preimage: hexToBase64(preimageHex),
      });
    },

    async cancel(paymentHashHex) {
      await session.json("POST", "/v2/invoices/cancel", {
        payment_hash: hexToBase64(paymentHashHex),
      });
    },

    async inboundMsat(): Promise<Msat> {
      const res = await session.json<{
        remote_balance?: { msat?: string; sat?: string };
      }>("GET", "/v1/balance/channels");
      return asMsat(BigInt(res.remote_balance?.msat ?? "0"));
    },

    onAccepted(handler) {
      handlers.push(handler);
      if (!started) {
        started = true;
        subscribe();
      }
    },

    async payForTest() {
      throw new AppError("DEV_DISABLED", "use the payer node to pay invoices", 403);
    },
  };
}
