import { describe, expect, it } from "vitest";
import { parseApiKeys } from "./auth.ts";

describe("parseApiKeys", () => {
  it("drops blanks", () => {
    expect([...parseApiKeys(" a, ,b ")]).toEqual(["a", "b"]);
  });
});
