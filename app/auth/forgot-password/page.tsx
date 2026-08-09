import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";

export default function ForgotPasswordPage() {
  return <AuthShell><AuthForm mode="forgot" /></AuthShell>;
}
