# AralAI / MATATAG + ILAW Lesson Plan Maker
## Implementation Guide for Codex

> Purpose: This document gives Codex the complete product direction, technical stack, architecture, design rules, prototype scope, and implementation sequence for an AI-powered lesson planning web application for Filipino teachers.

---

# 1. Product Overview

Build a modern AI-powered lesson planning workspace for Filipino teachers.

The application should support:

- MATATAG lesson plans
- ILAW lesson plans
- Detailed Lesson Plans
- Semi-Detailed Lesson Plans
- AI-assisted lesson generation
- AI-assisted editing
- Assessment generation
- Worksheet generation
- Presentation / PPT generation
- DOCX export
- PDF export
- Reusable templates
- Lesson management
- Future teacher profiles and authentication

The product should feel like a polished teacher productivity application, not a generic AI chatbot or generic school management system.

The primary product goal is:

> Help teachers create curriculum-aligned lesson plans and teaching materials quickly while still giving them complete editing control.

---

# 2. Current Development Goal

We are building a prototype first.

Do NOT begin with:

- landing page
- sign in
- sign up
- authentication
- billing
- subscription management
- analytics dashboards
- complex user permissions

The current prototype development order is:

1. Dashboard
2. Create Lesson flow
3. AI Lesson Plan Generator
4. Generated Lesson Editor
5. PPT Generator
6. DOCX Export
7. Assessment Generator
8. Worksheet Generator
9. Supabase persistence
10. Authentication
11. Remaining product pages
12. Landing page last

The prototype must prove the core workflow first:

```text
Dashboard
    ↓
Create Lesson
    ↓
Generate MATATAG / ILAW Lesson
    ↓
Edit Lesson
    ↓
Generate Teaching Materials
    ↓
Export
```

---

# 3. Design References

Design reference files will be stored under:

```text
/public/reference/
```

Current reference:

```text
/public/reference/dashboard.png
```

Future references may include:

```text
/public/reference/auth.png
/public/reference/lesson-create.png
/public/reference/lesson-editor.png
/public/reference/ppt-maker.png
```

Whenever a reference image exists:

- treat the reference as the visual source of truth
- do not redesign it
- do not replace it with a generic SaaS layout
- reproduce the layout as accurately as reasonably possible
- match spacing, typography, sizing, proportions, borders, radius, shadows, icon scale, and hierarchy
- preserve the design language across the application

Codex should use implementation judgment only where the reference does not define behavior or responsive layout.

---

# 4. Design Direction

The interface should feel:

- modern
- minimal
- refined
- premium
- teacher-friendly
- productivity-focused
- calm
- trustworthy
- high quality
- production-ready

Avoid:

- generic AI SaaS styling
- excessive gradients
- excessive rounded cards
- glassmorphism everywhere
- giant glowing AI icons
- excessive shadows
- gamification clutter
- government-portal styling
- overly childish education visuals

Use subtle motion and strong visual hierarchy.

The app should feel closer to a premium productivity tool than an LMS.

---

# 5. Technology Stack

Use the following stack.

## Core

1. Next.js 16
2. React 19
3. TypeScript
4. Tailwind CSS

## UI

5. shadcn/ui
6. Radix UI
7. Lucide React

## Animation

8. GSAP
9. ScrollTrigger
10. Motion

Rules:

- Use Motion for dashboard and application UI transitions.
- Use GSAP + ScrollTrigger mainly for the future marketing / landing page.
- Do not add large GSAP animations to productivity screens unless clearly justified.

## Backend / Database

11. Supabase PostgreSQL
12. Supabase Auth
13. Supabase Storage
14. Supabase JS

For the initial prototype:

- authentication can be skipped
- persistence may begin with local/mock state
- Supabase integration should be introduced after the core lesson generation workflow works

## AI

15. Vercel AI SDK
16. Groq
17. Cerebras
18. OpenRouter

Create an internal AI provider abstraction. UI components must not directly depend on one provider.

Expected conceptual structure:

```text
AI Router
├── Groq
├── Cerebras
└── OpenRouter
```

Possible strategy:

```text
Fast rewriting / assistant requests → Groq
Long structured lesson generation → Cerebras or selected model
Fallback → OpenRouter
```

Do not expose provider selection to normal users unless there is a future advanced setting.

## Validation / Forms

19. Zod
20. React Hook Form

