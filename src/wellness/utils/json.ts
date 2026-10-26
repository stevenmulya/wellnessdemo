/**
 * Safe JSON parser with fallback to prevent unhandled 500 crashes
 */
export function safeJsonParse<T>(val: string | null | undefined, fallback: T): T {
  if (!val || typeof val !== "string") return fallback;
  const trimmed = val.trim();
  if (!trimmed) return fallback;
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    return fallback;
  }
}
