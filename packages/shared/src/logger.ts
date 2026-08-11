export type LogLevel = "debug" | "info" | "warn" | "error";

export function log(
  level: LogLevel,
  msg: string,
  fields: Record<string, string | number | boolean | null> = {},
): void {
  const line = JSON.stringify({
    t: new Date().toISOString(),
    level,
    msg,
    ...fields,
  });
  process.stdout.write(`${line}\n`);
}
