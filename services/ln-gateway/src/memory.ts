import { AppError, asMsat, type Msat } from "@ln/shared";
import type { PayerPort } from "./payer.ts";
import type { HoldInvoice, InvoiceState, LightningPort } from "./port.ts";

type Recorded = HoldInvoice & { state: InvoiceState };

export type MemoryLightning = LightningPort & {
  payBolt11(bolt11: string): Promise<void>;
};

export function createMemoryLightning(inbound: Msat): MemoryLightning {
  const invoices = new Map<string, Recorded>();
  const handlers: Array<(paymentHashHex: string) => unknown> = [];

  async function accept(paymentHashHex: string): Promise<void> {
    const found = invoices.get(paymentHashHex);
    if (!found || found.state !== "open") {
      throw new AppError("INVOICE_NOT_PAYABLE", "invoice is not open", 409);
    }
    found.state = "accepted";
    for (const handler of handlers) {
      await handler(paymentHashHex);
    }
  }

  return {
    async addHoldInvoice(input) {
      const hold: Recorded = {
        bolt11: `lnmem1${input.paymentHash.slice(0, 24)}`,
        paymentHash: input.paymentHash,
        preimage: input.preimage,
        valueMsat: input.valueMsat,
        state: "open",
      };
      invoices.set(hold.paymentHash, hold);
      return hold;
    },

    async settle(preimageHex) {
      const found = [...invoices.values()].find((row) => row.preimage === preimageHex);
      if (!found) {
        throw new AppError("INVOICE_NOT_FOUND", "unknown preimage", 404);
      }
      if (found.state !== "accepted") {
        throw new AppError("INVOICE_NOT_ACCEPTED", "settle requires accepted hold", 409);
      }
      found.state = "settled";
    },

    async cancel(paymentHashHex) {
      const found = invoices.get(paymentHashHex);
      if (!found) {
        throw new AppError("INVOICE_NOT_FOUND", "unknown payment hash", 404);
      }
      if (found.state === "settled") {
        throw new AppError("INVOICE_SETTLED", "cannot cancel settled invoice", 409);
      }
      found.state = "canceled";
    },

    async inboundMsat() {
      return inbound;
    },

    onAccepted(handler) {
      handlers.push(handler);
    },

    async payForTest(paymentHashHex) {
      await accept(paymentHashHex);
    },

    async payBolt11(bolt11) {
      const found = [...invoices.values()].find((row) => row.bolt11 === bolt11);
      if (!found) {
        throw new AppError("INVOICE_NOT_FOUND", "unknown bolt11", 404);
      }
      await accept(found.paymentHash);
    },
  };
}

export function createMemoryPayer(ln: MemoryLightning): PayerPort {
  return {
    pay(bolt11) {
      return ln.payBolt11(bolt11);
    },
  };
}

export function memoryInbound(msat: bigint): Msat {
  return asMsat(msat);
}
