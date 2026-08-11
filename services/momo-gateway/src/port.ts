import type { Rwf } from "@ln/shared";

export const MomoTransferStatus = {
  PENDING: "PENDING",
  SUCCESSFUL: "SUCCESSFUL",
  FAILED: "FAILED",
} as const;

export type MomoTransferStatus =
  (typeof MomoTransferStatus)[keyof typeof MomoTransferStatus];

export type MomoTransfer = {
  readonly referenceId: string;
  readonly status: MomoTransferStatus;
};

export type MomoPort = {
  transfer(input: {
    referenceId: string;
    amountRwf: Rwf;
    msisdn: string;
  }): Promise<MomoTransfer>;
  getStatus(referenceId: string): Promise<MomoTransfer>;
  floatRwf(): Promise<Rwf>;
};
