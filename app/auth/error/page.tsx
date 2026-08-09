import { AuthShell } from "@/components/auth/auth-shell";

const messages: Record<string, { title: string; body: string }> = {
  access_denied: { title: "Google sign-in was cancelled", body: "No account changes were made. You can try Google again or sign in with email." },
  expired_code: { title: "This sign-in link has expired", body: "Return to sign in or request a new recovery link." },
  invalid_confirmation: { title: "This confirmation link is invalid", body: "Use the latest link from your email, or create the account again." },
  invalid_code: { title: "We could not verify this sign-in", body: "The link may have been used already. Start a new sign-in attempt." },
  missing_code: { title: "The sign-in response was incomplete", body: "Start the sign-in flow again from AralAI." },
  oauth_failed: { title: "Google sign-in could not finish", body: "Try again. If the problem continues, use email and password." },
  signout_failed: { title: "Sign-out could not finish", body: "Your session may still be active. Return to the workspace and try signing out again." },
};

export default async function AuthErrorPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const state = messages[typeof params.code === "string" ? params.code : ""] ?? messages.oauth_failed;
  const href = params.code === "signout_failed" ? "/dashboard" : "/auth/sign-in";
  const label = params.code === "signout_failed" ? "Return to workspace" : "Return to sign in";
  return <AuthShell><div className="auth-form-wrap auth-terminal"><h2>{state.title}</h2><p>{state.body}</p><a className="auth-submit" href={href}>{label} <span aria-hidden="true">→</span></a></div></AuthShell>;
}
