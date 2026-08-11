import { describe, expect, it } from "vitest";
import { parseWholeUsd } from "./live.ts";

describe("live fx", () => {
  it("parses whole usd from a decimal string", () => {
    expect(parseWholeUsd("95123.88")).toBe(95123n);
  });
});
