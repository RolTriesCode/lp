"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Layers,
  Paperclip,
  Sparkles,
  Target,
  Wand2,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { requestLessonGeneration } from "@/lib/ai/generate-client";
import { defaultStorageAdapter } from "@/lib/persistence/remote-adapter";
import { defaultResourceRepository } from "@/lib/resources/repository";
import { defaultTemplateRepository } from "@/lib/templates/repository";
import { defaultClassroomContextRepository } from "@/lib/classroom-context/repository";
import { curriculumRecordMatchesLessonInput } from "@/lib/curriculum/adapter";
import type { CurriculumRecord } from "@/lib/curriculum/types";
import { toUploadedReference } from "@/schemas/resource";
import { MAX_REFERENCE_DOCUMENTS } from "@/schemas/reference";
import {
  LessonTemplateApplicationSchema,
  applyTemplateToLessonForm,
  type LessonTemplate,
} from "@/schemas/template";
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
import { ReferenceUpload } from "./reference-upload";
import type { ClassroomContextApplication } from "@/schemas/classroom-context";
import { BloomTaxonomyLevelSchema, type BloomTaxonomyLevel } from "@/schemas/pedagogy";
import { trackProductEvent } from "@/lib/monitoring/analytics";

type LessonCreateFormProps = {
  initialCurriculumRecord?: CurriculumRecord;
  initialValues: LessonPlanFormValues;
  initialResourceId?: string;
  initialTemplateId?: string;
};

