import { describe, it } from "node:test";
import assert from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getSidebarSections } from "../../components/dashboard/dashboard-sidebar";
import { TeacherPreferencesSchema } from "../../schemas/profile";

const intendedDestinations = new Map([
  ["Dashboard", "/dashboard"],
  ["New Lesson Plan", "/lesson/create"],
  ["Presentation Maker", "/presentations"],
  ["Assessment Builder", "/assessments"],
  ["Worksheet Generator", "/worksheets"],
  ["Rubric Builder", "/rubrics"],
  ["My Lesson Plans", "/lesson"],
  ["Templates", "/templates"],
  ["Curriculum", "/curriculum"],
  ["Resources", "/resources"],
  ["Calendar", "/calendar"],
  ["School & Profile", "/settings/profile"],
  ["Classroom Context", "/settings/classroom-context"],
  ["Preferences", "/settings/preferences"],
  ["Help Center", "/help"],
]);

describe("Authenticated application shell navigation", () => {
  it("gives every intended sidebar item a real route and correct active state", () => {
    const sections = getSidebarSections("/assessments");
    const items = sections.flatMap((section) => section.items);

    assert.strictEqual(items.every((item) => typeof item.href === "string" && item.href.startsWith("/")), true);
    intendedDestinations.forEach((href, label) => {
      assert.strictEqual(items.find((item) => item.label === label)?.href, href);
    });
    assert.strictEqual(items.find((item) => item.label === "Assessment Builder")?.active, true);
    assert.strictEqual(items.filter((item) => item.active).length, 1);
  });

  it("ships a page module for every intended deep link and shared terminal state", () => {
    const routes = [
      "dashboard",
      "lesson",
      "lesson/create",
      "presentations",
      "assessments",
      "worksheets",
      "rubrics",
      "templates",
      "curriculum",
      "resources",
      "calendar",
      "settings/profile",
      "settings/preferences",
      "settings/classroom-context",
      "help",
      "search",
    ];

    routes.forEach((route) => assert.strictEqual(existsSync(resolve(`app/${route}/page.tsx`)), true, `Missing /${route}`));
    assert.strictEqual(existsSync(resolve("app/not-found.tsx")), true);
    assert.strictEqual(existsSync(resolve("app/error.tsx")), true);
  });

  it("connects header search, quick actions, and dashboard assistant shortcuts", () => {
    const header = readFileSync(resolve("components/dashboard/dashboard-header.tsx"), "utf8");
    const quickActions = readFileSync(resolve("components/dashboard/quick-actions.tsx"), "utf8");
    const dashboard = readFileSync(resolve("components/dashboard/dashboard-shell.tsx"), "utf8");

    assert.match(header, /action="\/search"/);
    assert.match(header, /href: "\/settings\/preferences"/);
    ["/presentations", "/assessments", "/worksheets"].forEach((href) => assert.match(quickActions, new RegExp(href)));
    assert.match(dashboard, /\/lesson\?section=objectives/);
    assert.match(dashboard, /\/help\?category=lesson-workflow/);
  });

  it("validates bounded preferences used by new-lesson defaults", () => {
    const valid = TeacherPreferencesSchema.parse({
      defaultCurriculum: "ILAW",
      defaultLessonType: "semi-detailed",
      defaultDuration: "50 mins",
      defaultLanguage: "filipino",
    });
    assert.strictEqual(valid.defaultCurriculum, "ILAW");
    assert.strictEqual(TeacherPreferencesSchema.safeParse({ ...valid, defaultLanguage: "auto-detect" }).success, false);
    assert.strictEqual(TeacherPreferencesSchema.safeParse({ ...valid, defaultDuration: "all day" }).success, false);
  });
});
