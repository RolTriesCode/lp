"use client";

import {
  ArrowUpRight,
  ClipboardCheck,
  FilePenLine,
  FilePlus2,
  Presentation,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";

type QuickAction = {
  label: string;
  description: string;
  icon: LucideIcon;
  color: "violet" | "pink" | "green" | "orange";
  primary?: boolean;
  href?: string;
};

const actions: QuickAction[] = [
  {
    label: "Create Lesson Plan",
    description: "Plan with AI",
    icon: FilePlus2,
    color: "violet",
    primary: true,
  },
  {
    label: "Generate Presentation",
    description: "Build teaching slides",
    icon: Presentation,
    color: "pink",
    href: "/presentations",
  },
  {
    label: "Create Assessment",
    description: "Design a quick check",
    icon: ClipboardCheck,
    color: "green",
    href: "/assessments",
  },
  {
    label: "Create Worksheet",
    description: "Prepare learner practice",
    icon: FilePenLine,
    color: "orange",
    href: "/worksheets",
  },
];

function focusLessonComposer() {
  const composer = document.getElementById("lesson-plan-composer");
  const topicInput = document.getElementById("lesson-topic");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  composer?.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block: "center",
  });

  window.setTimeout(
    () => topicInput?.focus({ preventScroll: true }),
    reduceMotion ? 0 : 280,
  );
}

export function QuickActions() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="quick-actions" aria-labelledby="quick-actions-heading">
      <h2 className="sr-only" id="quick-actions-heading">Quick Actions</h2>
      {actions.map(({ label, description, icon: Icon, color, primary, href }) => {
        const content = <><span className={`quick-action-icon ${color}`}><Icon aria-hidden="true" size={25} strokeWidth={1.8} /></span><span className="quick-action-copy"><strong>{label}</strong><small>{description}</small></span><ArrowUpRight aria-hidden="true" className="quick-action-arrow" size={17} /></>;
        const motionProps = { transition: { duration: reduceMotion ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] as const }, whileHover: reduceMotion ? undefined : { y: -2, boxShadow: "0 6px 16px rgba(44, 35, 102, 0.06)" }, whileTap: reduceMotion ? undefined : { y: 0, scale: 0.995 } };
        return href ? <motion.div className="quick-action-motion" key={label} {...motionProps}><Link className="quick-action panel" href={href}>{content}</Link></motion.div> : <motion.button className="quick-action panel" key={label} onClick={primary ? focusLessonComposer : undefined} type="button" {...motionProps}>{content}</motion.button>;
      })}
    </section>
  );
}
