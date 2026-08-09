"use client";

import { ArrowRight, CalendarPlus, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { addDays, startOfWeek, toDateKey } from "@/lib/schedule/date";
import { defaultScheduleRepository } from "@/lib/schedule/repository";
import type { ScheduleEntry } from "@/schemas/schedule";

const kindLabels = {
  lesson: "Teach",
  assessment: "Assess",
  teaching_pack: "Pack",
  other: "Plan",
} as const;

export function DashboardSchedule() {
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const today = useMemo(() => new Date(), []);
  const start = useMemo(() => startOfWeek(today), [today]);
  const end = useMemo(() => addDays(start, 7), [start]);
  const calendarHref = `/calendar?date=${toDateKey(today)}&view=week`;

  const load = useCallback(async () => {
    setState("loading");
    try {
      setEntries(await defaultScheduleRepository.list({ start: start.toISOString(), end: end.toISOString() }));
      setState("ready");
    } catch {
      setState("error");
    }
  }, [end, start]);

  useEffect(() => {
    let active = true;
    void defaultScheduleRepository
      .list({ start: start.toISOString(), end: end.toISOString() })
      .then((data) => {
        if (!active) return;
        setEntries(data);
        setState("ready");
      })
      .catch(() => {
        if (active) setState("error");
      });
    return () => { active = false; };
  }, [end, start]);

  return (
    <section className="schedule panel" aria-busy={state === "loading"}>
      <div className="section-heading"><h2>This Week&apos;s Schedule</h2><Link href={calendarHref}>View Calendar</Link></div>
      {state === "loading" ? <div className="dashboard-schedule-state">Loading this week…</div> : null}
      {state === "error" ? <div className="dashboard-schedule-state error"><RotateCcw aria-hidden="true" /><span>Schedule unavailable. Your saved work is unchanged.</span><button onClick={() => void load()} type="button">Try again</button></div> : null}
      {state === "ready" && entries.length === 0 ? <div className="dashboard-schedule-state empty"><CalendarPlus aria-hidden="true" /><div><strong>Your week is open.</strong><span>Add a lesson, assessment, or teaching pack to start planning.</span></div><Link href={calendarHref}>Plan this week</Link></div> : null}
      {state === "ready" && entries.length > 0 ? <div className="schedule-list">{entries.slice(0, 5).map((entry) => { const date = new Date(entry.startsAt); return <Link className="schedule-item" href={`${calendarHref}&kind=${entry.kind}`} key={entry.id}><div className="schedule-date"><span>{new Intl.DateTimeFormat("en-PH", { weekday: "short" }).format(date).toUpperCase()}</span><strong>{date.getDate()}</strong></div><div className="schedule-copy"><strong>{entry.title}</strong><span>{new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit" }).format(date)}{entry.subject ? <> <b>•</b> {entry.subject}</> : null}</span></div><span className={`schedule-action ${entry.kind}`}>{kindLabels[entry.kind]}</span></Link>; })}</div> : null}
      <Link className="calendar-link" href={calendarHref}>View full calendar <ArrowRight aria-hidden="true" size={17} /></Link>
    </section>
  );
}
