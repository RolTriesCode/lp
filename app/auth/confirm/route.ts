import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { safeNextPath } from "@/lib/auth/redirects";
import { getApplicationUrl } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { AUTH_RECOVERY_COOKIE, recoveryCookieOptions } from "@/lib/auth/recovery";

const EMAIL_OTP_TYPES = new Set<EmailOtpType>([
  "email",
  "recovery",
  "invite",
  "email_change",
]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const rawType = url.searchParams.get("type");
  const type = EMAIL_OTP_TYPES.has(rawType as EmailOtpType) ? (rawType as EmailOtpType) : null;
  const next = safeNextPath(url.searchParams.get("next"));

  if (!tokenHash || tokenHash.length > 2_048 || !type) {
    return NextResponse.redirect(new URL("/auth/error?code=invalid_confirmation", getApplicationUrl()));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error) {
    return NextResponse.redirect(new URL("/auth/error?code=expired_code", getApplicationUrl()));
  }

  const destination = type === "recovery" ? "/auth/reset-password" : next;
  const response = NextResponse.redirect(new URL(destination, getApplicationUrl()));
  if (type === "recovery") {
    response.cookies.set(AUTH_RECOVERY_COOKIE, "active", recoveryCookieOptions());
  }
  return response;
}
