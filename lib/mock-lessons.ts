export type LessonPlanStatus = "Edited" | "Completed" | "Draft";
export type LessonPlanTone = "violet" | "green" | "orange" | "blue" | "purple";

export type MockLessonPlan = {
  id: string;
  title: string;
  lessonType: string;
  grade: string;
  subject: string;
  curriculum: "MATATAG" | "ILAW";
  updatedDate: string;
  updatedTime: string;
  status: LessonPlanStatus;
  tone: LessonPlanTone;
};

export const mockLessonPlans: MockLessonPlan[] = [
  {
    id: "photosynthesis-in-plants",
    title: "Photosynthesis in Plants",
    lessonType: "Detailed Lesson Plan",
    grade: "Grade 7",
    subject: "Science",
    curriculum: "MATATAG",
    updatedDate: "May 20, 2024",
    updatedTime: "2:30 PM",
    status: "Edited",
    tone: "violet",
  },
  {
    id: "types-of-metrical-feet",
    title: "Types of Metrical Feet",
    lessonType: "Semi-Detailed Lesson Plan",
    grade: "Grade 7",
    subject: "English",
    curriculum: "ILAW",
    updatedDate: "May 19, 2024",
    updatedTime: "9:15 AM",
    status: "Completed",
    tone: "green",
  },
  {
    id: "solving-linear-equations",
    title: "Solving Linear Equations",
    lessonType: "Detailed Lesson Plan",
    grade: "Grade 8",
    subject: "Math",
    curriculum: "MATATAG",
    updatedDate: "May 18, 2024",
    updatedTime: "4:45 PM",
    status: "Edited",
    tone: "orange",
  },
  {
    id: "forms-of-energy",
    title: "Forms of Energy",
    lessonType: "Detailed Lesson Plan",
    grade: "Grade 7",
    subject: "Science",
    curriculum: "MATATAG",
    updatedDate: "May 17, 2024",
    updatedTime: "1:20 PM",
    status: "Completed",
    tone: "blue",
  },
  {
    id: "subject-verb-agreement",
    title: "Subject–Verb Agreement",
    lessonType: "Semi-Detailed Lesson Plan",
    grade: "Grade 7",
    subject: "English",
    curriculum: "ILAW",
    updatedDate: "May 16, 2024",
    updatedTime: "10:05 AM",
    status: "Draft",
    tone: "purple",
  },
];
