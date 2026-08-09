import { describe, it } from "node:test";
import assert from "node:assert";
import { useWorksheetStore } from "../../stores/worksheet-store";
import type { Worksheet } from "../../schemas/worksheet";

describe("Worksheet Generator Store Operations (`stores/worksheet-store.ts`)", () => {
  const initialWorksheet: Worksheet = {
    schemaVersion: "1.0",
    lessonId: "worksheet-test-id-01",
    title: "Initial Worksheet Exercises",
    instructions: "Complete all questions.",
    difficulty: "average",
    items: [
      {
        id: "ws-1",
        question: "Question 1?",
        points: 5,
        hint: "Hint 1",
        answer: "Answer 1",
      },
      {
        id: "ws-2",
        question: "Question 2?",
        points: 5,
        hint: "Hint 2",
        answer: "Answer 2",
      },
    ],
  };

  it("should support loading, updating, adding, reordering, and removing questions inside the store", () => {
    const store = useWorksheetStore.getState();

    // 1. Load worksheet
    store.setCurrentEditItemId("ws-1");
    // Explicitly set store state directly to mock loading without router dependency
    useWorksheetStore.setState({ activeWorksheet: initialWorksheet });

    let state = useWorksheetStore.getState();
    assert.strictEqual(state.activeWorksheet?.items.length, 2);
    assert.strictEqual(state.currentEditItemId, "ws-1");

    // 2. Update Question
    store.updateItem("ws-1", { question: "Updated Question 1 Text?" });
    state = useWorksheetStore.getState();
    assert.strictEqual(state.activeWorksheet?.items[0].question, "Updated Question 1 Text?");
    assert.strictEqual(state.isDirty, true);

    // 3. Add Question
    store.addItem();
    state = useWorksheetStore.getState();
    assert.strictEqual(state.activeWorksheet?.items.length, 3);

    // 4. Reorder Questions
    store.reorderItems(0, 1); // Move first item to second slot
    state = useWorksheetStore.getState();
    assert.strictEqual(state.activeWorksheet?.items[1].question, "Updated Question 1 Text?");

    // 5. Remove Question
    store.removeItem("ws-2");
    state = useWorksheetStore.getState();
    assert.strictEqual(state.activeWorksheet?.items.length, 2);
  });
});
