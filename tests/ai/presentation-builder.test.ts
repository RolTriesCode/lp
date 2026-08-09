import { describe, it } from "node:test";
import assert from "node:assert";
import { usePresentationStore } from "../../stores/presentation-store";
import type { Presentation } from "../../schemas/presentation";

describe("Presentation Slide Builder Store Operations (`stores/presentation-store.ts`)", () => {
  const initialPresentation: Presentation = {
    schemaVersion: "1.0",
    lessonId: "present-test-id-01",
    curriculum: "ILAW",
    title: "Initial Presentation Title",
    theme: "classroom",
    slides: [
      {
        id: "slide-1",
        layout: "title",
        title: "Introduction Slide",
        speakerNotes: "Welcome note.",
      },
      {
        id: "slide-2",
        layout: "bullets",
        title: "Second Slide",
        bullets: ["Point A", "Point B"],
        speakerNotes: "Bullet note.",
      },
    ],
  };

  it("should support loading, updating, adding, reordering, and removing slides inside the store", () => {
    const store = usePresentationStore.getState();

    // 1. Load presentation
    store.setCurrentSlideIndex(0);
    // Explicitly set store state directly to mock loading without router dependency
    usePresentationStore.setState({ activePresentation: initialPresentation });

    let state = usePresentationStore.getState();
    assert.strictEqual(state.activePresentation?.slides.length, 2);
    assert.strictEqual(state.currentSlideIndex, 0);

    // 2. Update Slide
    store.updateSlide(0, { title: "Updated Introduction Slide Title" });
    state = usePresentationStore.getState();
    assert.strictEqual(state.activePresentation?.slides[0].title, "Updated Introduction Slide Title");
    assert.strictEqual(state.isDirty, true);

    // 3. Add Slide
    store.addSlide(0); // Insert at index 1
    state = usePresentationStore.getState();
    assert.strictEqual(state.activePresentation?.slides.length, 3);
    assert.strictEqual(state.currentSlideIndex, 1);
    assert.strictEqual(state.activePresentation?.slides[1].title, "New Slide Title");

    // 4. Reorder Slides
    store.reorderSlides(1, 2); // Move "New Slide Title" to the end
    state = usePresentationStore.getState();
    assert.strictEqual(state.activePresentation?.slides[2].title, "New Slide Title");
    assert.strictEqual(state.currentSlideIndex, 2);

    // 5. Remove Slide
    store.removeSlide(2);
    state = usePresentationStore.getState();
    assert.strictEqual(state.activePresentation?.slides.length, 2);
    assert.strictEqual(state.activePresentation?.slides[1].title, "Second Slide");
  });
});
