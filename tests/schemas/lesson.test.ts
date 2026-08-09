import { describe, it } from "node:test";
import assert from "node:assert";
import {
  LessonPlanSchema,
  normalizeLessonPlan,
  parseLessonPlan,
  safeParseLessonPlan,
  type LessonPlan,
} from "../../schemas/lesson";

/**
 * Fixture A: Representative Valid MATATAG Detailed Lesson Plan
 */
export const validMatatagDetailedFixture: LessonPlan = {
  schemaVersion: "1.0",
  id: "lesson-matatag-science-7-001",
  curriculum: "MATATAG",
  lessonType: "DETAILED",
  title: "Photosynthesis in Plants & Energy Transformation",
  gradeLevel: "Grade 7",
  subject: "Science",
  quarter: "Q1",
  week: "Week 3",
  duration: "60 mins",
  standards: {
    contentStandard:
      "Learners demonstrate understanding of how plants convert light energy into chemical energy during photosynthesis.",
    performanceStandard:
      "Learners design an investigation to show the factors affecting the rate of photosynthesis.",
    learningCompetency:
      "Differentiate the light-dependent and light-independent reactions of photosynthesis.",
    competencyCode: "S7LT-IIg-7",
  },
  objectives: [
    "Identify the primary raw materials and products of photosynthesis.",
    "Describe the function of chlorophyll and chloroplasts in plant cells.",
    "Demonstrate care for local flora through a group leaf observation activity.",
  ],
  subjectMatter: {
    topic: "Photosynthesis in Plants",
    references: [
      "DepEd Science 7 MATATAG Curriculum Guide (2024)",
      "General Science for High School, pp. 112-125",
    ],
    materials: [
      "Fresh plant leaf samples",
      "Diagram of Chloroplast Structure",
      "Slide presentation / Projector",
    ],
    valuesIntegration: [
      "Environmental stewardship and appreciation for plant life in local communities.",
    ],
  },
  procedures: [
    {
      id: "proc-1",
      title: "A. Preliminary Activities & Prayer",
      teacherActivity:
        "Good morning, class! Let us begin our session with a short prayer led by Maria.",
      studentActivity:
        "(Maria leads the prayer. The class greets the teacher.) Good morning, Teacher!",
      content: "Opening routine, attendance checking, and classroom setup.",
    },
    {
      id: "proc-2",
      title: "B. Motivation & Priming",
      teacherActivity:
        "Teacher displays two potted plants—one grown in full sunlight and one kept in a dark room. 'What differences do you observe between these two plants?'",
      studentActivity:
        "Student A: 'The plant in the sunlight is green and healthy, while the shaded plant is yellowish and weak!'",
      content: "Priming discussion linking sunlight to plant growth.",
    },
    {
      id: "proc-3",
      title: "C. Lesson Proper & Discussion",
      teacherActivity:
        "Teacher presents the photosynthesis chemical equation (6CO2 + 6H2O + light → C6H12O6 + 6O2) and breaks down inputs and outputs.",
      studentActivity:
        "Students copy the chemical equation into their notebooks and identify carbon dioxide, water, glucose, and oxygen.",
      content: "Detailed breakdown of light-dependent vs light-independent reactions.",
    },
    {
      id: "proc-4",
      title: "D. Guided Practice & Group Work",
      teacherActivity:
        "Teacher divides class into 4 groups and distributes leaf diagram activity sheets. 'Label the chloroplast structures and trace gas exchange.'",
      studentActivity:
        "Learners collaborate in small groups to label stoma, thylakoids, and stroma on the activity sheets.",
      content: "Group diagram labeling activity.",
    },
  ],
  assessment: [
    {
      id: "eval-1",
      type: "multiple_choice",
      question: "Which cell organelle is the primary site of photosynthesis in green plants?",
      choices: ["Mitochondria", "Chloroplast", "Nucleus", "Ribosome"],
      answer: "Chloroplast",
      points: 1,
    },
    {
      id: "eval-2",
      type: "identification",
      question: "Name the green pigment in plants that absorbs light energy.",
      choices: [],
      answer: "Chlorophyll",
      points: 1,
    },
  ],
  assignment: "Answer questions 1-5 on page 128 of the Science 7 textbook.",
  reflection: "85% of learners achieved mastery in identifying photosynthesis inputs and outputs.",
  createdAt: "2026-08-09T10:00:00.000Z",
  updatedAt: "2026-08-09T10:00:00.000Z",
};

