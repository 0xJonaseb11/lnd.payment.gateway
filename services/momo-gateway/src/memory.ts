import { AppError, asRwf, type Rwf } from "@ln/shared";
import {
  MomoTransferStatus,
  type MomoPort,
  type MomoTransfer,
} from "./port.ts";

export type MemoryMomo = MomoPort & {
  setNextStatus(status: MomoTransferStatus): void;
  transferCount(): number;
};

export function createMemoryMomo(float: Rwf): MemoryMomo {
  const transfers = new Map<string, MomoTransfer>();
  let nextStatus: MomoTransferStatus = MomoTransferStatus.SUCCESSFUL;
  let calls = 0;

  return {
    setNextStatus(status) {
      nextStatus = status;
    },

    transferCount() {
      return calls;
    },

    async transfer(input) {
      const existing = transfers.get(input.referenceId);
      if (existing) {
        return existing;
      }
      if (input.amountRwf > float) {
        throw new AppError("MOMO_FLOAT_LOW", "disbursement float too low", 503);
      }
      calls += 1;
      const row: MomoTransfer = {
        referenceId: input.referenceId,
        status: nextStatus,
      };
      transfers.set(input.referenceId, row);
      return row;
    },

    async getStatus(referenceId) {
      const found = transfers.get(referenceId);
      if (!found) {
        throw new AppError("MOMO_NOT_FOUND", "unknown transfer", 404);
      }
      return found;
    },

    async floatRwf() {
      return float;
    },
  };
}

export function memoryFloat(rwf: bigint): Rwf {
  return asRwf(rwf);
}
