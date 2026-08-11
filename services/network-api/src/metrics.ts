export type MetricKey =
  | "ln_accepted"
  | "complete"
  | "refunded"
  | "momo_ok"
  | "momo_fail"
  | "manual_review";

export type Metrics = {
  inc(key: MetricKey): void;
  snapshot(): Record<MetricKey, number>;
};

export function createMetrics(): Metrics {
  const counts: Record<MetricKey, number> = {
    ln_accepted: 0,
    complete: 0,
    refunded: 0,
    momo_ok: 0,
    momo_fail: 0,
    manual_review: 0,
  };
  return {
    inc(key) {
      counts[key] += 1;
    },
    snapshot() {
      return { ...counts };
    },
  };
}
