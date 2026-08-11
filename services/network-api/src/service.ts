import type { FxPort } from "@ln/fx-rate";
import type { LightningPort } from "@ln/ln-gateway";
import {
  MomoTransferStatus,
  type MomoPort,
} from "@ln/momo-gateway";
import {
  AppError,
  asRwf,
  asUsdtMicros,
  log,
  momoReferenceId,
  newPaymentId,
  paymentHashFromPreimage,
  PaymentStatus,
  Rail,
  randomPreimage,
  toHex,
  type Payment,
  type Rwf,
  type UsdtMicros,
} from "@ln/shared";
import type { PaymentStore } from "./store.ts";

export type CreateMomoInput = {
  rail: typeof Rail.momo_rwf;
  amountRwf: Rwf;
  msisdn: string;
};

export type CreateLedgerInput = {
  rail: typeof Rail.ledger;
  amountUsdtMicros: UsdtMicros;
  accountId: string;
};

export type CreatePaymentInput = CreateMomoInput | CreateLedgerInput;

export type NetworkService = {
  create(input: CreatePaymentInput): Promise<Payment>;
  get(id: string): Payment;
  onInvoiceAccepted(paymentHashHex: string): Promise<void>;
  payForTest(id: string): Promise<Payment>;
  account(id: string): { id: string; usdt_micros: string };
};

type Deps = {
  store: PaymentStore;
  ln: LightningPort;
  momo: MomoPort;
  fx: FxPort;
  now: () => Date;
};

function requirePayment(store: PaymentStore, id: string): Payment {
  const found = store.get(id);
  if (!found) {
    throw new AppError("PAYMENT_NOT_FOUND", "unknown payment", 404);
  }
  return found;
}

export function createNetworkService(deps: Deps): NetworkService {
  async function create(input: CreatePaymentInput): Promise<Payment> {
    const quote =
      input.rail === Rail.momo_rwf
        ? deps.fx.quoteMomo(input.amountRwf)
        : deps.fx.quoteLedger(input.amountUsdtMicros);

    const float = await deps.momo.floatRwf();
    if (input.rail === Rail.momo_rwf && input.amountRwf > float) {
      throw new AppError("MOMO_FLOAT_LOW", "disbursement float too low", 503);
    }

    const inbound = await deps.ln.inboundMsat();
    if (quote.amountMsat > inbound) {
      throw new AppError("LN_LIQUIDITY_LOW", "inbound lightning capacity too low", 503);
    }

    const preimage = randomPreimage();
    const paymentHash = paymentHashFromPreimage(preimage);
    const ttlSeconds = Math.max(
      1,
      Math.ceil((quote.expiresAt.getTime() - deps.now().getTime()) / 1000),
    );
    const hold = await deps.ln.addHoldInvoice({
      paymentHash: toHex(paymentHash),
      preimage: toHex(preimage),
      valueMsat: quote.amountMsat,
      expirySeconds: ttlSeconds,
    });

    const payment: Payment = {
      id: newPaymentId(),
      rail: input.rail,
      status: PaymentStatus.INVOICE_ISSUED,
      amountRwf: quote.amountRwf,
      amountUsdtMicros: quote.amountUsdtMicros,
      amountMsat: quote.amountMsat,
      feeBps: quote.feeBps,
      feeUsdtMicros: quote.feeUsdtMicros,
      destination:
        input.rail === Rail.momo_rwf
          ? { type: "mtn_momo", msisdn: input.msisdn }
          : null,
      accountId: input.rail === Rail.ledger ? input.accountId : null,
      paymentHash: hold.paymentHash,
      preimage: hold.preimage,
      bolt11: hold.bolt11,
      expiresAt: quote.expiresAt,
      createdAt: deps.now(),
    };

    try {
      deps.store.insert(payment);
    } catch (err) {
      await deps.ln.cancel(hold.paymentHash);
      throw err;
    }

    return payment;
  }

  async function fulfillLedger(payment: Payment): Promise<void> {
    if (!payment.accountId) {
      throw new AppError("MISSING_ACCOUNT", "ledger rail requires account_id", 500);
    }
    deps.store.credit(payment.accountId, payment.amountUsdtMicros);
    await deps.ln.settle(payment.preimage);
    deps.store.transition(
      payment.id,
      PaymentStatus.LN_ACCEPTED,
      PaymentStatus.COMPLETE,
    );
  }

  async function fulfillMomo(payment: Payment): Promise<void> {
    if (!payment.destination || payment.amountRwf === null) {
      throw new AppError("MISSING_DESTINATION", "momo rail requires destination", 500);
    }
    deps.store.transition(
      payment.id,
      PaymentStatus.LN_ACCEPTED,
      PaymentStatus.DISBURSING,
    );
    const referenceId = momoReferenceId(payment.id);
    const result = await deps.momo.transfer({
      referenceId,
      amountRwf: payment.amountRwf,
      msisdn: payment.destination.msisdn,
    });

    if (result.status === MomoTransferStatus.SUCCESSFUL) {
      await deps.ln.settle(payment.preimage);
      deps.store.transition(
        payment.id,
        PaymentStatus.DISBURSING,
        PaymentStatus.COMPLETE,
      );
      return;
    }

    if (result.status === MomoTransferStatus.FAILED) {
      await deps.ln.cancel(payment.paymentHash);
      deps.store.transition(
        payment.id,
        PaymentStatus.DISBURSING,
        PaymentStatus.REFUNDED,
      );
      return;
    }

    deps.store.transition(
      payment.id,
      PaymentStatus.DISBURSING,
      PaymentStatus.MANUAL_REVIEW,
    );
  }

  async function onInvoiceAccepted(paymentHashHex: string): Promise<void> {
    const payment = deps.store.byPaymentHash(paymentHashHex);
    if (!payment) {
      log("warn", "accepted hash with no payment", { hash: paymentHashHex.slice(0, 8) });
      return;
    }
    if (payment.status !== PaymentStatus.INVOICE_ISSUED) {
      return;
    }
    if (deps.now() > payment.expiresAt) {
      deps.store.transition(
        payment.id,
        PaymentStatus.INVOICE_ISSUED,
        PaymentStatus.EXPIRED,
      );
      await deps.ln.cancel(payment.paymentHash);
      return;
    }

    deps.store.transition(
      payment.id,
      PaymentStatus.INVOICE_ISSUED,
      PaymentStatus.LN_ACCEPTED,
    );
    const accepted = requirePayment(deps.store, payment.id);
    if (accepted.rail === Rail.ledger) {
      await fulfillLedger(accepted);
      return;
    }
    await fulfillMomo(accepted);
  }

  const api: NetworkService = {
    create,
    get(id) {
      return requirePayment(deps.store, id);
    },
    onInvoiceAccepted,
    async payForTest(id) {
      const payment = requirePayment(deps.store, id);
      await deps.ln.payForTest(payment.paymentHash);
      return requirePayment(deps.store, id);
    },
    account(id) {
      const row = deps.store.getAccount(id);
      return { id: row.id, usdt_micros: row.usdtMicros.toString() };
    },
  };

  deps.ln.onAccepted((hash) => onInvoiceAccepted(hash));
  return api;
}

export function asCreateRwf(n: number): Rwf {
  return asRwf(BigInt(n));
}

export function asCreateUsdt(n: string | number): UsdtMicros {
  return asUsdtMicros(BigInt(n));
}
