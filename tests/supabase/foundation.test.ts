import assert from "node:assert";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import { parseSupabasePublicEnv } from "../../lib/supabase/env";
import {
  lessonPlanFromRow,
  lessonPlanToInsert,
} from "../../lib/supabase/mappers";
import type { Tables } from "../../lib/supabase/database.types";
import { LessonPlanSchema } from "../../schemas/lesson";

const projectRoot = process.cwd();
const migrationPath = `${projectRoot}/supabase/migrations/20260809000000_supabase_foundation.sql`;

describe("Supabase foundation migration", () => {
  it("creates every required table with versioned JSONB content", async () => {
    const sql = await readFile(migrationPath, "utf8");
    const tables = [
      "profiles",
      "lesson_plans",
      "presentations",
      "assessments",
      "worksheets",
      "templates",
      "uploaded_resources",
    ];

    tables.forEach((table) => {
      assert.match(sql, new RegExp(`create table public\\.${table} \\(`));
      assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security;`));
      assert.match(sql, new RegExp(`alter table public\\.${table} force row level security;`));
    });

    ["lesson_plans", "presentations", "assessments", "worksheets", "templates", "uploaded_resources"]
      .forEach((table) => {
        const tableBlock = sql.match(
          new RegExp(`create table public\\.${table} \\(([\\s\\S]*?)\\n\\);`)
        )?.[1];
        assert.ok(tableBlock, `Expected SQL block for ${table}`);
        assert.match(tableBlock, /schema_version text not null/);
        assert.match(tableBlock, /content jsonb not null/);
      });
  });

  it("defines ownership constraints, indexes, timestamps, and authenticated-only RLS", async () => {
    const sql = await readFile(migrationPath, "utf8");
    const ownedTables = [
      "profiles",
      "lesson_plans",
      "presentations",
      "assessments",
      "worksheets",
      "templates",
      "uploaded_resources",
    ];

    ownedTables.forEach((table) => {
      ["select", "insert", "update", "delete"].forEach((operation) => {
        assert.match(
          sql,
          new RegExp(`create policy "${table}_${operation}_own"[\\s\\S]*?to authenticated`)
        );
      });
      assert.match(sql, new RegExp(`create trigger ${table}_set_updated_at`));
      assert.match(sql, new RegExp(`revoke all on table public\\.${table} from anon;`));
    });

    assert.doesNotMatch(sql, /to\s+anon\b/i);
    assert.doesNotMatch(sql, /using\s*\(\s*true\s*\)/i);
    assert.match(sql, /\(select auth\.uid\(\)\) is not null/);
    assert.match(sql, /foreign key \(lesson_plan_id, user_id\)/);
    assert.match(sql, /foreign key \(source_lesson_id, user_id\)/);
    assert.match(sql, /create index lesson_plans_search_metadata_idx/);
    assert.match(sql, /create index uploaded_resources_user_extraction_idx/);
  });

  it("does not expose a privileged key through either Supabase client", async () => {
    const [browserSource, serverSource] = await Promise.all([
      readFile(`${projectRoot}/lib/supabase/client.ts`, "utf8"),
      readFile(`${projectRoot}/lib/supabase/server.ts`, "utf8"),
    ]);
    const clientSource = `${browserSource}\n${serverSource}`;

    assert.match(clientSource, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY|publishableKey/);
    assert.doesNotMatch(clientSource, /service.role|secret.key/i);
    assert.match(serverSource, /const cookieStore = await cookies\(\)/);
    assert.match(serverSource, /getAll\(\)/);
    assert.match(serverSource, /setAll\(cookiesToSet, headers\)/);
  });
});

describe("Supabase environment and canonical mapping", () => {
  it("accepts secure remote and local URLs but rejects unsafe or missing configuration", () => {
    const remote = parseSupabasePublicEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://example-project.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_1234567890",
    });
    const local = parseSupabasePublicEnv({
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "local_publishable_1234567890",
    });

    assert.strictEqual(remote.url, "https://example-project.supabase.co");
    assert.strictEqual(local.url, "http://127.0.0.1:54321");
    assert.throws(
      () =>
        parseSupabasePublicEnv({
          NEXT_PUBLIC_SUPABASE_URL: "http://example.com",
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_1234567890",
        }),
      /must use HTTPS/
    );
    assert.throws(() => parseSupabasePublicEnv({}), /environment configuration is invalid/);
  });

  it("maps the canonical lesson schema to typed metadata plus versioned JSONB", () => {
    const lesson = LessonPlanSchema.parse({
      curriculum: "MATATAG",
      lessonType: "DETAILED",
      title: "Photosynthesis through evidence",
      gradeLevel: "Grade 7",
      subject: "Science",
      quarter: "Q1",
      week: "Week 1",
      duration: "60 mins",
      standards: {},
      objectives: ["Explain how light supports food production in plants."],
      subjectMatter: {
        topic: "Photosynthesis in Plants",
        references: [],
        materials: ["Leaf samples"],
        valuesIntegration: ["Care for living things"],
      },
      procedures: [
        {
          id: "procedure-1",
          title: "Observe and explain",
          content: "Compare two leaf samples and record evidence.",
        },
      ],
      assessment: [],
      assignment: "",
      reflection: "",
    });

    const insert = lessonPlanToInsert("00000000-0000-0000-0000-000000000001", lesson, "ready");
    assert.strictEqual(insert.curriculum, "MATATAG");
    assert.strictEqual(insert.topic, "Photosynthesis in Plants");
    assert.strictEqual(insert.schema_version, "1.0");
    assert.strictEqual(insert.status, "ready");
    assert.strictEqual(typeof insert.content, "object");

    const row: Tables<"lesson_plans"> = {
      id: "00000000-0000-0000-0000-000000000100",
      user_id: insert.user_id,
      title: insert.title,
      curriculum: insert.curriculum,
      lesson_type: insert.lesson_type,
      prototype_source_id: null,
      grade_level: insert.grade_level,
      subject: insert.subject,
      quarter: insert.quarter,
      topic: insert.topic,
      status: insert.status ?? "draft",
      revision: 1,
      schema_version: insert.schema_version ?? "1.0",
      content: insert.content ?? {},
      created_at: "2026-08-09T00:00:00.000Z",
      updated_at: "2026-08-09T00:00:00.000Z",
    };
    const restored = lessonPlanFromRow(row);
    assert.strictEqual(restored.id, row.id);
    assert.strictEqual(restored.title, lesson.title);
    assert.strictEqual(restored.schemaVersion, "1.0");
  });
});
