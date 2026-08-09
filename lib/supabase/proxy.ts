import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";
import { getSupabasePublicEnv } from "./env";
import { safeNextPath } from "@/lib/auth/redirects";

const PUBLIC_PATHS = new Set([
  "/",
  "/auth/sign-in",
  "/auth/sign-up",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/error",
  "/auth/callback",
  "/auth/confirm",
]);

const GUEST_ONLY_PATHS = new Set([
  "/auth/sign-in",
  "/auth/sign-up",
  "/auth/forgot-password",
]);

function hasSupabaseSessionCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some(({ name }) => name.startsWith("sb-") && name.includes("auth-token"));
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });
  let applySessionCookies = (target: NextResponse) => target;
  const { url, publishableKey } = getSupabasePublicEnv();

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        applySessionCookies = (target) => {
          cookiesToSet.forEach(({ name, value, options }) => target.cookies.set(name, value, options));
          return target;
        };
        applySessionCookies(response);
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  const isAuthenticated = !error && typeof data?.claims?.sub === "string";
  const pathname = request.nextUrl.pathname;

  if (!isAuthenticated && !PUBLIC_PATHS.has(pathname)) {
    if (pathname.startsWith("/api/")) {
      return applySessionCookies(NextResponse.json(
        { success: false, error: { category: "UNAUTHORIZED", message: "Your session has expired. Sign in and try again." } },
        { status: 401 }
      ));
    }

    const signInUrl = request.nextUrl.clone();
    signInUrl.pathname = "/auth/sign-in";
    signInUrl.search = "";
    signInUrl.searchParams.set("next", safeNextPath(`${pathname}${request.nextUrl.search}`));
    if (hasSupabaseSessionCookie(request)) signInUrl.searchParams.set("reason", "session_expired");
    return applySessionCookies(NextResponse.redirect(signInUrl));
  }

  if (isAuthenticated && GUEST_ONLY_PATHS.has(pathname)) {
    const destination = safeNextPath(request.nextUrl.searchParams.get("next"));
    return applySessionCookies(NextResponse.redirect(new URL(destination, request.url)));
  }

  return response;
}
