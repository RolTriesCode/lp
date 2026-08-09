import assert from "node:assert";
import { describe, it } from "node:test";
import {
  applyVerifiedCurriculumRecord,
  assembleCurriculumContext,
} from "../../lib/curriculum/adapter";
import {
  findVerifiedCurriculumRecords,
  getVerifiedCurriculumRecordById,
} from "../../lib/curriculum/lookup";
import { lessonPlanDefaults } from "../../lib/lesson-plan-schema";
import { LocalResourceRepository } from "../../lib/resources/repository";
import { LocalTemplateRepository } from "../../lib/templates/repository";
import type { CurriculumRecord } from "../../lib/curriculum/types";
import type { LessonPlan } from "../../schemas/lesson";
import { DOCX_MIME_TYPE, type UploadedReference } from "../../schemas/reference";
import {
  MAX_TEMPLATE_CONTEXT_CHARACTERS,
  applyTemplateToLessonForm,
  buildTemplateGenerationContext,
} from "../../schemas/template";

const lesson: LessonPlan = {
  schemaVersion: "1.0",
  id: "lesson-template-source",
  title: "Photosynthesis through inquiry",
  curriculum: "MATATAG",
  lessonType: "DETAILED",
  gradeLevel: "Grade 7",
  subject: "Science",
  quarter: "Q1",
  week: "Week 1",
  duration: "60 mins",
  standards: {
    contentStandard: "Learners demonstrate understanding of plant life processes.",
    performanceStandard: "Learners communicate evidence from an investigation.",
    learningCompetency: "Explain how plants use light to produce food.",
    competencyCode: "S7LT-IIg-7",
  },
  objectives: ["Compare evidence collected before and after exposing leaves to light."],
  subjectMatter: {
    topic: "Photosynthesis in Plants",
    materials: ["Leaves", "Chart paper"],
    references: ["Verified curriculum guide"],
    valuesIntegration: ["Care for living things"],
  },
  procedures: [
    {
      id: "procedure-1",
      title: "Observe and explain",
      teacherActivity: "Present two leaf samples and ask evidence-based questions.",
      studentActivity: "Compare observations and explain the differences.",
    },
  ],
  assessment: [
    {
      id: "assessment-1",
      type: "identification",
      question: "How does light affect a plant's ability to make food?",
      choices: [],
      answer: "Light supplies the energy used during photosynthesis.",
      points: 3,
    },
  ],
  assignment: "Record one local plant observation.",
  reflection: "",
  createdAt: "2026-08-09T00:00:00.000Z",
  updatedAt: "2026-08-09T00:00:00.000Z",
};

const reference: UploadedReference = {
  id: "reference-library-test",
  name: "science-notes.docx",
  mimeType: DOCX_MIME_TYPE,
  byteSize: 2048,
  extractionStatus: "complete",
  extractedText: "Section 1\nPlants use light energy during photosynthesis.",
  segments: [
    {
      kind: "section",
      index: 1,
      label: "Section 1",
      characterCount: 53,
      includedCharacterCount: 53,
    },
  ],
  warnings: [],
};

describe("Reusable template workflows", () => {
  it("creates provider-neutral templates and preserves teacher-only form fields when applied", async () => {
    const repository = new LocalTemplateRepository(`templates-test-${crypto.randomUUID()}`);
    const template = await repository.createFromLesson(
      lesson,
      "Inquiry lesson",
      "A reusable evidence-first sequence."
    );

    assert.strictEqual("instructions" in template.defaults, false);
    assert.strictEqual("uploadedReferences" in template.defaults, false);
    assert.strictEqual(template.sectionPatterns.procedures[0].title, "Observe and explain");

    const applied = applyTemplateToLessonForm(template, {
      ...lessonPlanDefaults,
      instructions: "Use groups of four.",
      uploadedReferences: [reference],
    });
    assert.strictEqual(applied.topic, "Photosynthesis in Plants");
    assert.strictEqual(applied.instructions, "Use groups of four.");
    assert.deepStrictEqual(applied.uploadedReferences, [reference]);

    const context = buildTemplateGenerationContext(template);
    assert.ok(context.length <= MAX_TEMPLATE_CONTEXT_CHARACTERS);
    assert.match(context, /Inquiry lesson/);
  });

  it("renames, duplicates, lists, and deletes templates through the replaceable repository", async () => {
    const repository = new LocalTemplateRepository(`templates-test-${crypto.randomUUID()}`);
    const original = await repository.createFromLesson(lesson, "Inquiry lesson");
    const renamed = await repository.rename(original.id, "Evidence-first lesson");
    const duplicate = await repository.duplicate(original.id);

    assert.strictEqual(renamed?.name, "Evidence-first lesson");
    assert.ok(duplicate);
    assert.notStrictEqual(duplicate?.id, original.id);
    assert.match(duplicate?.name ?? "", /\(Copy\)$/);
    assert.strictEqual((await repository.list()).length, 2);

    await repository.delete(original.id);
    assert.strictEqual(await repository.get(original.id), null);
    assert.strictEqual((await repository.list()).length, 1);
  });
});

