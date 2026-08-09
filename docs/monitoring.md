# Privacy-conscious monitoring

AralAI uses Sentry for unexpected browser, server, and Edge errors, Vercel Web
Analytics for coarse page and workflow counts, and Vercel Speed Insights for a
sample of Core Web Vitals. All three integrations are opt-in and fail open: a
missing endpoint, blocked script, SDK exception, or quota limit cannot interrupt
lesson creation, editing, saving, or export.

The integration follows the current official [Sentry Next.js manual setup](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/),
[Vercel Web Analytics quickstart](https://vercel.com/docs/analytics/quickstart),
and [Vercel Speed Insights quickstart](https://vercel.com/docs/speed-insights/quickstart).

## Environment variables

Keep monitoring disabled in `.env.local`. Configure these separately for each
preview, staging, and production deployment:

```bash
NEXT_PUBLIC_SENTRY_ENABLED=true
NEXT_PUBLIC_SENTRY_DSN=https://public-key@o0.ingest.sentry.io/project-id
NEXT_PUBLIC_APP_ENV=preview
NEXT_PUBLIC_SENTRY_RELEASE=$VERCEL_GIT_COMMIT_SHA

NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED=true
NEXT_PUBLIC_SPEED_INSIGHTS_SAMPLE_RATE=0.2
```

Configure source-map upload values only as protected build secrets:

```bash
SENTRY_ORG=organization-slug
SENTRY_PROJECT=project-slug
SENTRY_AUTH_TOKEN=server-only-upload-token
SENTRY_RELEASE=$VERCEL_GIT_COMMIT_SHA
```

`SENTRY_AUTH_TOKEN` must never use a `NEXT_PUBLIC_` prefix. Source-map upload is
disabled unless the token, organization, and project are all present. Uploaded
maps are deleted from the generated build output afterward. Upload failures are
reported as build warnings and do not fail the product build.

The SDKs also refuse to initialize when `NEXT_PUBLIC_APP_ENV` is `development`,
`local`, or `test`, even if an enable flag is accidentally set. A deliberate
local transport check must use an isolated name such as `local-verification` and
must never point at the production Sentry environment.

## Data minimization guarantees

Sentry configuration explicitly disables cookies, headers, query parameters,
request and response bodies, database values, GraphQL documents and variables,
local stack variables, AI inputs and outputs, logs, breadcrumbs, tracing, and
session replay. A final allowlist rebuilds every error event before transport:

- exception messages are replaced with a fixed redacted message;
- user, profile, extra, and request-body fields are dropped;
- dynamic lesson, schedule, and persistence identifiers are replaced with route
  placeholders;
- only error type, stack locations, release, environment, and approved
  diagnostic tags remain.

Do not add `Sentry.setUser`, replay integrations, request attachments, console
capture, or AI input/output recording without a separate privacy review.

Vercel page events remove query strings, collapse lesson IDs to `/lesson/[id]`,
and exclude authentication and API routes. Custom events use this fixed
vocabulary and never include IDs, titles, topics, competencies, teacher fields,
document names, prompt text, or generated content:

| Event | Allowed properties |
| --- | --- |
| `lesson_generation_started` | curriculum, lesson type |
| `lesson_generation_succeeded` | curriculum, lesson type |
| `lesson_generation_failed` | bounded failure category |
| `editor_opened` | fixed editor surface |
| `export_completed` | DOCX, PDF, or PPTX format |

Speed Insights samples 20% of Web Vital measurements by default. Adjust the
public sample-rate variable from `0` to `1`; it never includes lesson content.

## Verification procedure

1. Deploy a preview with its own Sentry environment and release values. Do not
   reuse the production environment name.
2. Run `npm test`, `npx tsc --noEmit`, and `npm run build`. Confirm the build
   reports a source-map upload only when all three server-only upload variables
   are present.
3. In the preview, use React DevTools to trigger the lesson route error boundary,
   or temporarily throw `new Error("monitoring-verification")` from a private
   verification branch. Confirm retry restores the route without clearing the
   persisted editor draft.
4. In Sentry, confirm the event has the preview environment and expected release.
   Inspect event JSON: it must not contain lesson text, teacher instructions,
   profile values, cookies, authorization headers, prompts, generated output, or
   uploaded-document text. Remove the temporary throw before merging.
5. Generate one lesson, open its editor, and complete one export. Confirm only
   the five documented event names and allowed properties appear in Vercel.
6. Visit a lesson URL containing an ID and query string. Confirm Web Analytics
   records `/lesson/[id]` without the query. Confirm Speed Insights aggregates by
   the sanitized route.
7. Block Sentry and Vercel intake requests in the browser, then repeat generation,
   editing, and export. Each workflow must remain functional with no uncaught
   monitoring exception.
