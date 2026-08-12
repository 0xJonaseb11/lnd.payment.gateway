import { asMsat } from "@ln/shared";
import { describe, expect, it } from "vitest";
import { createMemoryLightning, createMemoryPayer } from "./memory.ts";

describe("memory payer", () => {
  it("pays a hold invoice by bolt11", async () => {
    const ln = createMemoryLightning(asMsat(50_000_000_000n));
    const payer = createMemoryPayer(ln);
    const hash = "ab".repeat(32);
    const hold = await ln.addHoldInvoice({
      paymentHash: hash,
      preimage: "cd".repeat(32),
      valueMsat: asMsat(1_000n),
      expirySeconds: 60,
    });
    let accepted = "";
    ln.onAccepted((h) => {
      accepted = h;
    });
    await payer.pay(hold.bolt11);
    expect(accepted).toBe(hash);
  });
});
