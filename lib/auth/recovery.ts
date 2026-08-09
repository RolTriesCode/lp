export const AUTH_RECOVERY_COOKIE = "aralai-password-recovery";

export function recoveryCookieOptions() {
  return {
    httpOnly: true,
    maxAge: 10 * 60,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}
