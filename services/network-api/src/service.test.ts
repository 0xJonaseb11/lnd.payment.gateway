import { createStaticFx } from "@ln/fx-rate";
import { createMemoryLightning } from "@ln/ln-gateway";
import {
  createMemoryMomo,
  MomoTransferStatus,
} from "@ln/momo-gateway";
import { asMsat, asRwf, asUsdtMicros, PaymentStatus, Rail } from "@ln/shared";
import { describe, expect, it } from "vitest";
import { createNetworkService } from "./service.ts";
import { createMemoryStore } from "./store.ts";

function harness(now = new Date("2026-08-11T08:00:00Z")) {
  const store = createMemoryStore();
  const ln = createMemoryLightning(asMsat(50_000_000_000n));
  const momo = createMemoryMomo(asRwf(10_000_000n));
  const fx = createStaticFx({
    feeBps: 150n,
    rwfPerUsdt: 1350n,
    usdtPerBtc: 95_000n,
    ttlSeconds: 120,
    now: () => now,
  });
  const network = createNetworkService({ store, ln, momo, fx, now: () => now });
  return { network, momo, now };
}

describe("network service", () => {
  it("settles hold after momo success", async () => {
    const { network, momo } = harness();
    const created = await network.create({
      rail: Rail.momo_rwf,
      amountRwf: asRwf(1350n),
      msisdn: "250788123456",
    });
    expect(created.status).toBe(PaymentStatus.INVOICE_ISSUED);
    const done = await network.payForTest(created.id);
    expect(done.status).toBe(PaymentStatus.COMPLETE);
    expect(momo.transferCount()).toBe(1);
  });

  it("cancels hold after momo failure", async () => {
    const { network, momo } = harness();
    momo.setNextStatus(MomoTransferStatus.FAILED);
    const created = await network.create({
      rail: Rail.momo_rwf,
      amountRwf: asRwf(1350n),
      msisdn: "250788123456",
    });
    const done = await network.payForTest(created.id);
    expect(done.status).toBe(PaymentStatus.REFUNDED);
  });

  it("holds ln when momo status is unknown", async () => {
    const { network, momo } = harness();
    momo.setNextStatus(MomoTransferStatus.PENDING);
    const created = await network.create({
      rail: Rail.momo_rwf,
      amountRwf: asRwf(1350n),
      msisdn: "250788123456",
    });
    const done = await network.payForTest(created.id);
    expect(done.status).toBe(PaymentStatus.MANUAL_REVIEW);
  });

  it("does not double disburse on duplicate accept", async () => {
    const { network, momo } = harness();
    const created = await network.create({
      rail: Rail.momo_rwf,
      amountRwf: asRwf(1350n),
      msisdn: "250788123456",
    });
    await network.payForTest(created.id);
    await network.onInvoiceAccepted(created.paymentHash);
    expect(momo.transferCount()).toBe(1);
  });

  it("expires instead of disbursing after ttl", async () => {
    let now = new Date("2026-08-11T08:00:00Z");
    const store = createMemoryStore();
    const ln = createMemoryLightning(asMsat(50_000_000_000n));
    const momo = createMemoryMomo(asRwf(10_000_000n));
    const fx = createStaticFx({
      feeBps: 150n,
      rwfPerUsdt: 1350n,
      usdtPerBtc: 95_000n,
      ttlSeconds: 30,
      now: () => now,
    });
    const network = createNetworkService({
      store,
      ln,
      momo,
      fx,
      now: () => now,
    });
    const created = await network.create({
      rail: Rail.momo_rwf,
      amountRwf: asRwf(1350n),
      msisdn: "250788123456",
    });
    now = new Date("2026-08-11T08:05:00Z");
    const done = await network.payForTest(created.id);
    expect(done.status).toBe(PaymentStatus.EXPIRED);
    expect(momo.transferCount()).toBe(0);
  });

  it("rejects quotes when momo float is too low", async () => {
    const store = createMemoryStore();
    const ln = createMemoryLightning(asMsat(50_000_000_000n));
    const momo = createMemoryMomo(asRwf(100n));
    const fx = createStaticFx({
      feeBps: 150n,
      rwfPerUsdt: 1350n,
      usdtPerBtc: 95_000n,
      ttlSeconds: 120,
      now: () => new Date("2026-08-11T08:00:00Z"),
    });
    const network = createNetworkService({
      store,
      ln,
      momo,
      fx,
      now: () => new Date("2026-08-11T08:00:00Z"),
    });
    await expect(
      network.create({
        rail: Rail.momo_rwf,
        amountRwf: asRwf(1350n),
        msisdn: "250788123456",
      }),
    ).rejects.toMatchObject({ code: "MOMO_FLOAT_LOW" });
  });

  it("credits a stable ledger after lightning accept", async () => {
    const { network } = harness();
    const created = await network.create({
      rail: Rail.ledger,
      amountUsdtMicros: asUsdtMicros(2_000_000n),
      accountId: "acc_demo",
    });
    const done = await network.payForTest(created.id);
    expect(done.status).toBe(PaymentStatus.COMPLETE);
    expect(network.account("acc_demo").usdt_micros).toBe("2000000");
  });
});
