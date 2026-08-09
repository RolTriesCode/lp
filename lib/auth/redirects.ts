const DEFAULT_DESTINATION = "/dashboard";

const ALLOWED_DESTINATIONS = [
  "/dashboard",
  "/lesson",
  "/presentations",
  "/assessments",
  "/worksheets",
  "/rubrics",
  "/templates",
  "/curriculum",
  "/resources",
  "/calendar",
  "/search",
  "/help",
  "/settings",
] as const;

function isAllowedDestination(pathname: string): boolean {
  return ALLOWED_DESTINATIONS.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/** Accepts only application-local destinations and rejects protocol-relative or encoded escapes. */
export function safeNextPath(
  candidate: string | null | undefined,
  fallback = DEFAULT_DESTINATION
): string {
  if (!candidate || candidate.length > 1_024) return fallback;
  if (!candidate.startsWith("/") || candidate.startsWith("//")) return fallback;
  if (/[\\\u0000-\u001f\u007f]/.test(candidate)) return fallback;

  try {
    const parsed = new URL(candidate, "https://aralai.local");
    if (parsed.origin !== "https://aralai.local") return fallback;
    if (!isAllowedDestination(parsed.pathname)) return fallback;

    const decodedPath = decodeURIComponent(parsed.pathname);
    if (decodedPath.startsWith("//") || decodedPath.includes("\\")) return fallback;

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function callbackUrl(siteUrl: string, next?: string | null): string {
  const url = new URL("/auth/callback", siteUrl);
  const destination = next === "/auth/reset-password" ? next : safeNextPath(next);
  url.searchParams.set("next", destination);
  return url.toString();
}

export function safeCallbackNext(candidate: string | null | undefined): string {
  return candidate === "/auth/reset-password" ? candidate : safeNextPath(candidate);
}
