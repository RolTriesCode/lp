"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { callbackUrl, safeNextPath } from "@/lib/auth/redirects";
import { getApplicationUrl } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { AUTH_RECOVERY_COOKIE } from "@/lib/auth/recovery";

export type AuthActionState = {
  status?: "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

const EmailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.").max(254);
const PasswordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Use no more than 72 characters.")
  .regex(/[A-Za-z]/, "Include at least one letter.")
  .regex(/[0-9]/, "Include at least one number.");

const SignInSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, "Enter your password.").max(72),
  next: z.string().optional(),
});

const SignUpSchema = z
  .object({
    displayName: z.string().trim().min(2, "Enter at least 2 characters.").max(120),
    email: EmailSchema,
    password: PasswordSchema,
    confirmPassword: z.string(),
    next: z.string().optional(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

const ResetSchema = z
  .object({ password: PasswordSchema, confirmPassword: z.string() })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });
const ForgotPasswordSchema = z.object({ email: EmailSchema });

function formValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function invalidState(error: z.ZodError): AuthActionState {
  return { status: "error", message: "Check the highlighted fields and try again.", fieldErrors: error.flatten().fieldErrors };
}

function friendlyAuthMessage(code?: string, fallback?: string): string {
  switch (code) {
    case "invalid_credentials":
      return "The email or password is incorrect. Check both fields and try again.";
    case "email_not_confirmed":
      return "Confirm your email address before signing in. Check your inbox for the confirmation link.";
    case "user_already_exists":
    case "email_exists":
      return "An account may already use this email. Try signing in or reset your password.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Too many attempts were made. Wait a few minutes, then try again.";
    case "weak_password":
      return "Choose a stronger password with at least 8 characters, a letter, and a number.";
    case "same_password":
      return "Choose a password you have not used for this account.";
    default:
      return fallback || "Authentication could not be completed. Try again.";
  }
}

export async function signInAction(
  _state: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = SignInSchema.safeParse({
    email: formValue(formData, "email"),
    password: formValue(formData, "password"),
    next: formValue(formData, "next"),
  });
  if (!parsed.success) return invalidState(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { status: "error", message: friendlyAuthMessage(error.code) };

  redirect(safeNextPath(parsed.data.next));
}

export async function signUpAction(
  _state: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = SignUpSchema.safeParse({
    displayName: formValue(formData, "displayName"),
    email: formValue(formData, "email"),
    password: formValue(formData, "password"),
    confirmPassword: formValue(formData, "confirmPassword"),
    next: formValue(formData, "next"),
  });
  if (!parsed.success) return invalidState(parsed.error);

  const next = safeNextPath(parsed.data.next);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: callbackUrl(getApplicationUrl(), next),
      data: { display_name: parsed.data.displayName, full_name: parsed.data.displayName },
    },
  });
  if (error) return { status: "error", message: friendlyAuthMessage(error.code) };
  if (data.session) redirect(next);

  return {
    status: "success",
    message: "Check your inbox to confirm your email address. You can return here to sign in afterward.",
  };
}

export async function signInWithGoogleAction(
  _state: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const next = safeNextPath(formValue(formData, "next"));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl(getApplicationUrl(), next),
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    return { status: "error", message: friendlyAuthMessage(error?.code, "Google sign-in could not start. Try again.") };
  }
  redirect(data.url);
}

export async function requestPasswordResetAction(
  _state: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = ForgotPasswordSchema.safeParse({ email: formValue(formData, "email") });
  if (!parsed.success) return invalidState(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: callbackUrl(getApplicationUrl(), "/auth/reset-password"),
  });

  if (error?.code === "over_email_send_rate_limit") {
    return { status: "error", message: friendlyAuthMessage(error.code) };
  }

  return {
    status: "success",
    message: "If an account uses that email, a password recovery link is on its way.",
  };
}

export async function updatePasswordAction(
  _state: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = ResetSchema.safeParse({
    password: formValue(formData, "password"),
    confirmPassword: formValue(formData, "confirmPassword"),
  });
  if (!parsed.success) return invalidState(parsed.error);

  const supabase = await createClient();
  const cookieStore = await cookies();
  if (cookieStore.get(AUTH_RECOVERY_COOKIE)?.value !== "active") {
    return { status: "error", message: "This recovery session has expired. Request a new password recovery link." };
  }
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims?.sub) {
    return { status: "error", message: "This recovery session has expired. Request a new password recovery link." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { status: "error", message: friendlyAuthMessage(error.code) };

  cookieStore.delete(AUTH_RECOVERY_COOKIE);
  return { status: "success", message: "Your password has been updated. You can continue to your dashboard." };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) redirect("/auth/error?code=signout_failed");
  revalidatePath("/", "layout");
  redirect("/auth/sign-in?status=signed_out");
}
