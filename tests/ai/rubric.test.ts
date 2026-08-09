import { describe, it } from "node:test";
import assert from "node:assert";
import { useRubricStore } from "../../stores/rubric-store";
import type { Rubric } from "../../schemas/rubric";

describe("Rubric Generator Store Operations (`stores/rubric-store.ts`)", () => {
  const initialRubric: Rubric = {
    schemaVersion: "1.0",
    lessonId: "rubric-test-id-01",
    title: "Initial Rubric Evaluation",
    instructions: "Apply descriptors.",
    levels: ["Excellent", "Basic"],
    criteria: [
      {
        id: "crit-1",
        name: "Criterion 1",
        weight: 5,
        descriptors: {
          Excellent: "Ex 1",
          Basic: "Ba 1",
        },
      },
    ],
  };

  it("should support loading, updating, adding, and removing criteria inside the store", () => {
    const store = useRubricStore.getState();

    // 1. Load rubric
    store.setCurrentEditCriterionId("crit-1");
    // Explicitly set store state directly to mock loading without router dependency
    useRubricStore.setState({ activeRubric: initialRubric });

    let state = useRubricStore.getState();
    assert.strictEqual(state.activeRubric?.criteria.length, 1);
    assert.strictEqual(state.currentEditCriterionId, "crit-1");

    // 2. Update Criterion
    store.updateCriterion("crit-1", { name: "Updated Criterion 1 Name" });
    state = useRubricStore.getState();
    assert.strictEqual(state.activeRubric?.criteria[0].name, "Updated Criterion 1 Name");
    assert.strictEqual(state.isDirty, true);

    // 3. Add Criterion
    store.addCriterion();
    state = useRubricStore.getState();
    assert.strictEqual(state.activeRubric?.criteria.length, 2);

    // 4. Remove Criterion
    store.removeCriterion("crit-1");
    state = useRubricStore.getState();
    assert.strictEqual(state.activeRubric?.criteria.length, 1);
  });
});
