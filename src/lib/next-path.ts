/**
 * A same-site path to return to after signing in, or null. Rejects absolute and
 * protocol-relative URLs ("//evil.com", "/\\evil.com") so ?next= can't be used
 * as an open redirect.
 */
export function safeNextPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}
