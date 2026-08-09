import assert from "node:assert";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import type {
  ILessonStorageAdapter,
  LessonSaveOptions,
  PersistedEntity,
} from "../../lib/persistence/types";
import { PersistenceConflictError } from "../../lib/persistence/types";
import { RemoteEntityRepository } from "../../lib/persistence/remote-repository";
import { useLessonStore } from "../../stores/lesson-store";
import { LessonPlanSchema, type LessonPlan } from "../../schemas/lesson";

const projectRoot = process.cwd();
const persistenceMigration = `${projectRoot}/supabase/migrations/20260809010000_persistence_storage.sql`;

const lesson = LessonPlanSchema.parse({
  schemaVersion: "1.0",
  id: "00000000-0000-4000-8000-000000000100",
  curriculum: "MATATAG",
  lessonType: "DETAILED",
  title: "Revision-aware science lesson",
  gradeLevel: "Grade 7",
  subject: "Science",
  quarter: "Q1",
  week: "Week 1",
  duration: "60 mins",
  standards: {},
  objectives: ["Explain how evidence supports a scientific conclusion."],
  subjectMatter: {
    topic: "Scientific evidence",
    references: [],
    materials: ["Observation notes"],
    valuesIntegration: ["Accuracy"],
  },
  procedures: [{ id: "procedure-1", title: "Examine evidence", content: "Compare observations." }],
  assessment: [],
  assignment: "",
  reflection: "",
  createdAt: "2026-08-09T00:00:00.000Z",
  updatedAt: "2026-08-09T00:00:00.000Z",
});

function persisted(value: LessonPlan, revision: number): PersistedEntity<LessonPlan> {
  return {
    id: value.id!,
    value,
    revision,
    status: "draft",
    createdAt: value.createdAt!,
    updatedAt: value.updatedAt!,
  };
}

describe("revision and private Storage migration", () => {
  it("adds atomic revision tokens and an idempotent local-import key", async () => {
    const sql = await readFile(persistenceMigration, "utf8");
    ["lesson_plans", "presentations", "assessments", "worksheets", "templates", "uploaded_resources"]
      .forEach((table) => assert.match(sql, new RegExp(`alter table public\\.${table}[\\s\\S]*?revision bigint not null default 1`)));
    assert.match(sql, /new\.revision = old\.revision \+ 1/);
    assert.match(sql, /lesson_plans_user_prototype_source_uidx/);
    assert.match(sql, /prototype_source_id is not null/);
  });

  it("creates only private, bounded teacher asset buckets and ownership-scoped policies", async () => {
    const sql = await readFile(persistenceMigration, "utf8");
    ["teacher-references", "school-logos", "lesson-attachments", "generated-images"]
      .forEach((bucket) => assert.match(sql, new RegExp(`'${bucket}'`)));
    assert.match(sql, /'teacher-references',[\s\S]*?false,[\s\S]*?10485760/);
    assert.match(sql, /storage\.foldername\(name\)\)\[1\] = \(select auth\.uid\(\)\)::text/);
    assert.match(sql, /owner_id = \(select auth\.uid\(\)\)::text/);
    assert.match(sql, /for select to authenticated/);
    assert.match(sql, /for insert to authenticated/);
    assert.match(sql, /for update to authenticated/);
    assert.match(sql, /for delete to authenticated/);
    assert.doesNotMatch(sql, /to\s+anon\b/i);
    assert.match(sql, /uploaded_resources_owner_path/);
    assert.match(sql, /byte_size <= 10485760/);
  });

  it("keeps reference validation before private storage and leaves exports on demand", async () => {
    const [uploadSource, docxSource, pptxSource] = await Promise.all([
      readFile(`${projectRoot}/app/api/uploads/reference/route.ts`, "utf8"),
      readFile(`${projectRoot}/app/api/lesson/export/docx/route.ts`, "utf8"),
      readFile(`${projectRoot}/app/api/presentation/export/pptx/route.ts`, "utf8"),
    ]);
    const extractionCall = uploadSource.indexOf("const reference = await processReferenceUpload");
    const storageCall = uploadSource.indexOf("const persisted = await createUploadedResourceWithFile");
    assert.ok(extractionCall > -1 && storageCall > extractionCall);
    assert.doesNotMatch(`${docxSource}\n${pptxSource}`, /storage\.(from|upload)/);
  });

  it("provides every repository operation behind owner and revision boundaries", async () => {
    const source = await readFile(`${projectRoot}/lib/supabase/repositories/server.ts`, "utf8");
    ["lesson-plans", "presentations", "assessments", "worksheets", "templates", "uploaded-resources"]
      .forEach((entity) => assert.match(source, new RegExp(`case "${entity}"`)));
    ["LessonPlanSchema", "PresentationSchema", "AssessmentSchema", "WorksheetSchema", "LessonTemplateSchema", "TeachingResourceSchema"]
      .forEach((schema) => assert.match(source, new RegExp(`schema: ${schema}`)));
    assert.match(source, /\.eq\("user_id", userId\)/);
    assert.match(source, /\.eq\("revision", expectedRevision\)/);
    assert.match(source, /async duplicate\(id: string\)/);
    assert.match(source, /async delete\(id: string\)/);
    assert.doesNotMatch(source, /service.role|service_role/i);
  });
});

