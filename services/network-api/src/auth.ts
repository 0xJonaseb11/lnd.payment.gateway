import { timingSafeEqual } from "node:crypto";
import type { MiddlewareHandler } from "hono";

export function parseApiKeys(raw: string): ReadonlySet<string> {
  return new Set(
    raw
      .split(",")
      .map((key) => key.trim())
      .filter((key) => key.length > 0),
  );
}

function presentedKey(authorization: string | undefined, apiKey: string | undefined): string {
  if (authorization?.toLowerCase().startsWith("bearer ")) {
    return authorization.slice(7).trim();
  }
  return apiKey?.trim() ?? "";
}

function keyAllowed(presented: string, keys: ReadonlySet<string>): boolean {
  const left = Buffer.from(presented);
  for (const key of keys) {
    const right = Buffer.from(key);
    if (left.length === right.length && timingSafeEqual(left, right)) {
      return true;
    }
  }
  return false;
}

export function requireApiKey(keys: ReadonlySet<string>): MiddlewareHandler {
  return async (c, next) => {
    if (keys.size === 0) {
      await next();
      return;
    }
    const presented = presentedKey(c.req.header("authorization"), c.req.header("x-api-key"));
    if (!presented || !keyAllowed(presented, keys)) {
      return c.json(
        { error: { code: "UNAUTHORIZED", message: "invalid api key" } },
        401,
      );
    }
    await next();
  };
}
