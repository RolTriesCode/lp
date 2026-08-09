"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import {
  requestPasswordResetAction,
  signInAction,
  signInWithGoogleAction,
  signUpAction,
  updatePasswordAction,
  type AuthActionState,
} from "@/app/auth/actions";

type AuthMode = "sign-in" | "sign-up" | "forgot" | "reset";

type AuthFormProps = {
  mode: AuthMode;
  next?: string;
  notice?: string;
};

const initialState: AuthActionState = {};

function FieldError({ messages, id }: { messages?: string[]; id: string }) {
  return messages?.length ? <p className="auth-field-error" id={id}>{messages[0]}</p> : null;
}

function GoogleMark() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.87h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.35Z"/><path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.42l-3.24-2.51c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.77-5.61-4.14H3.04v2.59A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.39 13.89A6.02 6.02 0 0 1 6.08 12c0-.66.11-1.3.31-1.89V7.52H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.48l3.35-2.59Z"/><path fill="#EA4335" d="M12 5.97c1.47 0 2.79.51 3.83 1.5l2.87-2.88A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.96 5.52l3.35 2.59C7.18 7.74 9.39 5.97 12 5.97Z"/></svg>;
}

export function AuthForm({ mode, next = "/dashboard", notice }: AuthFormProps) {
  const action = mode === "sign-in" ? signInAction : mode === "sign-up" ? signUpAction : mode === "forgot" ? requestPasswordResetAction : updatePasswordAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [googleState, googleAction, googlePending] = useActionState(signInWithGoogleAction, initialState);
  const isSignIn = mode === "sign-in";
  const isSignUp = mode === "sign-up";
  const isForgot = mode === "forgot";
  const title = isSignIn ? "Welcome back" : isSignUp ? "Create your teacher workspace" : isForgot ? "Recover your password" : "Choose a new password";
  const description = isSignIn ? "Sign in to continue planning where you left off." : isSignUp ? "Keep your lesson plans and teaching resources private and available across sessions." : isForgot ? "Enter your account email and we’ll send a secure recovery link." : "Use a strong password you have not used for this account.";

  return (
    <div className="auth-form-wrap">
      <div className="auth-form-heading"><h2>{title}</h2><p>{description}</p></div>
      {notice ? <div className="auth-notice" role="status">{notice}</div> : null}
      {(isSignIn || isSignUp) ? (
        <>
          <form action={googleAction}>
            <input name="next" type="hidden" value={next} />
            <button className="auth-google" disabled={googlePending || pending} type="submit">
              {googlePending ? <Loader2 className="auth-spinner" aria-hidden="true" /> : <GoogleMark />}
              Continue with Google
            </button>
          </form>
          {googleState.message ? <div className="auth-message error" role="alert">{googleState.message}</div> : null}
          <div className="auth-divider"><span>or use email</span></div>
        </>
      ) : null}

      <form action={formAction} className="auth-fields" noValidate>
        <input name="next" type="hidden" value={next} />
        {isSignUp ? (
          <label><span>Display name</span><input aria-describedby="displayName-error" autoComplete="name" maxLength={120} name="displayName" placeholder="How colleagues know you" required /><FieldError id="displayName-error" messages={state.fieldErrors?.displayName} /></label>
        ) : null}
        {(isSignIn || isSignUp || isForgot) ? (
          <label><span>Email address</span><input aria-describedby="email-error" autoComplete="email" inputMode="email" maxLength={254} name="email" placeholder="teacher@school.edu.ph" required type="email" /><FieldError id="email-error" messages={state.fieldErrors?.email} /></label>
        ) : null}
        {(isSignIn || isSignUp || mode === "reset") ? (
          <label><span>{mode === "reset" ? "New password" : "Password"}</span><input aria-describedby="password-hint password-error" autoComplete={isSignIn ? "current-password" : "new-password"} maxLength={72} minLength={isSignIn ? 1 : 8} name="password" required type="password" />{!isSignIn ? <small id="password-hint">At least 8 characters with a letter and number.</small> : null}<FieldError id="password-error" messages={state.fieldErrors?.password} /></label>
        ) : null}
        {(isSignUp || mode === "reset") ? (
          <label><span>Confirm password</span><input aria-describedby="confirmPassword-error" autoComplete="new-password" maxLength={72} minLength={8} name="confirmPassword" required type="password" /><FieldError id="confirmPassword-error" messages={state.fieldErrors?.confirmPassword} /></label>
        ) : null}
        {isSignIn ? <div className="auth-field-link"><Link href="/auth/forgot-password">Forgot password?</Link></div> : null}
        {state.message ? <div className={`auth-message ${state.status ?? "error"}`} role={state.status === "success" ? "status" : "alert"}>{state.message}</div> : null}
        <button className="auth-submit" disabled={pending || googlePending || state.status === "success"} type="submit">
          {pending ? <Loader2 className="auth-spinner" aria-hidden="true" /> : null}
          {isSignIn ? "Sign in" : isSignUp ? "Create account" : isForgot ? "Send recovery link" : "Update password"}
          {!pending ? <ArrowRight aria-hidden="true" /> : null}
        </button>
      </form>

      <p className="auth-switch">
        {isSignIn ? <>New to AralAI? <Link href={`/auth/sign-up?next=${encodeURIComponent(next)}`}>Create an account</Link></> : isSignUp ? <>Already have an account? <Link href={`/auth/sign-in?next=${encodeURIComponent(next)}`}>Sign in</Link></> : mode === "reset" && state.status === "success" ? <Link href="/dashboard">Continue to dashboard</Link> : <Link href="/auth/sign-in">Return to sign in</Link>}
      </p>
    </div>
  );
}
