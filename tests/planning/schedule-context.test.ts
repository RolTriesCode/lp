import assert from "node:assert";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import { isClassroomContextRelevant } from "../../lib/ai/rewrite-section";
import { addDays, calendarRange, fromDateKey, startOfWeek, toDateKey } from "../../lib/schedule/date";
import {
  ClassroomContextApplicationSchema,
  buildBoundedClassroomContext,
} from "../../schemas/classroom-context";
import { ScheduleEntryInputSchema } from "../../schemas/schedule";

const root = process.cwd();

describe("schedule planning", () => {
  it("validates bounded, type-compatible entries", () => {
    const entry = ScheduleEntryInputSchema.parse({
      title: "Introduce linear equations",
      kind: "lesson",
      startsAt: "2026-08-10T00:00:00.000Z",
      endsAt: "2026-08-10T01:00:00.000Z",
      lessonPlanId: "30000000-0000-4000-8000-000000000003",
    });
    assert.strictEqual(entry.status, "planned");
    assert.throws(() => ScheduleEntryInputSchema.parse({ ...entry, endsAt: entry.startsAt }));
    assert.throws(() => ScheduleEntryInputSchema.parse({ ...entry, kind: "assessment" }));
    assert.throws(() => ScheduleEntryInputSchema.parse({ ...entry, endsAt: "2026-08-12T01:00:00.000Z" }));
  });

  it("uses stable Monday-first week and six-week month ranges", () => {
    const sunday = fromDateKey("2026-08-09")!;
    assert.strictEqual(toDateKey(startOfWeek(sunday)), "2026-08-03");
    const week = calendarRange(sunday, "week");
    const month = calendarRange(sunday, "month");
    assert.strictEqual(toDateKey(addDays(week.start, 7)), toDateKey(week.end));
    assert.strictEqual(toDateKey(addDays(month.start, 42)), toDateKey(month.end));
    assert.strictEqual(fromDateKey("2026-02-30"), null);
  });

  it("creates ownership-scoped planning tables and revision boundaries", async () => {
    const sql = await readFile(`${root}/supabase/migrations/20260809030000_planning_context.sql`, "utf8");
    for (const table of ["schedule_entries", "classroom_contexts"]) {
      assert.match(sql, new RegExp(`create table public\\.${table}`));
      assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`));
      assert.match(sql, new RegExp(`alter table public\\.${table} force row level security`));
      for (const operation of ["select", "insert", "update", "delete"]) {
        assert.match(sql, new RegExp(`create policy "${table}_${operation}_own"[\\s\\S]*?to authenticated`));
      }
    }
    assert.match(sql, /foreign key \(lesson_plan_id, user_id\)/);
    assert.match(sql, /foreign key \(assessment_id, user_id\)/);
    assert.match(sql, /private\.bump_revision_and_updated_at\(\)/);
    assert.doesNotMatch(sql, /to\s+anon\b/i);
  });
});

describe("safe classroom context", () => {
  const context = ClassroomContextApplicationSchema.parse({
    classSize: "large",
    language: "bilingual",
    availableResources: ["chalkboard", "printables"],
    learnerNeeds: ["reading_scaffolds", "visual_supports"],
    preferredDuration: "50 mins",
    teacherNotes: "Use stable groups and clear group roles.",
  });

  it("rejects identifying or sensitive free-form guidance", () => {
    assert.throws(() => ClassroomContextApplicationSchema.parse({ ...context, teacherNotes: "Student named Ana has ADHD." }));
    assert.throws(() => ClassroomContextApplicationSchema.parse({ ...context, teacherNotes: "Call 09171234567 after class." }));
    assert.doesNotThrow(() => ClassroomContextApplicationSchema.parse(context));
  });

  it("serializes only bounded canonical fields", () => {
    const serialized = buildBoundedClassroomContext(context);
    const parsed = JSON.parse(serialized);
    assert.deepStrictEqual(Object.keys(parsed), ["classSize", "language", "availableResources", "learnerNeeds", "preferredDuration", "teacherNotes"]);
    assert.ok(serialized.length < 1_000);
  });

  it("sends context only to relevant teacher-selected AI actions", () => {
    assert.strictEqual(isClassroomContextRelevant("procedures", "add_activity"), true);
    assert.strictEqual(isClassroomContextRelevant("assessment", "create_assessment"), true);
    assert.strictEqual(isClassroomContextRelevant("objectives", "simplify"), true);
    assert.strictEqual(isClassroomContextRelevant("reflection", "regenerate"), false);
    assert.strictEqual(isClassroomContextRelevant("procedures", "formalize"), false);
  });
});
