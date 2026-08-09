import type { CurriculumRecord } from "@/lib/curriculum/types";

/**
 * Verified Local Curriculum Records Database.
 * Contains official DepEd MATATAG and Regional ILAW verified competencies with provenance.
 */
export const VERIFIED_CURRICULUM_RECORDS: CurriculumRecord[] = [
  {
    id: "rec-matatag-sci7-photosynthesis",
    curriculum: "MATATAG",
    gradeLevel: "Grade 7",
    subject: "Science",
    quarter: "Q1",
    topic: "Photosynthesis in Plants",
    competencyText:
      "Differentiate the light-dependent and light-independent reactions of photosynthesis in plant cells.",
    competencyCode: "S7LT-IIg-7",
    sourceReference: "DepEd MATATAG Science 7 Curriculum Guide (2024), p. 42",
    verificationStatus: "VERIFIED_DEPED_OFFICIAL",
    isOfficialCode: true,
  },
  {
    id: "rec-matatag-eng7-metrical-feet",
    curriculum: "MATATAG",
    gradeLevel: "Grade 7",
    subject: "English",
    quarter: "Q1",
    topic: "Types of Metrical Feet",
    competencyText:
      "Analyze sound devices and rhythm in poetry including iambic, trochaic, and anapestic metrical structures.",
    competencyCode: "EN7L-Ia-3",
    sourceReference: "DepEd MATATAG English 7 Curriculum Guide (2024), p. 18",
    verificationStatus: "VERIFIED_DEPED_OFFICIAL",
    isOfficialCode: true,
  },
  {
    id: "rec-matatag-math8-linear-eq",
    curriculum: "MATATAG",
    gradeLevel: "Grade 8",
    subject: "Mathematics",
    quarter: "Q1",
    topic: "Solving Linear Equations",
    competencyText:
      "Solve linear equations and inequalities in one variable using algebraic properties.",
    competencyCode: "M8AL-Ia-1",
    sourceReference: "DepEd MATATAG Mathematics 8 Curriculum Guide (2024), p. 29",
    verificationStatus: "VERIFIED_DEPED_OFFICIAL",
    isOfficialCode: true,
  },
  {
    id: "rec-matatag-sci7-energy-forms",
    curriculum: "MATATAG",
    gradeLevel: "Grade 7",
    subject: "Science",
    quarter: "Q1",
    topic: "Forms of Energy",
    competencyText:
      "Describe mechanical, thermal, chemical, radiant, and electrical forms of energy.",
    competencyCode: "S7LT-IIIa-1",
    sourceReference: "DepEd MATATAG Science 7 Curriculum Guide (2024), p. 55",
    verificationStatus: "VERIFIED_DEPED_OFFICIAL",
    isOfficialCode: true,
  },
  {
    id: "rec-ilaw-eng7-metrical-feet",
    curriculum: "ILAW",
    gradeLevel: "Grade 7",
    subject: "English",
    quarter: "Q2",
    topic: "Types of Metrical Feet",
    competencyText:
      "Identify poetic metrical feet while connecting rhythmic oral recitation to local community songs and traditions.",
    competencyCode: "",
    sourceReference: "ILAW Contextualized English 7 Framework (2023), p. 14",
    verificationStatus: "VERIFIED_REGIONAL_OFFICIAL",
    isOfficialCode: false,
  },
  {
    id: "rec-ilaw-sci7-ecosystems",
    curriculum: "ILAW",
    gradeLevel: "Grade 7",
    subject: "Science",
    quarter: "Q2",
    topic: "Ecosystem Stewardship",
    competencyText:
      "Evaluate human impact on local ecosystems and formulate community conservation action plans.",
    competencyCode: "",
    sourceReference: "ILAW Environmental Science Regional Framework (2023), p. 31",
    verificationStatus: "VERIFIED_REGIONAL_OFFICIAL",
    isOfficialCode: false,
  },
];