export function LessonCreateForm({
  initialCurriculumRecord,
  initialValues,
  initialResourceId,
  initialTemplateId,
}: LessonCreateFormProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCategory, setErrorCategory] = useState<string | null>(null);
  const [generationController, setGenerationController] = useState<AbortController | null>(null);
  const [appliedTemplate, setAppliedTemplate] = useState<LessonTemplate | null>(null);
  const [libraryMessage, setLibraryMessage] = useState<string | null>(null);
  const [appliedClassroomContext, setAppliedClassroomContext] = useState<ClassroomContextApplication | null>(null);
  const [classroomContextState, setClassroomContextState] = useState<"idle" | "loading" | "error">("idle");
  const [classroomContextMessage, setClassroomContextMessage] = useState<string | null>(null);
  const [bloomLevels, setBloomLevels] = useState<BloomTaxonomyLevel[]>(["understand", "apply"]);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    getValues,
    reset,
    formState: { errors },
  } = useForm<LessonPlanFormValues>({
    defaultValues: initialValues,
    resolver: zodResolver(lessonPlanFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const currentValues = useWatch({
    control,
    defaultValue: initialValues,
  }) as LessonPlanFormValues;

  useEffect(() => {
    let active = true;

    async function loadLibrarySelections() {
      if (initialTemplateId) {
        const template = await defaultTemplateRepository.get(initialTemplateId);
        if (!active) return;
        if (template) {
          reset(applyTemplateToLessonForm(template, getValues()));
          setAppliedTemplate(template);
        } else {
          setLibraryMessage("That template is no longer available. Your current lesson inputs were preserved.");
        }
      }

      if (initialResourceId) {
        const resource = await defaultResourceRepository.get(initialResourceId);
        if (!active) return;
        if (resource) {
          const reference = toUploadedReference(resource);
          const current = getValues("uploadedReferences") ?? [];
          if (!current.some((item) => item.id === reference.id)) {
            if (current.length >= MAX_REFERENCE_DOCUMENTS) {
              setLibraryMessage(
                `Remove a reference before adding “${reference.name}”. A lesson can use up to ${MAX_REFERENCE_DOCUMENTS} references.`
              );
            } else {
              setValue("uploadedReferences", [...current, reference], {
                shouldDirty: true,
                shouldValidate: true,
              });
            }
          }
        } else {
          setLibraryMessage("That resource is no longer available. Your current lesson inputs were preserved.");
        }
      }
    }

    void loadLibrarySelections();
    return () => {
      active = false;
    };
  }, [getValues, initialResourceId, initialTemplateId, reset, setValue]);

  async function handleGenerateLesson(values: LessonPlanFormValues) {
    setErrorMessage(null);
    setErrorCategory(null);
    setIsGenerating(true);
    trackProductEvent("lesson_generation_started", {
      curriculum: values.curriculum,
      lesson_type: values.type,
    });

    const controller = new AbortController();
    setGenerationController(controller);

    try {
      const templateApplication = appliedTemplate
        ? LessonTemplateApplicationSchema.parse(appliedTemplate)
        : undefined;
      const result = await requestLessonGeneration(
        {
          ...values,
          appliedTemplate: templateApplication,
          classroomContext: appliedClassroomContext ?? undefined,
          bloomLevels,
        },
        controller.signal
      );

      if (result.success) {
        const savedLesson = await defaultStorageAdapter.createLesson(result.data);
        if (!savedLesson.id) {
          throw new Error("The saved lesson did not return an identifier.");
        }
        trackProductEvent("lesson_generation_succeeded", {
          curriculum: values.curriculum,
          lesson_type: values.type,
        });
        setIsGenerating(false);
        router.push(`/lesson/${savedLesson.id}`);
      } else {
        trackProductEvent("lesson_generation_failed", { category: result.error.category });
        setIsGenerating(false);
        setErrorMessage(result.error.message);
        setErrorCategory(result.error.category);
      }
    } catch (err: unknown) {
      trackProductEvent("lesson_generation_failed", { category: "UPSTREAM_FAILURE" });
      setIsGenerating(false);
      const msg = err instanceof Error ? err.message : "An unexpected client error occurred.";
      setErrorMessage(msg);
      setErrorCategory("UPSTREAM_FAILURE");
    } finally {
      setGenerationController((current) => (current === controller ? null : current));
    }
  }

  function handleCancelGeneration() {
    if (generationController) {
      generationController.abort();
      setGenerationController(null);
    }
    setIsGenerating(false);
    setErrorMessage("Lesson generation was cancelled. Your inputs remain preserved below.");
    setErrorCategory("TIMEOUT");
  }

  function handleRetryGeneration() {
    handleSubmit(handleGenerateLesson)();
  }

  async function applySavedClassroomContext() {
    setClassroomContextState("loading");
    setClassroomContextMessage(null);
    try {
      const record = await defaultClassroomContextRepository.get();
      const context = record.value;
      setValue("duration", context.preferredDuration, { shouldDirty: true, shouldValidate: true });
      setValue("classSize", context.classSize, { shouldDirty: true, shouldValidate: true });
      setValue("language", context.language, { shouldDirty: true, shouldValidate: true });
      setValue("resources", context.availableResources[0], { shouldDirty: true, shouldValidate: true });
      setAppliedClassroomContext(context);
      setClassroomContextState("idle");
      setClassroomContextMessage("Saved classroom defaults applied. They will guide this lesson only while the context remains included below.");
    } catch (error) {
      setClassroomContextState("error");
      setClassroomContextMessage(error instanceof Error ? error.message : "Classroom defaults could not be loaded.");
    }
  }

  function toggleBloomLevel(level: BloomTaxonomyLevel, checked: boolean) {
    setBloomLevels((current) => {
      const next = checked ? [...new Set([...current, level])] : current.filter((item) => item !== level);
      const parsed = BloomTaxonomyLevelSchema.array().min(1).max(3).safeParse(next);
      return parsed.success ? parsed.data : current;
    });
  }

  const selectedCurriculum = curriculumOptions.find((c) => c.value === currentValues.curriculum);
  const selectedType = lessonTypeOptions.find((t) => t.value === currentValues.type);
  const curriculumSelectionIsVerified = initialCurriculumRecord
    ? curriculumRecordMatchesLessonInput(initialCurriculumRecord, currentValues)
    : false;

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

      {initialCurriculumRecord ? (
        <div
          className={`library-selection-notice ${curriculumSelectionIsVerified ? "" : "warning"}`}
          role="status"
        >
          <div>
            <strong>
              {curriculumSelectionIsVerified
                ? "Verified curriculum competency selected"
                : "Curriculum selection changed"}
            </strong>
            <span>
              {curriculumSelectionIsVerified
                ? `${initialCurriculumRecord.verificationStatus === "VERIFIED_DEPED_OFFICIAL" ? "DepEd official" : "Regional official"} · ${initialCurriculumRecord.sourceReference}`
                : "The edited inputs will be treated as teacher-authored. No official competency code will be claimed unless they match the selected verified record."}
            </span>
          </div>
          <Link href="/curriculum">Review source</Link>
        </div>
      ) : null}

      {appliedTemplate || libraryMessage ? (
        <div className={`library-selection-notice ${libraryMessage ? "warning" : ""}`} role="status">
          <div>
            <strong>{libraryMessage ? "Library item unavailable" : `Template applied: ${appliedTemplate?.name}`}</strong>
            <span>
              {libraryMessage ?? "Defaults are populated below and its section pattern will guide generation."}
            </span>
          </div>
          {appliedTemplate ? (
            <button onClick={() => setAppliedTemplate(null)} type="button">
              Remove pattern
            </button>
          ) : null}
        </div>
      ) : null}

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
            <div className={`classroom-context-apply${appliedClassroomContext ? " applied" : ""}`}>
              <div className="classroom-context-apply-copy">
                <UsersRound aria-hidden="true" />
                <div>
                  <strong>{appliedClassroomContext ? "Saved classroom context is included" : "Use your reusable classroom defaults"}</strong>
                  <span>{appliedClassroomContext ? "Review the populated fields. General learner supports and teacher notes will be sent as bounded data for this lesson." : "Nothing is loaded or sent until you choose to apply it."}</span>
                </div>
              </div>
              {appliedClassroomContext ? <button onClick={() => { setAppliedClassroomContext(null); setClassroomContextMessage("Classroom context removed from AI generation. The populated form fields were kept for review."); }} type="button">Exclude from AI</button> : <button disabled={classroomContextState === "loading" || isGenerating} onClick={() => void applySavedClassroomContext()} type="button">{classroomContextState === "loading" ? "Loading defaults…" : "Apply saved context"}</button>}
            </div>
            {classroomContextMessage ? <p className={`classroom-context-message ${classroomContextState}`} role={classroomContextState === "error" ? "alert" : "status"}>{classroomContextMessage}</p> : null}
            {appliedClassroomContext ? <div className="classroom-context-summary" aria-label="Applied classroom context"><span>{appliedClassroomContext.availableResources.length} resource setting{appliedClassroomContext.availableResources.length === 1 ? "" : "s"}</span><span>{appliedClassroomContext.learnerNeeds.length} learner support{appliedClassroomContext.learnerNeeds.length === 1 ? "" : "s"}</span><span>{appliedClassroomContext.teacherNotes ? "General teacher notes included" : "No saved teacher notes"}</span></div> : null}
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
            <fieldset className="lesson-bloom-controls">
              <legend>Bloom&apos;s taxonomy targets</legend>
              <p>Select one to three levels to guide objective verbs, activities, and assessment demand. This does not lock later teacher edits.</p>
              <div>{BloomTaxonomyLevelSchema.options.map((level) => <label key={level}><input checked={bloomLevels.includes(level)} disabled={isGenerating || (bloomLevels.includes(level) ? bloomLevels.length === 1 : bloomLevels.length === 3)} onChange={(event) => toggleBloomLevel(level, event.target.checked)} type="checkbox" /><span>{level}</span></label>)}</div>
            </fieldset>
          </div>
        </section>

        {/* SECTION 4: Reference documents */}
        <section className="lesson-form-card" aria-labelledby="heading-references">
          <div className="card-header">
            <div className="card-icon violet">
              <Paperclip aria-hidden="true" size={20} />
            </div>
            <div>
              <h2 id="heading-references">4. Reference Documents</h2>
              <p>Add trusted source material and review exactly what the lesson generator can use.</p>
            </div>
          </div>
          <div className="card-body">
            <ReferenceUpload
              disabled={isGenerating}
              onReferenceUploaded={() => undefined}
              onChange={(uploadedReferences) =>
                setValue("uploadedReferences", uploadedReferences, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              references={currentValues.uploadedReferences ?? []}
            />
          </div>
        </section>

        {/* SECTION 5: Additional Instructions */}
        <section className="lesson-form-card" aria-labelledby="heading-instructions">
          <div className="card-header">
            <div className="card-icon orange">
              <Layers aria-hidden="true" size={20} />
            </div>
            <div>
              <h2 id="heading-instructions">5. Custom Teacher Instructions</h2>
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
                  placeholder="e.g., Include a 5-minute leaf observation; offer an optional worked example and deeper extension questions."
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

        {/* SECTION 6: Summary & Generation Pipeline Status Region */}
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
