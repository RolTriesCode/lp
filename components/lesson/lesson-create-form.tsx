"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Target,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { requestLessonGeneration } from "@/lib/ai/generate-client";
import { saveDraftLesson } from "@/lib/draft-store";
import {
  classSizeOptions,
  curriculumOptions,
  durationOptions,
  gradeOptions,
  languageOptions,
  lessonPlanFormSchema,
  lessonTypeOptions,
  quarterOptions,
  resourceOptions,
  subjectOptions,
  type LessonPlanFormValues,
} from "@/lib/lesson-plan-schema";
import { GenerationStatusRegion } from "./generation-status";

type LessonCreateFormProps = {
  initialValues: LessonPlanFormValues;
};

export function LessonCreateForm({ initialValues }: LessonCreateFormProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCategory, setErrorCategory] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LessonPlanFormValues>({
    defaultValues: initialValues,
    resolver: zodResolver(lessonPlanFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const currentValues = watch();

  async function handleGenerateLesson(values: LessonPlanFormValues) {
    setErrorMessage(null);
    setErrorCategory(null);
    setIsGenerating(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const result = await requestLessonGeneration(values, controller.signal);

      if (result.success) {
        // Save canonical lesson draft and navigate to lesson viewer
        const lessonId = saveDraftLesson(result.data);
        setIsGenerating(false);
        router.push(`/lesson/${lessonId}`);
      } else {
        setIsGenerating(false);
        setErrorMessage(result.error.message);
        setErrorCategory(result.error.category);
      }
    } catch (err: unknown) {
      setIsGenerating(false);
      const msg = err instanceof Error ? err.message : "An unexpected client error occurred.";
      setErrorMessage(msg);
      setErrorCategory("UPSTREAM_FAILURE");
    } finally {
      abortControllerRef.current = null;
    }
  }

  function handleCancelGeneration() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setErrorMessage("Lesson generation was cancelled. Your inputs remain preserved below.");
    setErrorCategory("TIMEOUT");
  }

  function handleRetryGeneration() {
    handleSubmit(handleGenerateLesson)();
  }

  const selectedCurriculum = curriculumOptions.find((c) => c.value === currentValues.curriculum);
  const selectedType = lessonTypeOptions.find((t) => t.value === currentValues.type);

  return (
    <div className="lesson-create-container">
      {/* Top Header Navigation */}
      <div className="lesson-create-header-nav">
        <Link className="lesson-back-btn" href="/dashboard">
          <ArrowLeft aria-hidden="true" size={16} />
          <span>Back to Dashboard</span>
        </Link>
        <span className="lesson-step-badge">
          <Wand2 aria-hidden="true" size={13} />
          Step 1: Review & Adjustment
        </span>
      </div>

      {/* Main Screen Title */}
      <div className="lesson-create-title-block">
        <h1>Review & Adjust Lesson Plan</h1>
        <p>
          Fine-tune curriculum alignment, subject scope, classroom context, and custom rules before creating your AI lesson plan.
        </p>
      </div>

      <form
        className="lesson-create-form"
        noValidate
        onSubmit={handleSubmit(handleGenerateLesson)}
      >
        {/* SECTION 1: Curriculum & Format */}
        <section className="lesson-form-card" aria-labelledby="heading-curriculum">
          <div className="card-header">
            <div className="card-icon violet">
              <BookOpen aria-hidden="true" size={20} />
            </div>
            <div>
              <h2 id="heading-curriculum">1. Curriculum & Lesson Format</h2>
              <p>Select your DepEd educational framework and depth of detail.</p>
            </div>
          </div>

          <div className="card-body">
            {/* Curriculum Radio Selection */}
            <div className="form-group">
              <label className="field-label">Educational Framework</label>
              <div className="radio-card-grid">
                {curriculumOptions.map((option) => (
                  <label
                    className={`radio-card ${currentValues.curriculum === option.value ? "selected" : ""} ${isGenerating ? "disabled" : ""}`}
                    key={option.value}
                  >
                    <input
                      {...register("curriculum")}
                      disabled={isGenerating}
                      type="radio"
                      value={option.value}
                    />
                    <div className="radio-card-content">
                      <div className="radio-card-title">
                        <strong>{option.label}</strong>
                        {currentValues.curriculum === option.value && (
                          <CheckCircle2 className="check-icon" size={16} />
                        )}
                      </div>
                      <p>{option.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Lesson Type Radio Selection */}
            <div className="form-group margin-top-lg">
              <label className="field-label">Lesson Plan Format</label>
              <div className="radio-card-grid three-cols">
                {lessonTypeOptions.map((option) => (
                  <label
                    className={`radio-card ${currentValues.type === option.value ? "selected" : ""} ${isGenerating ? "disabled" : ""}`}
                    key={option.value}
                  >
                    <input
                      {...register("type")}
                      disabled={isGenerating}
                      type="radio"
                      value={option.value}
                    />
                    <div className="radio-card-content">
                      <div className="radio-card-title">
                        <strong>{option.label}</strong>
                        {currentValues.type === option.value && (
                          <CheckCircle2 className="check-icon" size={16} />
                        )}
                      </div>
                      <p>{option.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Scope & Competencies */}
        <section className="lesson-form-card" aria-labelledby="heading-scope">
          <div className="card-header">
            <div className="card-icon pink">
              <Target aria-hidden="true" size={20} />
            </div>
            <div>
              <h2 id="heading-scope">2. Scope & Learning Competencies</h2>
              <p>Specify the target grade, subject, quarter, and topic focus.</p>
            </div>
          </div>

          <div className="card-body">
            <div className="form-grid-3">
              {/* Grade Level */}
              <div className="form-group">
                <label className="field-label" htmlFor="field-grade">
                  Grade Level <span className="required">*</span>
                </label>
                <div className="select-wrapper">
                  <select
                    {...register("grade")}
                    className="form-select"
                    disabled={isGenerating}
                    id="field-grade"
                  >
                    {gradeOptions.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subject */}
              <div className="form-group">
                <label className="field-label" htmlFor="field-subject">
                  Learning Area / Subject <span className="required">*</span>
                </label>
                <div className="select-wrapper">
                  <select
                    {...register("subject")}
                    className="form-select"
                    disabled={isGenerating}
                    id="field-subject"
                  >
                    {subjectOptions.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quarter */}
              <div className="form-group">
                <label className="field-label" htmlFor="field-quarter">
                  Quarter <span className="required">*</span>
                </label>
                <div className="select-wrapper">
                  <select
                    {...register("quarter")}
                    className="form-select"
                    disabled={isGenerating}
                    id="field-quarter"
                  >
                    {quarterOptions.map((q) => (
                      <option key={q.value} value={q.value}>
                        {q.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Topic Field */}
            <div className="form-group margin-top-md">
              <div className="label-with-counter">
                <label className="field-label" htmlFor="field-topic">
                  Topic / Primary Focus <span className="required">*</span>
                </label>
                <span className="char-count">
                  {(currentValues.topic || "").length} / 160
                </span>
              </div>
              <div className={`input-wrapper ${errors.topic ? "has-error" : ""}`}>
                <input
                  {...register("topic")}
                  aria-describedby={errors.topic ? "topic-error" : undefined}
                  aria-invalid={Boolean(errors.topic)}
                  aria-required="true"
                  className="form-input"
                  disabled={isGenerating}
                  id="field-topic"
                  maxLength={160}
                  placeholder="e.g., Photosynthesis in Plants & Cellular Respiration"
                />
              </div>
              {errors.topic && (
                <p className="field-error-msg" id="topic-error" role="alert">
                  {errors.topic.message}
                </p>
              )}
            </div>

            {/* Competency Code Field (Optional) */}
            <div className="form-group margin-top-md">
              <div className="label-with-counter">
                <label className="field-label" htmlFor="field-competency">
                  Official Learning Competency / Code <span className="optional">(Optional)</span>
                </label>
                <span className="char-count">
                  {(currentValues.competency || "").length} / 250
                </span>
              </div>
              <div className={`input-wrapper ${errors.competency ? "has-error" : ""}`}>
                <input
                  {...register("competency")}
                  aria-describedby={errors.competency ? "competency-error" : undefined}
                  aria-invalid={Boolean(errors.competency)}
                  className="form-input"
                  disabled={isGenerating}
                  id="field-competency"
                  maxLength={250}
                  placeholder="e.g., S7LT-IIg-7: Differentiate asexual from sexual reproduction in terms of number of individuals"
                />
              </div>
              {errors.competency && (
                <p className="field-error-msg" id="competency-error" role="alert">
                  {errors.competency.message}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 3: Classroom Context */}
        <section className="lesson-form-card" aria-labelledby="heading-context">
          <div className="card-header">
            <div className="card-icon green">
              <Clock aria-hidden="true" size={20} />
            </div>
            <div>
              <h2 id="heading-context">3. Classroom & Delivery Context</h2>
              <p>Set duration, class size, available equipment, and language.</p>
            </div>
          </div>

          <div className="card-body">
            <div className="form-grid-2">
              {/* Duration */}
              <div className="form-group">
                <label className="field-label" htmlFor="field-duration">
                  Lesson Duration
                </label>
                <div className="select-wrapper">
                  <select
                    {...register("duration")}
                    className="form-select"
                    disabled={isGenerating}
                    id="field-duration"
                  >
                    {durationOptions.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Class Size */}
              <div className="form-group">
                <label className="field-label" htmlFor="field-classSize">
                  Class Size / Learner Count
                </label>
                <div className="select-wrapper">
                  <select
                    {...register("classSize")}
                    className="form-select"
                    disabled={isGenerating}
                    id="field-classSize"
                  >
                    {classSizeOptions.map((cs) => (
                      <option key={cs.value} value={cs.value}>
                        {cs.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Available Resources */}
              <div className="form-group">
                <label className="field-label" htmlFor="field-resources">
                  Available Teaching Resources
                </label>
                <div className="select-wrapper">
                  <select
                    {...register("resources")}
                    className="form-select"
                    disabled={isGenerating}
                    id="field-resources"
                  >
                    {resourceOptions.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Language */}
              <div className="form-group">
                <label className="field-label" htmlFor="field-language">
                  Medium of Instruction / Language
                </label>
                <div className="select-wrapper">
                  <select
                    {...register("language")}
                    className="form-select"
                    disabled={isGenerating}
                    id="field-language"
                  >
                    {languageOptions.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: Additional Instructions */}
        <section className="lesson-form-card" aria-labelledby="heading-instructions">
          <div className="card-header">
            <div className="card-icon orange">
              <Layers aria-hidden="true" size={20} />
            </div>
            <div>
              <h2 id="heading-instructions">4. Custom Teacher Instructions</h2>
              <p>Add specific adaptations, group work rules, or learning goals.</p>
            </div>
          </div>

          <div className="card-body">
            <div className="form-group">
              <div className="label-with-counter">
                <label className="field-label" htmlFor="field-instructions">
                  Teacher Notes & Special Instructions <span className="optional">(Optional)</span>
                </label>
                <span className="char-count">
                  {(currentValues.instructions || "").length} / 500
                </span>
              </div>
              <div className={`input-wrapper ${errors.instructions ? "has-error" : ""}`}>
                <textarea
                  {...register("instructions")}
                  aria-describedby={errors.instructions ? "instructions-error" : undefined}
                  aria-invalid={Boolean(errors.instructions)}
                  className="form-textarea"
                  disabled={isGenerating}
                  id="field-instructions"
                  maxLength={500}
                  rows={4}
                  placeholder="e.g., Include a 5-minute hands-on leaf observation activity; provide differentiated questions for struggling learners."
                />
              </div>
              {errors.instructions && (
                <p className="field-error-msg" id="instructions-error" role="alert">
                  {errors.instructions.message}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 5: Summary & Generation Pipeline Status Region */}
        <section className="lesson-form-card summary-card" aria-label="Generation summary and status">
          <div className="payload-summary-bar">
            <div className="summary-pill-group">
              <span className="summary-pill highlight">
                {selectedCurriculum?.label || currentValues.curriculum}
              </span>
              <span className="summary-pill">Grade {currentValues.grade}</span>
              <span className="summary-pill">{currentValues.subject}</span>
              <span className="summary-pill">{selectedType?.label || currentValues.type}</span>
              <span className="summary-pill">{currentValues.quarter}</span>
              <span className="summary-pill">{currentValues.duration}</span>
            </div>
          </div>

          {/* Staged Generation Status Region */}
          <GenerationStatusRegion
            curriculum={currentValues.curriculum}
            errorCategory={errorCategory}
            errorMessage={errorMessage}
            isGenerating={isGenerating}
            onCancel={handleCancelGeneration}
            onRetry={handleRetryGeneration}
          />

          {/* Action Bar */}
          <div className="form-action-bar">
            <Link className="btn-secondary" href="/dashboard">
              Cancel & Return
            </Link>
            <button
              className="btn-primary-generate"
              disabled={isGenerating}
              type="submit"
            >
              <Sparkles aria-hidden="true" size={18} />
              <span>{isGenerating ? "Generating Lesson..." : "Generate Lesson Plan"}</span>
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}
