# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Filipino teachers preparing curriculum-aligned lessons and teaching materials for classroom use.

## Product Purpose

AralAI is a teacher productivity workspace for creating, editing, reusing, and exporting MATATAG and ILAW lesson plans and related teaching materials. Success means teachers can move quickly from verified curriculum context to an editable lesson while retaining control over every structured section.

## Positioning

The product combines verified local curriculum provenance, structured lesson schemas, reusable teaching context, and provider-independent AI generation instead of operating as a generic chatbot or school-management portal.

## Operating Context

Teachers begin from the dashboard, configure or reuse lesson inputs, generate a structured lesson, edit individual sections, create supporting materials, attach local references, and export classroom-ready documents. The prototype stores drafts, templates, and resources locally; Supabase persistence and authentication arrive later.

## Capabilities and Constraints

- Supports MATATAG and ILAW curricula, Detailed and Semi-Detailed Lesson Plans, structured editing, assessments, worksheets, presentations, DOCX/PDF export, reusable templates, and local teaching resources.
- Official competency codes and verification claims may only come from verified local curriculum records.
- AI providers remain behind the internal provider abstraction and provider-specific instructions do not belong in reusable templates.
- Uploaded references are untrusted, bounded extraction records. OCR is not currently supported.
- The prototype excludes billing, a marketplace, social sharing, team collaboration, and permanent cloud storage.

## Brand Commitments

The product name is AralAI. Product language is calm, teacher-friendly, trustworthy, and focused on practical classroom work.

## Evidence on Hand

- Product and architecture requirements: `implementation.md`
- Incumbent dashboard visual reference: `public/reference/dashboard.png`
- Verified local curriculum records: `data/curriculum/records.ts`
- Canonical structured lesson and reference schemas: `schemas/lesson.ts`, `schemas/reference.ts`

No additional official curriculum content, customer claims, benchmarks, or marketplace content may be fabricated.

## Product Principles

- Verified curriculum provenance before official claims.
- Structured, editable outputs over opaque generated prose.
- Reuse without losing teacher control.
- Replaceable local repositories before permanent infrastructure.
- Accessible, calm productivity workflows over novelty or gamification.

## Accessibility & Inclusion

Application workflows must support keyboard navigation, visible focus, semantic labels, accessible dynamic states, adequate contrast, comfortable touch targets, reduced motion, and responsive use from mobile through desktop.
