import { NextResponse } from "next/server";
import { safeCallbackNext } from "@/lib/auth/redirects";
import { getApplicationUrl } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { AUTH_RECOVERY_COOKIE, recoveryCookieOptions } from "@/lib/auth/recovery";

function errorRedirect(code: string): NextResponse {
  const url = new URL("/auth/error", getApplicationUrl());
  url.searchParams.set("code", code);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const providerError = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const next = safeCallbackNext(url.searchParams.get("next"));

  if (providerError) return errorRedirect(providerError === "access_denied" ? "access_denied" : "oauth_failed");
  if (!code || code.length > 2_048) return errorRedirect("missing_code");

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return errorRedirect(error.code === "flow_state_expired" ? "expired_code" : "invalid_code");

  const response = NextResponse.redirect(new URL(next, getApplicationUrl()));
  if (next === "/auth/reset-password") {
    response.cookies.set(AUTH_RECOVERY_COOKIE, "active", recoveryCookieOptions());
  }
  return response;
}
