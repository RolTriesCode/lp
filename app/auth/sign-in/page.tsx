import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { safeNextPath } from "@/lib/auth/redirects";

export default async function SignInPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : null);
  const notice = params.reason === "session_expired" ? "Your session expired safely. Sign in again to continue." : params.status === "signed_out" ? "You have been signed out on this device." : undefined;
  return <AuthShell><AuthForm mode="sign-in" next={next} notice={notice} /></AuthShell>;
}