/**
 * Fixture B: Representative Valid ILAW Semi-Detailed Lesson Plan
 */
export const validIlawSemiDetailedFixture: LessonPlan = {
  schemaVersion: "1.0",
  id: "lesson-ilaw-english-7-002",
  curriculum: "ILAW",
  lessonType: "SEMI_DETAILED",
  title: "Types of Metrical Feet in Poetry",
  gradeLevel: "Grade 7",
  subject: "English",
  quarter: "Q2",
  week: "Week 1",
  duration: "50 mins",
  standards: {
    contentStandard: "Learners demonstrate understanding of poetic meters and metrical patterns.",
    performanceStandard: "Learners analyze and recite poems using correct rhythm and stress.",
    learningCompetency: "Identify iambic, trochaic, and anapestic feet in sample poems.",
    competencyCode: "",
  },
  objectives: [
    "Identify common types of metrical feet in poetic verses.",
    "Distinguish between stressed and unstressed syllables.",
    "Appreciate Philippine traditional poetry through rhythmic recitation.",
  ],
  subjectMatter: {
    topic: "Types of Metrical Feet",
    references: ["ILAW English 7 Curriculum Module", "Philippine Literature & Rhythm, pp. 45-52"],
    materials: ["Sample poem chart", "Audio recording of rhythmic poem readings"],
    valuesIntegration: ["Appreciation for local oral traditions and Philippine poetic heritage."],
  },
  procedures: [
    {
      id: "proc-ilaw-1",
      title: "1. Review & Warm-Up",
      content:
        "Teacher reviews syllable stress in English words using clapping patterns. Students clap to stressed syllables.",
    },
    {
      id: "proc-ilaw-2",
      title: "2. Presentation & Discussion",
      content:
        "Teacher introduces Iambic (da-DUM), Trochaic (DUM-da), and Anapestic (da-da-DUM) metrical patterns with clear examples.",
    },
    {
      id: "proc-ilaw-3",
      title: "3. Application",
      content:
        "Students analyze a 4-line stanza from a Philippine folk poem, mark stressed/unstressed symbols (/ u), and name the metrical pattern.",
    },
  ],
  assessment: [
    {
      id: "eval-ilaw-1",
      type: "multiple_choice",
      question: "Which metrical foot consists of an unstressed syllable followed by a stressed syllable (da-DUM)?",
      choices: ["Iamb", "Trochee", "Anapest", "Dactyl"],
      answer: "Iamb",
      points: 1,
    },
  ],
  assignment: "Write a short 4-line stanza using iambic meter about your hometown.",
  reflection: "",
};