All AI-generated structured data must be validated using Zod.

## Editor / State

21. Tiptap
22. Zustand

Use:

- React state for local simple state
- URL state where useful
- Zustand only for meaningful shared client state
- Tiptap for rich lesson editing

Do not introduce Redux.

## File / Document Processing

23. Mammoth
24. PptxGenJS
25. docx
26. PDF.js / PDF parser

Use:

- Mammoth for DOCX reading/import
- PptxGenJS for PPTX generation
- `docx` for Word document export
- PDF.js / parser for PDF ingestion when needed

## Deployment / Monitoring

27. Vercel
28. Git
29. GitHub
30. Sentry
31. Vercel Analytics

Do not prioritize Sentry or Analytics until the prototype workflow is functional.

---

# 6. Recommended Project Structure

Use a structure similar to:

```text
src/
├── app/
│   ├── dashboard/
│   │   └── page.tsx
│   │
│   ├── lesson/
│   │   ├── create/
│   │   │   └── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   │
│   ├── presentations/
│   ├── assessments/
│   ├── worksheets/
│   ├── templates/
│   ├── calendar/
│   ├── settings/
│   │
│   └── api/
│       ├── ai/
│       ├── export/
│       └── uploads/
│
├── components/
│   ├── ui/
│   ├── dashboard/
│   ├── lesson/
│   ├── editor/
│   ├── presentation/
│   ├── assessment/
│   └── common/
│
├── lib/
│   ├── ai/
│   │   ├── router.ts
│   │   ├── providers/
│   │   │   ├── groq.ts
│   │   │   ├── cerebras.ts
│   │   │   └── openrouter.ts
│   │   ├── prompts/
│   │   └── schemas/
│   │
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   │
│   ├── documents/
│   ├── curriculum/
│   └── utils/
│
├── schemas/
│   ├── lesson.ts
│   ├── presentation.ts
│   ├── assessment.ts
│   └── worksheet.ts
│
├── data/
│   ├── dashboard.ts
│   └── curriculum/
│
└── types/
```

Do not over-abstract prematurely.

Prefer logical components over excessive micro-components.

---

# 7. Core Data Architecture

AI output must NOT be stored as one giant Markdown string.

The lesson plan should use structured data.

Conceptual schema:

```ts
type CurriculumType = "MATATAG" | "ILAW";

type LessonType =
  | "DETAILED"
  | "SEMI_DETAILED";

type LessonPlan = {
  id?: string;

  curriculum: CurriculumType;
  lessonType: LessonType;

  title: string;
  gradeLevel: string;
  subject: string;

  quarter?: string;
  week?: string;
  duration?: string;

  standards: {
    contentStandard?: string;
    performanceStandard?: string;
    competency?: string;
    competencyCode?: string;
  };

  objectives: string[];

  subjectMatter: {
    topic: string;
    references: string[];
    materials: string[];
    valuesIntegration?: string[];
  };

  procedures: LessonProcedure[];

  assessment: AssessmentItem[];

  assignment?: string;

  reflection?: string;
};

type LessonProcedure = {
  id: string;
  title: string;
  teacherActivity?: string;
  studentActivity?: string;
  content?: string;
};

type AssessmentItem = {
  id: string;
  type?: string;
  question: string;
  answer?: string;
};
```

Actual schemas must use Zod.

The same lesson object should support:

```text
Lesson Editor
PPT Generator
DOCX Export
PDF Export
Assessment Generator
Worksheet Generator
Teaching Pack
```

---

# 8. MATATAG and ILAW Handling

MATATAG and ILAW must not simply be labels applied to identical generated text.

The system should support curriculum-specific structures.

Create separate prompt templates or schemas where necessary:

```text
lib/ai/prompts/
├── matatag.ts
├── ilaw.ts
├── presentation.ts
├── assessment.ts
└── worksheet.ts
```

The model should receive:

- curriculum
- grade
- subject
- quarter
- topic
- competency where available
- lesson type
- duration
- teacher instructions

Eventually, verified curriculum data should come from a curriculum database rather than model memory.

Do not allow the model to invent official competency codes when verified source data is unavailable.

---

# 9. AI Architecture

Do NOT place provider-specific calls throughout components.

Bad:

```ts
groq.chat.completions.create(...)
```

inside a React page.

Good:

