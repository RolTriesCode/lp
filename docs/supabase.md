# Supabase persistence and private Storage

The application repositories now persist lesson plans, presentations,
assessments, worksheets, templates, and uploaded resources through authenticated
Supabase request boundaries. Canonical JSON is validated with its Zod schema on
both writes and reads. Repository consumers do not receive a Supabase client.

Schedule entries and reusable classroom context use dedicated typed tables and
replaceable repository interfaces. Schedule writes use the same server-bumped
revision strategy as generated artifacts; URL date and filter state is not
stored in the database. Classroom-context safety guidance is documented in
`docs/classroom-context.md`.

## Required environment

Copy `.env.example` to `.env.local` and set:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-project-publishable-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

The publishable key is intentionally browser-visible and is constrained by Row
Level Security. Never place a service-role key or other privileged credential in
a `NEXT_PUBLIC_*` variable. Environment values are validated lazily when a
Supabase client is first requested.

Persistence routes require a valid Supabase Auth session and validate it with
`getClaims()`. They return `401` instead of falling back to another teacher's
data or silently writing a browser-only copy. The configured site URL constructs
OAuth, confirmation, and recovery callbacks without trusting request headers.
Allow the exact production `/auth/callback` and `/auth/confirm` URLs in Supabase
Auth URL Configuration. Enable Google in Supabase Auth and use the Supabase
project callback URL in Google Cloud; no Google secret belongs in browser
environment variables.

## Apply and verify the database locally

Install the Supabase CLI using an official installation method and start a
Docker-compatible runtime. The committed configuration and migrations recreate
the database and private buckets:

```bash
supabase start
supabase db reset --local
supabase db lint --local
supabase test db
npm test
npx tsc --noEmit
```

`db reset --local` destroys and recreates only the local development database.
Do not run a linked reset against a remote project containing real data.

The persistence migration adds a positive `revision` to every versioned-content
table. An update trigger increments it and updates `updated_at`; repository
updates match the last observed revision. A zero-row update is re-read and
reported as a conflict rather than overwriting newer content.

## Private Storage buckets

All application buckets are private:

| Bucket | Limit | Accepted content |
| --- | ---: | --- |
| `teacher-references` | 10 MB | PDF and DOCX |
| `school-logos` | 5 MB | PNG, JPEG, WebP |
| `lesson-attachments` | 10 MB | PDF, DOCX, PNG, JPEG, WebP |
| `generated-images` | 10 MB | PNG, JPEG, WebP |

Object names begin with the authenticated user UUID. Storage policies require
both that path prefix and the object's `owner_id` for select, insert, update, and
delete. There are no anonymous policies or public buckets.

Reference uploads are processed in this order:

1. Authenticate the request and reject oversized multipart bodies.
2. Validate type, archive safety, encryption state, and bounded text extraction.
3. Upload the original bytes to `teacher-references/<user-id>/<resource-id>/...`.
4. Write validated bounded metadata and canonical JSONB to `uploaded_resources`.
5. Remove the uploaded object if the metadata write fails.

Permanently deleting a resource removes its private source object before its
metadata row. Removing a reference from one lesson does not delete the reusable
library resource. DOCX, PDF, and PPTX exports continue to be generated on demand
and are not written to Storage.

## Explicit local prototype import

The lesson library scans the two legacy browser keys without writing anything.
When valid local lessons exist, the teacher may open an inline confirmation and
copy them to the current signed-in account. The import endpoint:

- accepts at most 100 records per request;
- validates every record with `LessonPlanSchema`;
- requires an original local ID;
- records that ID in `prototype_source_id`;
- uses a per-owner partial unique index to make retries idempotent; and
- never edits or deletes local browser data.

Invalid records are counted and left untouched. There is no automatic migration.

## Regenerating database types

The checked-in `lib/supabase/database.types.ts` mirrors the migrations so the
application compiles before a project is connected. After every migration,
regenerate and review the type diff:

```bash
supabase gen types --lang typescript --local --schema public > lib/supabase/database.types.ts
npx tsc --noEmit
```

For a linked development project:

```bash
supabase login
supabase link --project-ref your-project-ref
supabase db push --dry-run
supabase db push
supabase gen types --lang typescript --linked --schema public > lib/supabase/database.types.ts
```

## Access and validation model

- Every application table has RLS enabled and forced.
- Anonymous roles have no application-table policies or privileges.
- Authenticated policies require `auth.uid()` to match row ownership.
- Child artifact foreign keys include `user_id`, preventing cross-owner links.
- Route handlers derive ownership from the verified session; client payloads do
  not choose an owner.
- JSONB is parsed by canonical Zod schemas before every repository write and
  after every repository read.
- No privileged key is configured in application code.

## Authentication and profile checks

Next.js 16 runs the root `proxy.ts` on dynamic application requests. It refreshes
cookies with `getClaims()`, preserves only known local destinations, returns JSON
`401` responses for unauthenticated API calls, and redirects page requests to
sign-in. Sensitive repositories and upload/export handlers also verify claims;
Proxy is not the only authorization layer.

New `auth.users` rows receive a matching `profiles` row through a restricted
database trigger. Profile job titles are display metadata, never permission
roles. School logos stay in the private `school-logos` bucket under the user's
UUID path. The committed pgTAP test covers owner, cross-owner, and anonymous
reads and updates. The TypeScript suite verifies every application-table policy
and all four private Storage operations.
