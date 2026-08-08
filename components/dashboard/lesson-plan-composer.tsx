"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Paperclip, Settings, SlidersHorizontal, Sparkles, WandSparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  lessonPlanDefaults,
  lessonPlanFormSchema,
  toLessonPlanSearchParams,
  type LessonPlanFormValues,
} from "@/lib/lesson-plan-schema";
import { ComposerFields } from "./composer-fields";

export function LessonPlanComposer() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [isNavigating, setIsNavigating] = useState(false);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LessonPlanFormValues>({
    defaultValues: lessonPlanDefaults,
    resolver: zodResolver(lessonPlanFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  function submitLessonPlan(values: LessonPlanFormValues) {
    setIsNavigating(true);
    const searchParams = toLessonPlanSearchParams(values);
    router.push(`/lesson/create?${searchParams.toString()}`);
  }

  return (
    <form
      className="composer panel"
      id="lesson-plan-composer"
      noValidate
      onSubmit={handleSubmit(submitLessonPlan)}
    >
      <div className="composer-heading">
        <WandSparkles aria-hidden="true" size={25} color="#5637f5" />
        <div>
          <h2>Create a lesson plan with AI</h2>
          <p>Generate MATATAG and ILAW aligned lesson plans in seconds.</p>
        </div>
      </div>
      <ComposerFields control={control} />
      <div className="topic-control">
        <label className={`topic-field ${errors.topic ? "has-error" : ""}`}>
          <Sparkles aria-hidden="true" size={17} />
          <span className="sr-only">Topic or learning competency</span>
          <input
            {...register("topic")}
            aria-describedby={errors.topic ? "lesson-topic-error" : undefined}
            aria-invalid={Boolean(errors.topic)}
            aria-required="true"
            id="lesson-topic"
            maxLength={160}
            placeholder="Enter a topic or learning competency (e.g., Photosynthesis in Plants)"
          />
        </label>
        <AnimatePresence initial={false}>
          {errors.topic && (
            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className="topic-error"
              exit={{ opacity: 0, y: reduceMotion ? 0 : -2 }}
              id="lesson-topic-error"
              initial={reduceMotion ? false : { opacity: 0, y: -3 }}
              role="alert"
              transition={{ duration: reduceMotion ? 0 : 0.16 }}
            >
              {errors.topic.message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      <div className="composer-actions">
        <div className="secondary-actions">
          <button type="button"><SlidersHorizontal size={16} /> Add more details</button>
          <button type="button"><Paperclip size={17} /> Attach reference</button>
          <button type="button"><Settings size={16} /> Advanced settings</button>
        </div>
        <button className="generate-button" disabled={isNavigating} type="submit">
          {isNavigating ? "Opening Generator…" : "Generate Lesson Plan"}
          <Sparkles aria-hidden="true" size={16} />
        </button>
      </div>
    </form>
  );
}