```ts
generateLesson(...)
generateAssessment(...)
generatePresentation(...)
rewriteLessonSection(...)
```

Create a service layer.

Example:

```text
lib/ai/
├── router.ts
├── generate-lesson.ts
├── generate-presentation.ts
├── generate-assessment.ts
├── rewrite-section.ts
├── providers/
└── prompts/
```

Suggested conceptual flow:

```text
UI
 ↓
Server Action / Route Handler
 ↓
AI Service
 ↓
Provider Router
 ↓
Groq / Cerebras / OpenRouter
 ↓
Structured Output
 ↓
Zod Validation
 ↓
Return typed object
```

Important:

- never expose API keys client-side
- validate all model output
- return useful user-facing errors
- avoid sending unnecessary context
- preserve lesson state when one section is regenerated

---

# 10. Dashboard Prototype

The dashboard is the current first screen.

Reference:

```text
/public/reference/dashboard.png
```

Core dashboard content:

- sidebar
- top header
- welcome section
- Create Lesson Plan area
- quick actions
- recent lesson plans
- teaching schedule

The dashboard must prioritize action, not analytics.

Primary question:

> What are we teaching today?

The main CTA:

> Generate Lesson Plan

---

# 11. Dashboard Create Lesson Form

The dashboard form should support:

## Curriculum

- MATATAG
- ILAW

## Lesson Type

- Detailed Lesson Plan
- Semi-Detailed Lesson Plan

## Grade

Prepare reusable grade options.

## Subject

Examples:

- English
- Filipino
- Mathematics
- Science
- Araling Panlipunan
- MAPEH
- Values Education
- Technology and Livelihood Education

Do not assume this list is final.

## Additional fields

- Quarter
- Topic
- Duration
- Optional competency
- Additional teacher instructions

Use:

- React Hook Form
- Zod

On prototype submission:

```text
/dashboard
    ↓
/lesson/create
```

Pass values using URL params or shared prototype state.

---

# 12. Prototype Mock Data

Before Supabase persistence exists, create realistic local mock data.

Example recent lessons:

```text
Grade 7 English
Types of Metrical Feet
MATATAG
Detailed Lesson Plan

Grade 6 Science
Photosynthesis
MATATAG
Semi-Detailed Lesson Plan

Grade 5 Mathematics
Fractions

Grade 4 English
Subject-Verb Agreement
```

Place mock data in:

```text
src/data/dashboard.ts
```

Do not scatter fake data through UI components.

---

# 13. Lesson Creation Screen

After the dashboard, build:

```text
/lesson/create
```

The user should be able to review and adjust:

- curriculum
- lesson type
- grade
- subject
- quarter
- competency
- topic
- duration
- class size
- available resources
- language
- additional instructions

Primary action:

> Generate Lesson

During generation, show structured progress instead of a generic spinner.

Example:

```text
Building your lesson

✓ Reading lesson details
✓ Preparing curriculum context
● Creating objectives
○ Designing activities
○ Building assessment
○ Finalizing lesson
```

Do not fake progress percentages if the backend does not provide real progress.

---

# 14. Lesson Editor

After generation:

```text
/lesson/[id]
```

The editor is one of the main product screens.

Use Tiptap where appropriate.

Core features:

- edit generated text
- autosave later
- regenerate a section
- improve a section
- shorten
- expand
- simplify
- formalize
- add activity
- generate assessment
- generate worksheet
- generate presentation

Do not regenerate the entire lesson when the user only wants one section changed.

Suggested layout:

```text
Lesson content                 AI Assistant
──────────────────────────     ──────────────
Objectives                     Ask AI
Subject Matter
Procedures                     Improve
Assessment                     Simplify
Assignment                     Add activity
Reflection                     Generate quiz
```

---

# 15. PPT Generator

Use PptxGenJS.

The AI should generate structured slide data first.

Conceptual slide schema:

```ts
type Presentation = {
  title: string;
  theme: string;
  slides: Slide[];
};

type Slide = {
  id: string;
  title: string;
  subtitle?: string;
  bullets?: string[];
  body?: string;
  speakerNotes?: string;
  layout?: string;
  imagePrompt?: string;
};
```

Flow:

```text
Lesson JSON
 ↓
Presentation Generation
 ↓
Slide JSON
 ↓
Preview
 ↓
PptxGenJS
 ↓
.pptx
```

Initial themes may include:

