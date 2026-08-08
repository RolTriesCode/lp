"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, ChevronDown, LibraryBig } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useController, type Control } from "react-hook-form";
import type { LessonPlanFormValues } from "@/lib/lesson-plan-schema";

type SelectFieldName = Exclude<keyof LessonPlanFormValues, "topic">;
type SelectOption = { label: string; value: string };
type ComposerField = {
  name: SelectFieldName;
  label: string;
  options: SelectOption[];
  icon?: typeof LibraryBig;
};

const fields: ComposerField[] = [
  {
    name: "curriculum",
    label: "Curriculum",
    options: [
      { label: "MATATAG", value: "MATATAG" },
      { label: "ILAW", value: "ILAW" },
    ],
    icon: LibraryBig,
  },
  {
    name: "grade",
    label: "Grade Level",
    options: ["7", "8", "9", "10"].map((grade) => ({
      label: `Grade ${grade}`,
      value: grade,
    })),
  },
  {
    name: "subject",
    label: "Learning Area",
    options: ["Science", "Mathematics", "English", "Araling Panlipunan"].map(
      (subject) => ({ label: subject, value: subject }),
    ),
  },
  {
    name: "type",
    label: "Lesson Type",
    options: [
      { label: "Detailed Lesson Plan", value: "detailed" },
      { label: "Semi-Detailed Lesson Plan", value: "semi-detailed" },
      { label: "Daily Lesson Log", value: "daily-log" },
    ],
  },
];

function ComposerSelect({
  control,
  field,
  isOpen,
  onOpenChange,
}: {
  control: Control<LessonPlanFormValues>;
  field: ComposerField;
  isOpen: boolean;
  onOpenChange: (name: SelectFieldName | null) => void;
}) {
  const { field: formField } = useController({ control, name: field.name });
  const reduceMotion = useReducedMotion();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedOption = field.options.find((option) => option.value === formField.value);
  const listboxId = `${field.name}-options`;
  const labelId = `${field.name}-label`;
  const valueId = `${field.name}-value`;
  const Icon = field.icon;

  useEffect(() => {
    if (!isOpen) return;
    const selected = document.querySelector<HTMLButtonElement>(
      `#${listboxId} [aria-selected="true"]`,
    );
    selected?.focus();
  }, [isOpen, listboxId]);

  function handleListboxKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const options = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>("[role='option']"),
    );
    const currentIndex = options.indexOf(document.activeElement as HTMLButtonElement);
    let nextIndex: number | null = null;

    if (event.key === "ArrowDown") nextIndex = (currentIndex + 1) % options.length;
    if (event.key === "ArrowUp") nextIndex = (currentIndex - 1 + options.length) % options.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = options.length - 1;
    if (event.key === "Escape") {
      event.preventDefault();
      onOpenChange(null);
      triggerRef.current?.focus();
      return;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      options[nextIndex]?.focus();
    }
  }

  return (
    <div className="select-field">
      <span id={labelId}>{field.label}</span>
      <button
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-labelledby={`${labelId} ${valueId}`}
        className="select-trigger"
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            onOpenChange(field.name);
          }
        }}
        onClick={() => onOpenChange(isOpen ? null : field.name)}
        ref={triggerRef}
        type="button"
      >
        <span id={valueId}>
          {Icon && <Icon aria-hidden="true" size={17} color="#5637f5" />}
          {selectedOption?.label}
        </span>
        <motion.span
          animate={{ rotate: isOpen && !reduceMotion ? 180 : 0 }}
          className="select-chevron"
          transition={{ duration: reduceMotion ? 0 : 0.16 }}
        >
          <ChevronDown aria-hidden="true" size={16} />
        </motion.span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="select-menu"
            exit={{
              opacity: 0,
              y: reduceMotion ? 0 : -3,
              scale: reduceMotion ? 1 : 0.99,
            }}
            id={listboxId}
            initial={reduceMotion ? false : { opacity: 0, y: -5, scale: 0.98 }}
            onKeyDown={handleListboxKeyDown}
            role="listbox"
            transition={{
              duration: reduceMotion ? 0 : 0.16,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {field.options.map((option) => {
              const selected = formField.value === option.value;
              return (
                <button
                  aria-selected={selected}
                  className={`select-option ${selected ? "selected" : ""}`}
                  key={option.value}
                  onClick={() => {
                    formField.onChange(option.value);
                    onOpenChange(null);
                  }}
                  role="option"
                  tabIndex={selected ? 0 : -1}
                  type="button"
                >
                  <span>{option.label}</span>
                  {selected && <Check aria-hidden="true" size={14} />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ComposerFields({ control }: { control: Control<LessonPlanFormValues> }) {
  const [openField, setOpenField] = useState<SelectFieldName | null>(null);
  const groupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (!groupRef.current?.contains(event.target as Node)) setOpenField(null);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenField(null);
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div className="composer-fields" ref={groupRef}>
      {fields.map((field) => (
        <ComposerSelect
          control={control}
          field={field}
          isOpen={openField === field.name}
          key={field.name}
          onOpenChange={setOpenField}
        />
      ))}
    </div>
  );
}
