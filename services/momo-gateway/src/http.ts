import { AppError, asRwf, type Rwf } from "@ln/shared";
import { MomoTransferStatus, type MomoPort } from "./port.ts";

type HttpMomoConfig = {
  baseUrl: string;
  subscriptionKey: string;
  apiUser: string;
  apiKey: string;
  targetEnv: string;
};

type TokenCache = { value: string; expiresAt: number };

function mapStatus(raw: string): MomoTransferStatus {
  if (raw === "SUCCESSFUL") {
    return MomoTransferStatus.SUCCESSFUL;
  }
  if (raw === "FAILED") {
    return MomoTransferStatus.FAILED;
  }
  return MomoTransferStatus.PENDING;
}

export function createHttpMomo(config: HttpMomoConfig): MomoPort {
  let token: TokenCache | null = null;

  async function bearer(): Promise<string> {
    if (token && token.expiresAt > Date.now() + 5_000) {
      return token.value;
    }
    const basic = Buffer.from(`${config.apiUser}:${config.apiKey}`).toString(
      "base64",
    );
    const res = await fetch(`${config.baseUrl}/disbursement/token/`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Ocp-Apim-Subscription-Key": config.subscriptionKey,
      },
    });
    if (!res.ok) {
      throw new AppError("MOMO_AUTH", "could not fetch disbursement token", 502);
    }
    const body = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
    };
    if (!body.access_token) {
      throw new AppError("MOMO_AUTH", "token missing access_token", 502);
    }
    token = {
      value: body.access_token,
      expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000,
    };
    return token.value;
  }

  async function headers(referenceId?: string): Promise<Record<string, string>> {
    const auth = await bearer();
    return {
      Authorization: `Bearer ${auth}`,
      "X-Target-Environment": config.targetEnv,
      "Ocp-Apim-Subscription-Key": config.subscriptionKey,
      "Content-Type": "application/json",
      ...(referenceId ? { "X-Reference-Id": referenceId } : {}),
    };
  }

  return {
    async transfer(input) {
      const res = await fetch(`${config.baseUrl}/disbursement/v1_0/transfer`, {
        method: "POST",
        headers: await headers(input.referenceId),
        body: JSON.stringify({
          amount: input.amountRwf.toString(),
          currency: "RWF",
          externalId: input.referenceId,
          payee: { partyIdType: "MSISDN", partyId: input.msisdn },
          payerMessage: "LN network",
          payeeNote: "LN offramp",
        }),
      });
      if (res.status !== 202 && res.status !== 200) {
        throw new AppError("MOMO_TRANSFER", "disbursement rejected", 502);
      }
      return {
        referenceId: input.referenceId,
        status: MomoTransferStatus.PENDING,
      };
    },

    async getStatus(referenceId) {
      const res = await fetch(
        `${config.baseUrl}/disbursement/v1_0/transfer/${referenceId}`,
        { headers: await headers() },
      );
      if (!res.ok) {
        throw new AppError("MOMO_STATUS", "could not read transfer", 502);
      }
      const body = (await res.json()) as { status?: string };
      return {
        referenceId,
        status: mapStatus(body.status ?? "PENDING"),
      };
    },

    async floatRwf(): Promise<Rwf> {
      const res = await fetch(`${config.baseUrl}/disbursement/v1_0/account/balance`, {
        headers: await headers(),
      });
      if (!res.ok) {
        throw new AppError("MOMO_BALANCE", "could not read float", 502);
      }
      const body = (await res.json()) as { availableBalance?: string };
      return asRwf(BigInt(body.availableBalance ?? "0"));
    },
  };
}