describe("Canonical Lesson Plan Schema (`schemas/lesson.ts`)", () => {
  it("should successfully parse a valid MATATAG Detailed Lesson Plan fixture", () => {
    const result = safeParseLessonPlan(validMatatagDetailedFixture);
    assert.strictEqual(result.success, true, "MATATAG Detailed fixture should parse successfully.");
    if (result.success) {
      assert.strictEqual(result.data.curriculum, "MATATAG");
      assert.strictEqual(result.data.lessonType, "DETAILED");
      assert.strictEqual(result.data.procedures.length, 4);
      assert.strictEqual(result.data.procedures[0].teacherActivity !== "", true);
      assert.strictEqual(result.data.assessment.length, 2);
    }
  });

  it("should successfully parse a valid ILAW Semi-Detailed Lesson Plan fixture", () => {
    const result = safeParseLessonPlan(validIlawSemiDetailedFixture);
    assert.strictEqual(result.success, true, "ILAW Semi-Detailed fixture should parse successfully.");
    if (result.success) {
      assert.strictEqual(result.data.curriculum, "ILAW");
      assert.strictEqual(result.data.lessonType, "SEMI_DETAILED");
      assert.strictEqual(result.data.procedures.length, 3);
      assert.strictEqual(result.data.procedures[0].content !== "", true);
    }
  });

  it("should fail validation when an invalid curriculum value is provided", () => {
    const invalidPayload = {
      ...validMatatagDetailedFixture,
      curriculum: "K_TO_12_OLD",
    };
    const result = safeParseLessonPlan(invalidPayload);
    assert.strictEqual(result.success, false, "Invalid curriculum value should fail validation.");
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes("curriculum"));
      assert.ok(issue, "Should contain an error issue for curriculum path.");
    }
  });

  it("should fail validation when procedures array is empty", () => {
    const invalidPayload = {
      ...validMatatagDetailedFixture,
      procedures: [],
    };
    const result = safeParseLessonPlan(invalidPayload);
    assert.strictEqual(result.success, false, "Empty procedures array should fail validation.");
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes("procedures"));
      assert.ok(issue, "Should report issue on procedures array.");
      assert.strictEqual(issue?.message, "At least one lesson procedure block is required.");
    }
  });

  it("should fail validation when an assessment question is missing / empty", () => {
    const invalidPayload = {
      ...validMatatagDetailedFixture,
      assessment: [
        {
          id: "eval-bad",
          type: "multiple_choice",
          question: "", // Invalid empty question
        },
      ],
    };
    const result = safeParseLessonPlan(invalidPayload);
    assert.strictEqual(result.success, false, "Empty question text should fail assessment item validation.");
    if (!result.success) {
      const issue = result.error.issues.find(
        (i) => i.path.includes("assessment") && i.path.includes("question")
      );
      assert.ok(issue, "Should report issue on assessment question.");
    }
  });

  it("should fail validation when required metadata (title, gradeLevel, subject) is missing", () => {
    const invalidPayload = {
      ...validMatatagDetailedFixture,
      title: "",
      gradeLevel: "",
      subject: "",
    };
    const result = safeParseLessonPlan(invalidPayload);
    assert.strictEqual(result.success, false, "Missing metadata fields should fail validation.");
    if (!result.success) {
      assert.strictEqual(result.error.issues.length >= 3, true);
    }
  });

  it("should normalize untrusted payloads by auto-assigning IDs to procedures and assessment items", () => {
    const rawUntrustedData = {
      curriculum: "MATATAG",
      lessonType: "DETAILED",
      title: "Photosynthesis Unit",
      gradeLevel: "Grade 7",
      subject: "Science",
      objectives: ["Understand light reactions."],
      subjectMatter: {
        topic: "Photosynthesis",
      },
      procedures: [
        {
          title: "Introduction",
          content: "Teacher presents topic.",
        },
      ],
      assessment: [
        {
          type: "multiple_choice",
          question: "Where does photosynthesis occur?",
          choices: ["Chloroplast", "Cell wall"],
          answer: "Chloroplast",
        },
      ],
    };

    const normalized = normalizeLessonPlan(rawUntrustedData);
    assert.strictEqual(normalized.schemaVersion, "1.0");
    assert.ok(normalized.procedures[0].id.startsWith("proc-"));
    assert.ok(normalized.assessment[0].id.startsWith("eval-"));
  });

  it("should strictly parse valid payloads with parseLessonPlan without throwing", () => {
    const parsed = parseLessonPlan(validMatatagDetailedFixture);
    assert.strictEqual(parsed.title, validMatatagDetailedFixture.title);
  });
});