- Minimal
- Academic
- Classroom
- Elementary
- Professional
- Science
- Mathematics

Avoid creating fake PowerPoint screenshots as the export logic.

---

# 16. DOCX Export

Use `docx`.

Generate formal lesson plan documents based on structured lesson data.

Support teacher-document style formatting.

Future profile fields can populate:

- school
- teacher
- date
- grade level
- learning area
- quarter

Do not export raw web HTML if a cleaner structured Word document can be generated.

---

# 17. PDF Support

PDF is lower priority than DOCX and PPTX for the prototype.

Use PDF.js / parser for future uploaded PDF references.

For export, choose a reliable server-side PDF strategy when implementation begins.

Do not over-engineer PDF export during the first dashboard phase.

---

# 18. Supabase Integration

Supabase will eventually provide:

- PostgreSQL
- Auth
- Storage

For the prototype, integrate Supabase only when core generation/editing works.

Possible lesson table:

```text
lesson_plans

id
user_id
title
curriculum
lesson_type
grade_level
subject
quarter
status
content JSONB
created_at
updated_at
```

Using JSONB for generated lesson content is acceptable and useful during rapid product iteration.

Future tables may include:

```text
profiles
lesson_plans
presentations
assessments
worksheets
templates
uploaded_resources
```

Do not normalize every nested generated field into its own table prematurely.

---

# 19. Supabase Auth

Authentication is intentionally postponed for the prototype.

Later support:

- email/password
- Google OAuth
- session handling
- protected routes

Do not add Better Auth or Prisma unless explicitly requested later.

Current architecture uses Supabase.

---

# 20. Supabase Storage

Future uses:

- teacher uploaded references
- school logos
- lesson attachments
- generated images
- reusable resources

Do not store generated DOCX/PPTX files permanently unless needed.

Prefer generating exports on demand during the prototype.

---

# 21. State Management Rules

Use the simplest appropriate tool.

Use:

### React state
For local component state.

### URL state
For:

- selected lesson ID
- create lesson query values
- filters that should be shareable

### React Hook Form
For forms.

### Zustand
For shared interactive state such as:

- lesson editor draft
- presentation builder
- unsaved generation state
- selected lesson blocks

Do not put everything in Zustand.

---

# 22. Motion Rules

Productivity UI motion:

- duration around 150–300ms
- subtle
- responsive
- purposeful

Good uses:

- cards
- dialogs
- panel transitions
- active sidebar state
- form errors
- content generation state

Avoid:

- scroll-jacking
- excessive parallax
- giant transitions between app screens
- distracting hover effects

Respect:

```text
prefers-reduced-motion
```

GSAP + ScrollTrigger is primarily reserved for the future landing page.

---

# 23. Accessibility

All application screens should support:

- keyboard navigation
- visible focus states
- semantic form labels
- meaningful buttons
- accessible error states
- adequate contrast
- correct heading hierarchy
- minimum comfortable touch targets
- reduced motion

Do not sacrifice usability for visual fidelity.

---

# 24. Responsive Requirements

Target roughly:

```text
375px
430px
768px
1024px
1440px
```

Desktop reference images are the primary visual source.

For mobile:

- do not merely shrink desktop
- collapse the sidebar
- stack dashboard sections
- make forms full-width
- preserve hierarchy
- avoid horizontal scrolling
- maintain usable tap targets

---

# 25. Code Quality Rules

Always:

- use strict TypeScript
- avoid `any` unless justified
- keep components readable
- use server components by default where appropriate
- add `"use client"` only when needed
- avoid unnecessary client-side rendering
- avoid unnecessary dependencies
- avoid duplicated UI logic
- avoid giant monolithic components
- validate external data
- never expose secrets client-side
- avoid placeholder TODO architecture unless clearly documented

Before considering a task complete:

- check TypeScript
- check linting
- check console
- check hydration
- check responsive behavior
- check accessibility
- check visual fidelity against references

---

# 26. Dashboard Implementation Sequence

Codex should generate implementation prompts one step at a time.

Each generated prompt should include:

1. objective
2. exact scope
3. files likely involved
4. implementation constraints
5. acceptance criteria
6. reasoning level

Do not combine all implementation work into one giant prompt.

---

# 27. Reasoning Levels

Use:

- LOW
- MEDIUM
- HIGH
- EXTRA HIGH

Use the minimum reasoning necessary.

