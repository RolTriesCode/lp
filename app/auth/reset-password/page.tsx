import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { AUTH_RECOVERY_COOKIE } from "@/lib/auth/recovery";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const { data, error } = await supabase.auth.getClaims();
  const validSession = !error && Boolean(data?.claims?.sub) && cookieStore.get(AUTH_RECOVERY_COOKIE)?.value === "active";
  return <AuthShell>{validSession ? <AuthForm mode="reset" /> : <div className="auth-form-wrap auth-terminal"><h2>This recovery link is no longer active</h2><p>Recovery links are time-limited and can only be used once. Request a new link to continue.</p><a className="auth-submit" href="/auth/forgot-password">Request another link <span aria-hidden="true">→</span></a></div>}</AuthShell>;
}
