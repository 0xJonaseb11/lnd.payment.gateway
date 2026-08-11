import { createHash, randomBytes, randomUUID } from "node:crypto";

const MOMO_NS = "ln-network.momo.v1";

export function newPaymentId(): string {
  return `pay_${randomUUID()}`;
}

export function randomPreimage(): Buffer {
  return randomBytes(32);
}

export function paymentHashFromPreimage(preimage: Buffer): Buffer {
  return createHash("sha256").update(preimage).digest();
}

export function toHex(buf: Buffer): string {
  return buf.toString("hex");
}

export function momoReferenceId(paymentId: string): string {
  const hash = createHash("sha256").update(MOMO_NS).update(paymentId).digest();
  hash[6] = (hash[6]! & 0x0f) | 0x50;
  hash[8] = (hash[8]! & 0x3f) | 0x80;
  const h = hash.subarray(0, 16).toString("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

export function maskMsisdn(msisdn: string): string {
  if (msisdn.length < 6) {
    return "***";
  }
  return `${msisdn.slice(0, 5)}***${msisdn.slice(-2)}`;
}
