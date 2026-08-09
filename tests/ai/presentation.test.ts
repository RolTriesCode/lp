import { describe, it } from "node:test";
import assert from "node:assert";
import { safeParsePresentation, type Presentation } from "../../schemas/presentation";

describe("Presentation Schema & Slide Validation (`schemas/presentation.ts`)", () => {
  const validPresentation: Presentation = {
    schemaVersion: "1.0",
    lessonId: "lesson-99",
    curriculum: "MATATAG",
    title: "Lesson Slides Title",
    subtitle: "Quarter 1 Overview",
    theme: "classroom",
    slides: [
      {
        id: "slide-1",
        layout: "title",
        title: "Introduction to Plant Life",
        speakerNotes: "Greet students and show plant chart.",
      },
      {
        id: "slide-2",
        layout: "bullets",
        title: "Key Characteristics",
        bullets: ["Photosynthesis", "Root absorption", "Transpiration"],
        speakerNotes: "Discuss each point slowly.",
      },
    ],
  };

  it("should successfully parse a valid slide presentation structure", () => {
    const res = safeParsePresentation(validPresentation);
    assert.strictEqual(res.success, true);
    if (res.success) {
      assert.strictEqual(res.data.theme, "classroom");
      assert.strictEqual(res.data.slides.length, 2);
    }
  });

  it("should fail validation when a slide exceeds 5 bullets constraint", () => {
    const invalid = {
      ...validPresentation,
      slides: [
        {
          id: "slide-bad",
          layout: "bullets",
          title: "Too Many Bullets",
          bullets: ["1", "2", "3", "4", "5", "6"],
        },
      ],
    };
    const res = safeParsePresentation(invalid);
    assert.strictEqual(res.success, false);
  });

  it("should fail validation when required title field is missing", () => {
    const invalid = {
      ...validPresentation,
      title: "",
    };
    const res = safeParsePresentation(invalid);
    assert.strictEqual(res.success, false);
  });
});
