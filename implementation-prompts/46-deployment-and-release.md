STEP:
46 — Deployment and Production Release

REASONING:
HIGH

OBJECTIVE:
Prepare, deploy, and verify the complete AralAI application on Vercel with secure configuration and a reproducible release process.

REFERENCE:
Sections 5, 25, 31, and 32 of `implementation.md`

FILES / AREAS:
Vercel configuration, environment documentation, Git and GitHub workflow, Supabase production project, domain and metadata settings, release checklist

IMPLEMENTATION:
- Audit the repository for generated files, secrets, debug logs, local-only URLs, stale feature flags, unused dependencies, and uncommitted unrelated changes.
- Document required environment variables for Supabase, AI providers, Sentry, and application URLs without committing secret values.
- Configure separate preview and production environments and point each to appropriate Supabase and monitoring resources.
- Apply reviewed database migrations and RLS policies to production using a controlled migration process.
- Verify Next.js production build, route behavior, image and font delivery, server runtime compatibility, AI timeouts, upload limits, and export responses.
- Configure the production domain, OAuth callback URLs, metadata, robots behavior, and canonical URLs.
- Establish a GitHub-based deployment workflow with preview deployments and a rollback procedure.
- Run smoke tests in the deployed environment across authentication, lesson generation, editing, saving, exports, and ownership boundaries.
- Record the release version, migration version, known limitations, and recovery steps.

DO NOT:
- Commit secrets, service-role keys, generated teacher files, or private test data.
- Enable billing features, subscriptions, team collaboration, or unrelated roadmap scope.
- Declare release success without deployed smoke-test evidence.

ACCEPTANCE CRITERIA:
- Production deploys successfully from the documented Git workflow.
- Environment variables, OAuth, Supabase, AI routing, monitoring, uploads, and exports work in production.
- Security and ownership checks pass against production configuration.
- Rollback and migration recovery procedures are documented and tested where practical.
