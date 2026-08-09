import assert from "node:assert";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import { callbackUrl, safeCallbackNext, safeNextPath } from "../../lib/auth/redirects";
import { parseApplicationUrl } from "../../lib/supabase/env";
import { detectSchoolLogoMime } from "../../lib/profile/logo";
import { TeacherProfileInputSchema } from "../../schemas/profile";

const root = process.cwd();
const profileMigration = `${root}/supabase/migrations/20260809020000_auth_profiles.sql`;

describe("authentication redirects and environment", () => {
  it("preserves known in-app destinations and rejects open redirects", () => {
    assert.strictEqual(safeNextPath("/lesson/abc?tab=assessment#items"), "/lesson/abc?tab=assessment#items");
    assert.strictEqual(safeNextPath("/presentations?q=ecosystems"), "/presentations?q=ecosystems");
    assert.strictEqual(safeNextPath("/calendar?view=month&date=2026-08-09"), "/calendar?view=month&date=2026-08-09");
    assert.strictEqual(safeNextPath("/settings/preferences"), "/settings/preferences");
    assert.strictEqual(safeNextPath("/help?category=resources"), "/help?category=resources");
    assert.strictEqual(safeNextPath("https://attacker.example/lesson"), "/dashboard");
    assert.strictEqual(safeNextPath("//attacker.example"), "/dashboard");
    assert.strictEqual(safeNextPath("/%2F%2Fattacker.example"), "/dashboard");
    assert.strictEqual(safeNextPath("/auth/callback?next=//attacker.example"), "/dashboard");
    assert.strictEqual(safeCallbackNext("/auth/reset-password"), "/auth/reset-password");
    assert.strictEqual(safeCallbackNext("//attacker.example"), "/dashboard");
  });

  it("builds an allow-list-compatible callback without accepting an external next URL", () => {
    const result = new URL(callbackUrl("https://aralai.example", "https://attacker.example"));
    assert.strictEqual(result.origin, "https://aralai.example");
    assert.strictEqual(result.pathname, "/auth/callback");
    assert.strictEqual(result.searchParams.get("next"), "/dashboard");
  });

  it("accepts HTTPS and local app URLs but rejects remote HTTP", () => {
    assert.strictEqual(parseApplicationUrl("https://aralai.example/path"), "https://aralai.example");
    assert.strictEqual(parseApplicationUrl("http://localhost:3000"), "http://localhost:3000");
    assert.throws(() => parseApplicationUrl("http://aralai.example"), /must use HTTPS/);
  });
});

describe("owned teacher profiles", () => {
  it("validates bounded teacher profile fields without treating the role as authorization", () => {
    const profile = TeacherProfileInputSchema.parse({
      displayName: "Ma. Victoria Ocampo",
      schoolName: "Bagong Pag-asa Integrated School",
      roleTitle: "Master Teacher",
      preferredGradeLevel: "Grade 7",
      preferredSubjects: ["Science", "Mathematics"],
    });
    assert.strictEqual(profile.roleTitle, "Master Teacher");
    assert.throws(() => TeacherProfileInputSchema.parse({ ...profile, preferredSubjects: Array(13).fill("Science") }));
  });

  it("sniffs logo bytes instead of trusting a filename or browser MIME alone", () => {
    assert.strictEqual(detectSchoolLogoMime(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), "image/png");
    assert.strictEqual(detectSchoolLogoMime(Uint8Array.from([0xff, 0xd8, 0xff, 0x00])), "image/jpeg");
    assert.strictEqual(detectSchoolLogoMime(new TextEncoder().encode("not an image")), null);
  });

  it("creates profiles from auth users and retains own-row and own-object boundaries", async () => {
    const [migration, repository, logoRoute] = await Promise.all([
      readFile(profileMigration, "utf8"),
      readFile(`${root}/lib/profile/repository.ts`, "utf8"),
      readFile(`${root}/app/api/profile/logo/route.ts`, "utf8"),
    ]);
    assert.match(migration, /after insert on auth\.users/);
    assert.match(migration, /security definer/);
    assert.match(migration, /school_logo_path like id::text \|\| '\/%'/);
    assert.match(migration, /never used for authorization/);
    assert.match(repository, /\.eq\("id", auth\.userId\)/);
    assert.doesNotMatch(repository, /formData|get\("userId"\)|user_id:\s*input/i);
    assert.match(logoRoute, /const path = `\$\{auth\.userId\}\/\$\{crypto\.randomUUID\(\)\}/);
    assert.match(logoRoute, /detectSchoolLogoMime/);
  });
});

describe("route and row protection", () => {
  it("refreshes with getClaims and treats API requests as unauthorized JSON", async () => {
    const [proxy, authActions] = await Promise.all([
      readFile(`${root}/lib/supabase/proxy.ts`, "utf8"),
      readFile(`${root}/app/auth/actions.ts`, "utf8"),
    ]);
    assert.match(proxy, /auth\.getClaims\(\)/);
    assert.doesNotMatch(proxy, /auth\.getSession\(\)/);
    assert.match(proxy, /pathname\.startsWith\("\/api\/"\)/);
    assert.match(authActions, /safeNextPath/);
    assert.doesNotMatch(authActions, /formData\.get\("userId"\)/);
  });

  it("keeps every application-table RLS operation authenticated and ownership-scoped", async () => {
    const sql = await readFile(`${root}/supabase/migrations/20260809000000_supabase_foundation.sql`, "utf8");
    const tables = ["profiles", "lesson_plans", "presentations", "assessments", "worksheets", "templates", "uploaded_resources"];
    for (const table of tables) {
      for (const operation of ["select", "insert", "update", "delete"]) {
        const match = sql.match(new RegExp(`create policy "${table}_${operation}_own"([\\s\\S]*?);`));
        assert.ok(match, `${table} ${operation} policy must exist`);
        assert.match(match[1], /to authenticated/);
        assert.match(match[1], /\(select auth\.uid\(\)\) is not null/);
        assert.match(match[1], new RegExp(`= ${table === "profiles" ? "id" : "user_id"}`));
      }
    }
    assert.doesNotMatch(sql, /to\s+anon\b/i);
  });
});
