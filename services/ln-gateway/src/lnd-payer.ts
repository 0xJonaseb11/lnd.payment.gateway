import { AppError } from "@ln/shared";
import { createLndSession, type LndRestConfig } from "./lnd-http.ts";
import type { PayerPort } from "./payer.ts";

export function createLndPayer(config: LndRestConfig): PayerPort {
  const session = createLndSession(config);
  return {
    async pay(bolt11) {
      const res = await session.json<{ payment_error?: string }>(
        "POST",
        "/v1/channels/transactions",
        { payment_request: bolt11 },
      );
      if (res.payment_error) {
        throw new AppError("LND_PAY", res.payment_error, 502);
      }
    },
  };
}
