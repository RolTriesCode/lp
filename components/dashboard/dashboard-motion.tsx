"use client";

import { motion, useReducedMotion } from "motion/react";
import type { PropsWithChildren } from "react";

const easeOut = [0.16, 1, 0.3, 1] as const;

export function DashboardContent({ children }: PropsWithChildren) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.main
      animate={{ opacity: 1, y: 0 }}
      className="dashboard-content"
      initial={reduceMotion ? false : { opacity: 0.96, y: 6 }}
      transition={{ duration: reduceMotion ? 0 : 0.24, ease: easeOut }}
    >
      {children}
    </motion.main>
  );
}

export function SidebarActiveIndicator() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.span
      aria-hidden="true"
      className="sidebar-active-indicator"
      initial={reduceMotion ? false : { opacity: 0.72, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      layoutId="active-sidebar-item"
      transition={{ duration: reduceMotion ? 0 : 0.2, ease: easeOut }}
    />
  );
}
