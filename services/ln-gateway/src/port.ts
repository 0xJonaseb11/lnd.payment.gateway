import type { Msat } from "@ln/shared";

export type HoldInvoice = {
  readonly bolt11: string;
  readonly paymentHash: string;
  readonly preimage: string;
  readonly valueMsat: Msat;
};

export type InvoiceState = "open" | "accepted" | "settled" | "canceled";

export type LightningPort = {
  addHoldInvoice(input: {
    paymentHash: string;
    preimage: string;
    valueMsat: Msat;
    expirySeconds: number;
  }): Promise<HoldInvoice>;
  settle(preimageHex: string): Promise<void>;
  cancel(paymentHashHex: string): Promise<void>;
  inboundMsat(): Promise<Msat>;
  onAccepted(handler: (paymentHashHex: string) => unknown): void;
  payForTest(paymentHashHex: string): Promise<void>;
};
