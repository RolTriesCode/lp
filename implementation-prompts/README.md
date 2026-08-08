# AralAI Implementation Prompt Plan

This directory contains the complete implementation sequence derived from the project-root `implementation.md`. Run the prompts in numeric order. Each prompt is intentionally scoped to one coherent implementation milestone and requires Codex to inspect and preserve all completed work before making changes.

## Ordered development plan

| Step | Prompt | Reasoning | Outcome |
|---:|---|---|---|
| 01 | `01-dashboard-initialization.md` | MEDIUM | Establish the reference-matched `/dashboard` shell and direct prototype entry. |
| 02 | `02-dashboard-component-architecture.md` | HIGH | Split the dashboard into maintainable feature components. |
| 03 | `03-dashboard-sidebar.md` | MEDIUM | Implement the reference-matched navigation rail. |
| 04 | `04-dashboard-header.md` | MEDIUM | Implement search, notifications, and teacher profile chrome. |
| 05 | `05-dashboard-create-lesson-form.md` | HIGH | Build the reusable RHF and Zod lesson intake form. |
| 06 | `06-dashboard-mock-data.md` | LOW | Centralize realistic lesson and schedule prototype data. |
| 07 | `07-dashboard-recent-lessons.md` | MEDIUM | Build recent lesson rows and prototype menus. |
| 08 | `08-dashboard-quick-actions.md` | MEDIUM | Build dashboard shortcuts for the core generators. |
| 09 | `09-dashboard-teaching-schedule.md` | MEDIUM | Build the local weekly schedule panel. |
| 10 | `10-dashboard-responsive-layout.md` | HIGH | Adapt the dashboard across the required viewport targets. |
| 11 | `11-dashboard-motion-polish.md` | MEDIUM | Add restrained, reduced-motion-aware application feedback. |
| 12 | `12-dashboard-create-navigation.md` | HIGH | Connect valid dashboard submissions to `/lesson/create`. |
| 13 | `13-dashboard-qa.md` | HIGH | Complete visual, technical, responsive, and accessibility QA. |
| 14 | `14-lesson-create-screen.md` | HIGH | Build the full lesson review and generation-intake screen. |
| 15 | `15-core-lesson-schemas.md` | EXTRA HIGH | Define the canonical structured lesson data contracts. |
| 16 | `16-curriculum-data-foundation.md` | EXTRA HIGH | Separate MATATAG and ILAW structures and verified curriculum data. |
| 17 | `17-ai-provider-abstraction.md` | EXTRA HIGH | Add the secure provider-independent AI routing layer. |
| 18 | `18-ai-lesson-prompts.md` | EXTRA HIGH | Implement curriculum-specific structured lesson prompts. |
| 19 | `19-lesson-generation-api.md` | EXTRA HIGH | Build the validated server-side lesson generation pipeline. |
| 20 | `20-lesson-generation-ui.md` | HIGH | Connect generation with honest structured progress and recovery. |
| 21 | `21-lesson-draft-state-and-routing.md` | HIGH | Establish lesson IDs, prototype drafts, and shared editor state. |
| 22 | `22-structured-lesson-editor.md` | EXTRA HIGH | Build the Tiptap-backed structured lesson editor. |
| 23 | `23-section-ai-actions.md` | HIGH | Add targeted regeneration and rewriting without replacing the lesson. |
| 24 | `24-contextual-ai-assistant.md` | HIGH | Build the editor assistant around selected lesson content. |
| 25 | `25-prototype-lesson-library.md` | HIGH | Add local save, reopen, duplicate, delete, and draft recovery behavior. |
| 26 | `26-presentation-schema-and-generation.md` | EXTRA HIGH | Convert lesson JSON into validated slide JSON. |
| 27 | `27-presentation-builder-preview.md` | HIGH | Build theme selection, slide preview, and slide editing. |
| 28 | `28-pptx-export.md` | EXTRA HIGH | Generate real `.pptx` files with PptxGenJS. |
| 29 | `29-docx-export.md` | HIGH | Generate formal teacher-ready Word lesson plans. |
| 30 | `30-pdf-export.md` | HIGH | Generate reliable structured PDF lesson exports. |
| 31 | `31-assessment-generator.md` | HIGH | Generate validated assessments and answer keys. |
| 32 | `32-worksheet-generator.md` | HIGH | Generate printable worksheets and answer keys. |
| 33 | `33-rubrics-and-teaching-packs.md` | HIGH | Add rubrics and coordinated teaching-material bundles. |
| 34 | `34-reference-document-ingestion.md` | HIGH | Ingest DOCX and PDF references safely for generation context. |
| 35 | `35-templates-curriculum-resources.md` | HIGH | Build templates, curriculum browsing, and reusable resources. |
| 36 | `36-supabase-foundation.md` | EXTRA HIGH | Add Supabase clients, migrations, JSONB storage, and access policy. |
| 37 | `37-supabase-persistence-and-storage.md` | EXTRA HIGH | Persist lessons and generated artifacts; integrate uploads. |
| 38 | `38-supabase-auth-and-profiles.md` | HIGH | Add authentication, profiles, sessions, and protected app routes. |
| 39 | `39-calendar-planner-and-classroom-context.md` | HIGH | Build planning workflows and reusable classroom context. |
| 40 | `40-advanced-pedagogy-tools.md` | EXTRA HIGH | Add differentiation, alignment, objective, Bloom, and teaching tools. |
| 41 | `41-remaining-product-pages.md` | HIGH | Complete and connect all application destinations and states. |
| 42 | `42-observability-and-analytics.md` | MEDIUM | Add privacy-conscious Sentry and Vercel Analytics after core stability. |
| 43 | `43-system-qa-security-performance.md` | EXTRA HIGH | Validate the complete authenticated product and export workflows. |
| 44 | `44-landing-page.md` | HIGH | Build the marketing page last using real product UI. |
| 45 | `45-landing-page-motion.md` | HIGH | Add restrained GSAP and ScrollTrigger storytelling motion. |
| 46 | `46-deployment-and-release.md` | HIGH | Prepare and verify the production release on Vercel. |

## Architecture checkpoints

- Steps 01–13 establish and verify the dashboard design system.
- Steps 14–25 prove the lesson creation, generation, editing, and local prototype workflow.
- Steps 26–35 produce teaching materials and resource workflows from the same structured lesson object.
- Steps 36–38 add persistence, storage, and authentication only after the core workflow is functional.
- Steps 39–41 complete the V1 and V2 application experience without adding billing, collaboration, or admin scope.
- Steps 42–46 harden, market, animate, and release the finished product.

## Permanent constraints

- `implementation.md` remains authoritative when a prompt and the codebase appear to conflict.
- Existing working features and user changes must be preserved.
- Structured, Zod-validated lesson data is the center of the architecture.
- UI code must not depend directly on Groq, Cerebras, or OpenRouter.
- Provider keys and other secrets must remain server-side.
- Supabase is the persistence and authentication platform; do not introduce Prisma or Better Auth.
- Motion is for application UI. GSAP and ScrollTrigger are reserved primarily for the landing page.
- Stripe, subscriptions, team collaboration, admin dashboards, social features, and complex analytics are outside this sequence.
