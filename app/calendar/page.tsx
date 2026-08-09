import { CalendarPlanner } from "@/components/calendar/calendar-planner";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getTeacherProfile } from "@/lib/profile/repository";
import { fromDateKey, toDateKey } from "@/lib/schedule/date";
import { ScheduleEntryKindSchema, ScheduleEntryStatusSchema } from "@/schemas/schedule";

type CalendarPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const [params, profile] = await Promise.all([searchParams, getTeacherProfile()]);
  const rawDate = first(params.date);
  const date = rawDate && fromDateKey(rawDate) ? rawDate : toDateKey(new Date());
  const view = first(params.view) === "month" ? "month" : "week";
  const parsedKind = ScheduleEntryKindSchema.safeParse(first(params.kind));
  const parsedStatus = ScheduleEntryStatusSchema.safeParse(first(params.status));

  return (
    <DashboardShell currentPath="/calendar" profile={profile}>
      <CalendarPlanner
        initialDate={date}
        initialKind={parsedKind.success ? parsedKind.data : "all"}
        initialStatus={parsedStatus.success ? parsedStatus.data : "all"}
        initialView={view}
      />
    </DashboardShell>
  );
}
