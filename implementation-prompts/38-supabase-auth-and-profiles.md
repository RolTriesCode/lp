STEP:
38 — Supabase Authentication and Teacher Profiles

REASONING:
HIGH

OBJECTIVE:
Add Supabase Auth, teacher profiles, session handling, and protected application routes only after persistence is working.

REFERENCE:
Sections 18 through 20 and 30 of `implementation.md`; use `/public/reference/auth.png` if present.

FILES / AREAS:
Auth routes and components, Supabase middleware or proxy required by Next.js 16, callback handling, profile settings, RLS policies, header profile integration

IMPLEMENTATION:
- Read current Next.js 16 and Supabase SSR Auth documentation before editing.
- Implement email and password authentication plus Google OAuth with safe redirect and callback validation.
- Add sign-in, sign-up, sign-out, password recovery, session refresh, and meaningful error states.
- Protect dashboard and application routes while leaving the future landing page public.
- Connect authenticated user IDs to existing ownership columns and verify all RLS policies with positive and negative cases.
- Build teacher profile fields for display name, school, role, preferred grade or subjects, and optional school logo.
- Populate header profile data and DOCX export metadata from the profile with safe fallbacks.
- Preserve destination URLs through sign-in and prevent open redirects.
- Add loading, expired-session, unauthorized, and recovery states.

DO NOT:
- Add Better Auth, Prisma, billing, roles beyond current needs, or complex permissions.
- Trust client-provided user IDs.
- Expose private profile or storage data across accounts.

ACCEPTANCE CRITERIA:
- Email/password and Google sign-in flows work end to end.
- Protected routes and database rows are ownership-scoped.
- Profile updates appear in the header and exports.
- Sign-out, expired sessions, and callback errors recover safely.