describe("remote canonical validation", () => {
  it("rejects malformed JSON before sending a create request", async () => {
    let called = false;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      called = true;
      throw new Error("fetch should not be called");
    }) as typeof fetch;
    try {
      const repository = new RemoteEntityRepository("lesson-plans", LessonPlanSchema);
      await assert.rejects(() => repository.create({ value: { title: "invalid" } as LessonPlan }));
      assert.strictEqual(called, false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("rejects malformed canonical JSON returned by a successful read", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => new Response(JSON.stringify({
      success: true,
      data: {
        ...persisted(lesson, 1),
        value: { title: "not a canonical lesson" },
      },
    }), { status: 200, headers: { "Content-Type": "application/json" } })) as typeof fetch;
    try {
      const repository = new RemoteEntityRepository("lesson-plans", LessonPlanSchema);
      await assert.rejects(() => repository.get(lesson.id!));
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("lesson autosave conflict recovery", () => {
  class ConflictAdapter implements ILessonStorageAdapter {
    private remote = persisted({ ...lesson, title: "Saved in another tab" }, 2);
    private conflicted = false;

    async getLesson() { return this.remote.value; }
    async listLessons() { return [this.remote.value]; }
    async createLesson(value: LessonPlan) { return value; }
    async duplicateLesson() { return null; }
    async deleteLesson() {}

    async saveLesson(value: LessonPlan, options: LessonSaveOptions = {}) {
      if (!this.conflicted && options.expectedRevision !== this.remote.revision) {
        this.conflicted = true;
        throw new PersistenceConflictError("A newer lesson is saved.", this.remote);
      }
      const next = LessonPlanSchema.parse({
        ...value,
        updatedAt: "2026-08-09T00:10:00.000Z",
      });
      this.remote = persisted(next, this.remote.revision + 1);
      return next;
    }
  }

  it("surfaces a conflict and only overwrites after an explicit recovery action", async () => {
    const adapter = new ConflictAdapter();
    const store = useLessonStore.getState();
    store.setStorageAdapter(adapter);
    store.setActiveLesson(lesson);
    store.updateActiveLesson((value) => ({ ...value, title: "My open changes" }));

    const firstSave = await useLessonStore.getState().saveActiveLesson();
    assert.strictEqual(firstSave, false);
    assert.strictEqual(useLessonStore.getState().autosaveStatus, "conflict");
    assert.strictEqual(useLessonStore.getState().activeLesson?.title, "My open changes");
    assert.strictEqual(useLessonStore.getState().conflictRemote?.title, "Saved in another tab");

    useLessonStore.getState().updateActiveLesson((value) => ({ ...value, title: "My reviewed changes" }));
    assert.strictEqual(useLessonStore.getState().autosaveStatus, "conflict");

    const recovered = await useLessonStore.getState().overwriteRemoteVersion();
    assert.strictEqual(recovered, true);
    assert.strictEqual(useLessonStore.getState().autosaveStatus, "saved");
    assert.strictEqual(useLessonStore.getState().activeLesson?.title, "My reviewed changes");
  });
});
