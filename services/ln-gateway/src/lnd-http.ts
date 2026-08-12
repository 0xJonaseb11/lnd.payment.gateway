import { readFileSync } from "node:fs";
import { Agent, request as httpsRequest, type AgentOptions } from "node:https";
import { AppError } from "@ln/shared";

export type LndRestConfig = {
  host: string;
  tlsCertPath: string;
  macaroonPath: string;
  tlsInsecure: boolean;
};

export type LndSession = {
  agent: Agent;
  macaroonHex: string;
  json<T>(method: string, path: string, body?: unknown): Promise<T>;
};

export function hexToBase64(hex: string): string {
  return Buffer.from(hex, "hex").toString("base64");
}

export function toHexHash(value: string): string {
  if (/^[0-9a-fA-F]+$/.test(value) && value.length === 64) {
    return value.toLowerCase();
  }
  return Buffer.from(value, "base64").toString("hex");
}

export function createLndSession(config: LndRestConfig): LndSession {
  const macaroonHex = readFileSync(config.macaroonPath).toString("hex");
  const agentOpts: AgentOptions = {
    ca: readFileSync(config.tlsCertPath),
    rejectUnauthorized: !config.tlsInsecure,
  };
  const agent = new Agent(agentOpts);

  return {
    agent,
    macaroonHex,
    async json<T>(method: string, path: string, body?: unknown) {
      const url = new URL(path, config.host);
      const res = await new Promise<{ status: number; text: string }>((resolve, reject) => {
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
          (incoming) => {
            const chunks: Buffer[] = [];
            incoming.on("data", (chunk: Buffer) => chunks.push(chunk));
            incoming.on("end", () =>
              resolve({
                status: incoming.statusCode ?? 0,
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
      if (res.status < 200 || res.status >= 300) {
        throw new AppError("LND_RPC", "lnd rest call failed", 502);
      }
      return res.text ? (JSON.parse(res.text) as T) : ({} as T);
    },
  };
}