describe("Verified curriculum handoff", () => {
  it("filters only verified local records and applies an exact record to canonical lesson inputs", () => {
    const records = findVerifiedCurriculumRecords({
      curriculum: "MATATAG",
      gradeLevel: "Grade 7",
      subject: "Science",
      quarter: "Q1",
      topicSearch: "photosynthesis",
    });
    const record = getVerifiedCurriculumRecordById("rec-matatag-sci7-photosynthesis");

    assert.strictEqual(records.length, 1);
    assert.ok(record);
    const populated = applyVerifiedCurriculumRecord(lessonPlanDefaults, record!);
    assert.strictEqual(populated.curriculum, "MATATAG");
    assert.strictEqual(populated.curriculumRecordId, record?.id);
    assert.strictEqual(populated.grade, "7");
    assert.strictEqual(populated.topic, record?.topic);
    assert.strictEqual(populated.competency, record?.competencyText);
  });

  it("drops official provenance when a selected competency is edited or the quarter mismatches", () => {
    const record = getVerifiedCurriculumRecordById("rec-matatag-sci7-photosynthesis");
    assert.ok(record);
    const selected = applyVerifiedCurriculumRecord(lessonPlanDefaults, record!);
    const editedContext = assembleCurriculumContext({
      ...selected,
      competency: "A teacher-edited competency that is not the verified record.",
    });
    const wrongQuarterContext = assembleCurriculumContext({
      ...lessonPlanDefaults,
      topic: record!.topic,
      competency: record!.competencyText,
      quarter: "Q2",
    });
    const mismatchedFallbackContext = assembleCurriculumContext({
      ...lessonPlanDefaults,
      topic: record!.topic,
      competency: "A different teacher-authored competency.",
    });

    assert.strictEqual(editedContext.verificationStatus, "UNVERIFIED_TEACHER_DRAFT");
    assert.strictEqual(editedContext.competencyCode, "");
    assert.strictEqual(editedContext.isOfficialCode, false);
    assert.strictEqual(wrongQuarterContext.verificationStatus, "UNVERIFIED_TEACHER_DRAFT");
    assert.strictEqual(wrongQuarterContext.competencyCode, "");
    assert.strictEqual(mismatchedFallbackContext.verificationStatus, "UNVERIFIED_TEACHER_DRAFT");
    assert.strictEqual(mismatchedFallbackContext.competencyCode, "");
  });

  it("refuses unverified draft records", () => {
    const unverified: CurriculumRecord = {
      id: "teacher-draft",
      curriculum: "MATATAG",
      gradeLevel: "Grade 7",
      subject: "Science",
      quarter: "Q1",
      topic: "Unverified topic",
      competencyText: "Teacher-authored draft",
      competencyCode: "",
      sourceReference: "Teacher draft",
      verificationStatus: "UNVERIFIED_TEACHER_DRAFT",
      isOfficialCode: false,
    };

    assert.throws(
      () => applyVerifiedCurriculumRecord(lessonPlanDefaults, unverified),
      /Only verified curriculum records/
    );
    assert.strictEqual(getVerifiedCurriculumRecordById("missing-record"), undefined);
  });
});

describe("Central teaching resource repository", () => {
  it("stores extracted reference records once and keeps them reusable after lesson removal", async () => {
    const storageKey = `resources-test-${crypto.randomUUID()}`;
    const repository = new LocalResourceRepository(storageKey);
    const resource = await repository.saveReference(reference);

    assert.strictEqual(resource.kind, "reference_document");
    assert.strictEqual(resource.extractedText, reference.extractedText);
    assert.strictEqual((await repository.list()).length, 1);

    await repository.delete(resource.id);
    assert.strictEqual(await repository.get(resource.id), null);

    const remountedRepository = new LocalResourceRepository(storageKey);
    assert.strictEqual(await remountedRepository.synchronizeReference(reference), null);
    assert.strictEqual((await remountedRepository.list()).length, 0);

    await remountedRepository.saveReference(reference);
    assert.strictEqual((await remountedRepository.list()).length, 1);
  });
});
