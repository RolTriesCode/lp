import {
  ArrowRight, BookMarked, Bot, Hand, MessageCircleMore,
  SquarePen, Target, UsersRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { DashboardHeader } from "./dashboard-header";
import { DashboardContent } from "./dashboard-motion";
import { DashboardSidebar, SidebarNavigation } from "./dashboard-sidebar";
import { LessonPlanComposer } from "./lesson-plan-composer";
import { QuickActions } from "./quick-actions";
import { RecentLessonPlans } from "./recent-lesson-plans";

function QuoteCard() {
  return <div className="quote-card"><div><p>“A great teacher makes<br />learning simple and powerful.”</p><span>— Unknown</span></div><div className="quote-decoration" aria-hidden="true"><span>“</span><BookMarked size={35} strokeWidth={1.5} /></div></div>;
}

const assistantActions = [
  { label: "Improve learning objectives", icon: Target, color: "#ff365f" },
  { label: "Make activity more engaging", icon: UsersRound, color: "#6239f5" },
  { label: "Create higher-order questions", icon: Bot, color: "#ff3a91" },
  { label: "Simplify or rephrase content", icon: SquarePen, color: "#6338f5" },
  { label: "Differentiate for learners", icon: UsersRound, color: "#10a66a" },
];

function AssistantPanel() {
  return <aside className="assistant panel"><div className="assistant-title"><h2>AI Assistant</h2><span>Beta</span></div><p>Hi! I can help you with:</p><div className="assistant-actions">{assistantActions.map(({ label, icon: Icon, color }) => <button type="button" key={label}><Icon aria-hidden="true" size={16} color={color} />{label}</button>)}</div><button type="button" className="ask-button"><MessageCircleMore aria-hidden="true" size={18} /><span>Ask me anything...</span><ArrowRight aria-hidden="true" size={17} /></button></aside>;
}

const schedule = [
  ["MON", "20", "Photosynthesis in Plants", "Grade 7", "Science", "Teach"],
  ["TUE", "21", "Types of Metrical Feet", "Grade 7", "English", "Teach"],
  ["WED", "22", "Solving Linear Equations", "Grade 8", "Math", "Teach"],
  ["THU", "23", "Forms of Energy", "Grade 7", "Science", "Teach"],
  ["FRI", "24", "Assessment: Week 3", "Multiple Subjects", "", "Assess"],
];

function WeekSchedule() {
  return <section className="schedule panel"><div className="section-heading"><h2>This Week&apos;s Schedule</h2><button type="button">View Calendar</button></div><div className="schedule-list">{schedule.map(([day, date, title, grade, subject, action]) => <div className="schedule-item" key={date}><div className="schedule-date"><span>{day}</span><strong>{date}</strong></div><div className="schedule-copy"><strong>{title}</strong><span>{grade}{subject && <> <b>•</b> {subject}</>}</span></div><span className={`schedule-action ${action.toLowerCase()}`}>{action}</span></div>)}</div><button className="calendar-link" type="button">View full calendar <ArrowRight size={17} /></button></section>;
}

type DashboardShellProps = {
  children?: ReactNode;
  currentPath?: string;
};

export function DashboardShell({ children, currentPath = "/dashboard" }: DashboardShellProps) {
  return (
    <div className="dashboard-shell">
      <DashboardHeader mobileNavigation={<SidebarNavigation currentPath={currentPath} />} />
      <DashboardSidebar currentPath={currentPath} />
      <DashboardContent>
        {children ? (
          children
        ) : (
          <>
            <div className="dashboard-primary-layout">
              <div className="dashboard-primary">
                <div className="intro-row">
                  <div>
                    <h1>Good morning, Ma&apos;am! <Hand aria-hidden="true" /></h1>
                    <p>What are we teaching today?</p>
                  </div>
                  <QuoteCard />
                </div>
                <LessonPlanComposer />
              </div>
              <AssistantPanel />
            </div>
            <QuickActions />
            <div className="lower-grid">
              <RecentLessonPlans />
              <WeekSchedule />
            </div>
          </>
        )}
      </DashboardContent>
    </div>
  );
}
