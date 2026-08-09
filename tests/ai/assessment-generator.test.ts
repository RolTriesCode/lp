import { describe, it } from "node:test";
import assert from "node:assert";
import { useAssessmentStore } from "../../stores/assessment-store";
import type { Assessment } from "../../schemas/assessment";

describe("Assessment Generator Store Operations (`stores/assessment-store.ts`)", () => {
  const initialAssessment: Assessment = {
    schemaVersion: "1.0",
    lessonId: "assess-test-id-01",
    title: "Initial Assessment Check",
    instructions: "Answer all items.",
    difficulty: "average",
    items: [
      {
        id: "item-1",
        type: "multiple_choice",
        question: "Question 1?",
        choices: ["A", "B", "C", "D"],
        answer: "A",
        points: 1,
      },
      {
        id: "item-2",
        type: "true_or_false",
        question: "Question 2?",
        choices: ["True", "False"],
        answer: "True",
        points: 1,
      },
    ],
  };

  it("should support loading, updating, adding, reordering, and removing questions inside the store", () => {
    const store = useAssessmentStore.getState();

    // 1. Load assessment
    store.setCurrentEditItemId("item-1");
    // Explicitly set store state directly to mock loading without router dependency
    useAssessmentStore.setState({ activeAssessment: initialAssessment });

    let state = useAssessmentStore.getState();
    assert.strictEqual(state.activeAssessment?.items.length, 2);
    assert.strictEqual(state.currentEditItemId, "item-1");

    // 2. Update Question
    store.updateItem("item-1", { question: "Updated Question 1 Text?" });
    state = useAssessmentStore.getState();
    assert.strictEqual(state.activeAssessment?.items[0].question, "Updated Question 1 Text?");
    assert.strictEqual(state.isDirty, true);

    // 3. Add Question
    store.addItem("identification");
    state = useAssessmentStore.getState();
    assert.strictEqual(state.activeAssessment?.items.length, 3);
    assert.strictEqual(state.activeAssessment?.items[2].type, "identification");

    // 4. Reorder Questions
    store.reorderItems(0, 1); // Move first item to second slot
    state = useAssessmentStore.getState();
    assert.strictEqual(state.activeAssessment?.items[1].question, "Updated Question 1 Text?");

    // 5. Remove Question
    store.removeItem("item-2");
    state = useAssessmentStore.getState();
    assert.strictEqual(state.activeAssessment?.items.length, 2);
  });
});
