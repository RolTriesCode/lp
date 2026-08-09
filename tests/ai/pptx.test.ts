import { describe, it } from "node:test";
import assert from "node:assert";
import { generatePptxFile } from "../../lib/documents/pptx/renderer";
import type { Presentation } from "../../schemas/presentation";

describe("PowerPoint Native Exporter (`lib/documents/pptx/renderer.ts`)", () => {
  const samplePresentation: Presentation = {
    schemaVersion: "1.0",
    lessonId: "lesson-pptx-test",
    curriculum: "MATATAG",
    title: "Mabuting Pagpapasya",
    subtitle: "Values Education Grade 7",
    theme: "classroom",
    slides: [
      {
        id: "slide-1",
        layout: "title",
        title: "Pagtukoy ng Mabuting Pagpapasya",
        subtitle: "Unang Bahagi",
        speakerNotes: "Opening slide with Tagalog text.",
      },
      {
        id: "slide-2",
        layout: "bullets",
        title: "Mga Layunin",
        bullets: ["Magkaroon ng malinaw na pag-iisip", "Magsagawa ng tamang hakbang"],
        speakerNotes: "Layunin list.",
      },
    ],
  };

  it("should render a valid PPTX slide deck as a binary buffer stream", async () => {
    const buffer = await generatePptxFile(samplePresentation);
    assert.ok(buffer instanceof Buffer);
    assert.ok(buffer.length > 5000, `Expected zip/pptx archive to be larger than 5KB, got ${buffer.length} bytes`);
  });
});