---

# 28. Dashboard Prompt Sequence + Reasoning

## Step 1 — Initialize Dashboard
**Reasoning: MEDIUM**

Goal:

- create `/dashboard`
- inspect `/public/reference/dashboard.png`
- reproduce static shell
- skip auth and backend

---

## Step 2 — Component Architecture
**Reasoning: HIGH**

Goal:

Break the dashboard into logical reusable components.

Possible structure:

```text
components/dashboard/
├── dashboard-shell.tsx
├── dashboard-sidebar.tsx
├── dashboard-header.tsx
├── welcome-section.tsx
├── create-lesson-card.tsx
├── quick-actions.tsx
├── recent-lessons.tsx
└── teaching-schedule.tsx
```

Avoid both a monolithic page and pointless one-div components.

---

## Step 3 — Sidebar
**Reasoning: MEDIUM**

Implement:

- logo
- nav
- active state
- icons
- settings area
- hover
- future responsive behavior

Use Lucide icons.

---

## Step 4 — Header
**Reasoning: MEDIUM**

Implement:

- search
- notification
- profile
- utility controls from reference

Do not add complex behavior yet.

---

## Step 5 — Create Lesson Area
**Reasoning: HIGH**

Implement the core dashboard action.

Fields:

- curriculum
- grade
- subject
- quarter
- lesson type
- topic
- duration
- optional competency
- additional instructions where suitable

Use React Hook Form + Zod.

Initially submit to console or prototype flow.

---

## Step 6 — Mock Data
**Reasoning: LOW**

Add realistic lesson and schedule mock data.

Store in dedicated data file.

---

## Step 7 — Recent Lessons
**Reasoning: MEDIUM**

Implement recent lesson cards / rows.

Prototype actions:

- Open
- Duplicate
- Generate PPT
- Export
- Delete

Do not implement backend behavior yet.

---

## Step 8 — Quick Actions
**Reasoning: MEDIUM**

Actions:

- Create Lesson Plan
- Generate Presentation
- Create Assessment
- Create Worksheet

Only Create Lesson needs meaningful navigation initially.

---

## Step 9 — Teaching Schedule
**Reasoning: MEDIUM**

Implement local weekly schedule UI.

Do not build full calendar logic.

---

## Step 10 — Responsive Dashboard
**Reasoning: HIGH**

Adapt desktop reference to:

- tablet
- mobile
- collapsible sidebar
- stacked sections
- mobile-friendly forms

---

## Step 11 — Motion Polish
**Reasoning: MEDIUM**

Use Motion for:

- page entrance
- cards
- active navigation
- dropdowns
- validation feedback

No GSAP necessary.

---

## Step 12 — Create Lesson Navigation
**Reasoning: HIGH**

On successful dashboard form submission:

```text
/dashboard
 ↓
/lesson/create
```

Pass prototype values safely.

Keep schema reusable.

---

## Step 13 — Dashboard QA
**Reasoning: HIGH**

Audit:

- visual match
- responsive layout
- accessibility
- TypeScript
- console
- hydration
- validation
- navigation

Do not redesign.

---

# 29. Core Product Implementation Sequence

After Dashboard:

## Phase A — Lesson Create Screen
**Reasoning: HIGH**

Build `/lesson/create`.

---

## Phase B — Lesson Schema
**Reasoning: EXTRA HIGH**

Finalize Zod schemas for:

- MATATAG
- ILAW
- Detailed
- Semi-Detailed

This architecture will affect the entire product.

---

## Phase C — AI Provider Layer
**Reasoning: EXTRA HIGH**

Implement:

- Vercel AI SDK
- Groq
- Cerebras
- OpenRouter
- fallback strategy
- error handling
- structured output validation

---

## Phase D — Lesson Generation API
**Reasoning: EXTRA HIGH**

Generate structured lesson plans safely.

---

## Phase E — Lesson Generation UI
**Reasoning: HIGH**

Connect the create form to AI.

---

## Phase F — Lesson Editor
**Reasoning: EXTRA HIGH**

Build editable structured lesson interface using Tiptap.

---

## Phase G — Section AI Actions
**Reasoning: HIGH**

Support:

- improve
- simplify
- expand
- shorten
- regenerate
- add activity
- create assessment

---

## Phase H — PPT Generator
**Reasoning: EXTRA HIGH**

Build:

