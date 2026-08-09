import {
  ArrowRight, BookMarked, Bot, Hand, MessageCircleMore,
  SquarePen, Target, UsersRound,
} from "lucide-react";
import type { ReactNode } from "react";
import type { HeaderTeacherProfile } from "@/schemas/profile";
import Link from "next/link";
import { DashboardHeader } from "./dashboard-header";
import { DashboardContent } from "./dashboard-motion";
import { DashboardSidebar, SidebarNavigation } from "./dashboard-sidebar";
import { LessonPlanComposer } from "./lesson-plan-composer";
import { QuickActions } from "./quick-actions";
import { RecentLessonPlans } from "./recent-lesson-plans";
import { DashboardSchedule } from "./dashboard-schedule";

function QuoteCard() {
  return <div className="quote-card"><div><p>“A great teacher makes<br />learning simple and powerful.”</p><span>— Unknown</span></div><div className="quote-decoration" aria-hidden="true"><span>“</span><BookMarked size={35} strokeWidth={1.5} /></div></div>;
}

const assistantActions = [
  { label: "Improve learning objectives", icon: Target, color: "#ff365f", href: "/lesson?section=objectives" },
  { label: "Make activity more engaging", icon: UsersRound, color: "#6239f5", href: "/lesson?section=procedures" },
  { label: "Create higher-order questions", icon: Bot, color: "#ff3a91", href: "/lesson?section=assessment" },
  { label: "Simplify or rephrase content", icon: SquarePen, color: "#6338f5", href: "/lesson?section=procedures" },
  { label: "Differentiate instruction", icon: UsersRound, color: "#10a66a", href: "/lesson?section=pedagogy" },
];

function AssistantPanel() {
  return <aside className="assistant panel"><div className="assistant-title"><h2>Lesson Assistant</h2><span>Beta</span></div><p>Choose a saved lesson, then open the relevant editor tool.</p><div className="assistant-actions">{assistantActions.map(({ label, icon: Icon, color, href }) => <Link href={href} key={label}><Icon aria-hidden="true" size={16} color={color} />{label}</Link>)}</div><Link className="ask-button" href="/help?category=lesson-workflow"><MessageCircleMore aria-hidden="true" size={18} /><span>See assistant guidance</span><ArrowRight aria-hidden="true" size={17} /></Link></aside>;
}

type DashboardShellProps = {
  children?: ReactNode;
  currentPath?: string;
  profile?: HeaderTeacherProfile;
};

const FALLBACK_PROFILE: HeaderTeacherProfile = {
  displayName: "Teacher",
  schoolName: null,
  roleTitle: "Teacher",
  schoolLogoPath: null,
  updatedAt: "",
};

export function DashboardShell({ children, currentPath = "/dashboard", profile = FALLBACK_PROFILE }: DashboardShellProps) {
  const firstName = profile.displayName.split(/\s+/).find(Boolean) || "Teacher";
  return (
    <div className="dashboard-shell">
      <DashboardHeader key={profile.updatedAt} mobileNavigation={<SidebarNavigation currentPath={currentPath} />} profile={profile} />
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
                    <h1>Good morning, {firstName}! <Hand aria-hidden="true" /></h1>
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
              <DashboardSchedule />
            </div>
          </>
        )}
      </DashboardContent>
    </div>
  );
}