- lesson → slide schema
- slide preview
- PPTX export using PptxGenJS

---

## Phase I — DOCX Export
**Reasoning: HIGH**

Build formal lesson export using `docx`.

---

## Phase J — Assessment Generator
**Reasoning: HIGH**

Generate:

- multiple choice
- true/false
- identification
- essay
- performance task
- answer key

---

## Phase K — Worksheet Generator
**Reasoning: HIGH**

Generate printable worksheets and answer keys.

---

## Phase L — Supabase Persistence
**Reasoning: EXTRA HIGH**

Add:

- lesson saving
- updates
- presentation persistence
- assessments
- storage where needed

---

## Phase M — Authentication
**Reasoning: HIGH**

Add Supabase Auth after prototype workflow works.

---

## Phase N — Landing Page
**Reasoning: HIGH**

Build last.

Use real product UI as landing-page visuals.

Use GSAP + ScrollTrigger for carefully designed marketing motion.

---

# 30. Product Features Roadmap

## MVP

Must have:

- Dashboard
- MATATAG / ILAW
- Detailed / Semi-Detailed
- Lesson generation
- Editable lesson
- Section regeneration
- Save lesson
- DOCX export
- PPT generation
- Basic assessment generation

## V1

Add:

- worksheet generator
- rubrics
- AI assistant
- templates
- curriculum browser
- lesson duplication
- Supabase Auth
- user profile
- uploaded references
- PDF support

## V2

Add:

- weekly planner
- calendar
- differentiated instruction
- teaching packs
- presentation mode
- teacher notes
- reusable classroom context
- curriculum alignment checker
- objective validator
- Bloom’s taxonomy controls

---

# 31. Features That Should NOT Be Prioritized Yet

Do not spend early development time on:

- Stripe
- subscriptions
- premium tiers
- landing-page animations
- complex analytics
- social features
- team collaboration
- admin dashboards
- notifications
- email campaigns
- full calendar logic
- advanced theme customization

The product is currently free.

Stripe is not needed.

---

# 32. Prototype Success Criteria

The prototype succeeds when a teacher can:

1. Open the dashboard.
2. Choose MATATAG or ILAW.
3. Choose Detailed or Semi-Detailed.
4. Enter lesson details.
5. Generate a coherent structured lesson.
6. Edit the generated lesson.
7. Improve individual sections using AI.
8. Generate a presentation.
9. Export the lesson as DOCX.
10. Generate an assessment.

If those ten steps work well, the prototype has proven the core product.

---

# 33. Codex Prompt Generation Instructions

When asked to implement the project:

- read this entire document first
- determine the current development phase
- do not skip ahead unnecessarily
- produce ONE focused implementation prompt at a time unless explicitly asked for multiple
- include the reasoning level
- make the prompt executable and specific
- reference existing project files where known
- preserve already completed work
- avoid rewriting unrelated code
- do not install unused dependencies
- do not redesign reference-based UI
- prefer maintainable solutions over clever ones

Every implementation prompt should use this format:

```text
STEP:
[step name]

REASONING:
LOW | MEDIUM | HIGH | EXTRA HIGH

OBJECTIVE:
[what must be completed]

REFERENCE:
[relevant design file]

FILES / AREAS:
[likely files]

IMPLEMENTATION:
[detailed instructions]

DO NOT:
[important restrictions]

ACCEPTANCE CRITERIA:
[clear completion requirements]
```

---

# 34. Current Starting Point

The immediate task is:

```text
STEP 1 — Dashboard Initialization
```

Reference:

```text
/public/reference/dashboard.png
```

Current priority:

> Recreate the dashboard and establish the product design system before building the lesson generator.

Authentication and the landing page are intentionally skipped for now.

---

# 35. Final Architectural Principle

The core of the application should remain:

```text
Curriculum Data
      ↓
Lesson Input
      ↓
AI Generation
      ↓
Validated Structured Lesson JSON
      ↓
┌───────────────┬──────────────┬──────────────┐
│ Lesson Editor │ Presentation │ Assessment   │
│               │ Generator    │ Generator    │
├───────────────┼──────────────┼──────────────┤
│ DOCX Export   │ Worksheet    │ Teaching Pack│
└───────────────┴──────────────┴──────────────┘
```

Do not design the architecture around individual AI providers.

Design it around structured lesson data.

That lesson object is the center of the product.
