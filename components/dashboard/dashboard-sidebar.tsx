import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CircleHelp,
  ClipboardCheck,
  FileCheck2,
  FilePlus2,
  Files,
  FolderOpen,
  GraduationCap,
  House,
  PanelsTopLeft,
  Presentation,
  Settings,
  Target,
  LibraryBig,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { SidebarActiveIndicator } from "./dashboard-motion";

type SidebarItem = {
  label: string;
  icon: LucideIcon;
  href: string;
  active?: boolean;
  accent?: string;
};

type SidebarSection = {
  label?: string;
  items: SidebarItem[];
};

export function getSidebarSections(currentPath: string = "/dashboard"): SidebarSection[] {
  return [
    {
      items: [
        {
          label: "Dashboard",
          icon: House,
          href: "/dashboard",
          active: currentPath === "/dashboard",
        },
      ],
    },
    {
      label: "CREATE",
      items: [
        {
          label: "New Lesson Plan",
          icon: FilePlus2,
          accent: "#5736f5",
          href: "/lesson/create",
          active: currentPath.startsWith("/lesson/create"),
        },
        { label: "Presentation Maker", icon: Presentation, accent: "#ff4f7b", href: "/presentations", active: currentPath.startsWith("/presentations") },
        { label: "Assessment Builder", icon: ClipboardCheck, accent: "#18c87a", href: "/assessments", active: currentPath.startsWith("/assessments") },
        { label: "Worksheet Generator", icon: FileCheck2, accent: "#ff9f1c", href: "/worksheets", active: currentPath.startsWith("/worksheets") },
        { label: "Rubric Builder", icon: Target, accent: "#9a71f7", href: "/rubrics", active: currentPath.startsWith("/rubrics") },
      ],
    },
    {
      label: "MANAGE",
      items: [
        { label: "My Lesson Plans", icon: Files, href: "/lesson", active: currentPath === "/lesson" || /^\/lesson\/[^/]+$/.test(currentPath) },
        {
          label: "Templates",
          icon: FolderOpen,
          href: "/templates",
          active: currentPath.startsWith("/templates"),
        },
        {
          label: "Curriculum",
          icon: LibraryBig,
          href: "/curriculum",
          active: currentPath.startsWith("/curriculum"),
        },
        {
          label: "Resources",
          icon: BookOpen,
          href: "/resources",
          active: currentPath.startsWith("/resources"),
        },
        {
          label: "Calendar",
          icon: CalendarDays,
          href: "/calendar",
          active: currentPath.startsWith("/calendar"),
        },
      ],
    },
    {
      label: "SETTINGS",
      items: [
        {
          label: "School & Profile",
          icon: GraduationCap,
          href: "/settings/profile",
          active: currentPath.startsWith("/settings/profile"),
        },
        {
          label: "Classroom Context",
          icon: Settings,
          href: "/settings/classroom-context",
          active: currentPath.startsWith("/settings/classroom-context"),
        },
        {
          label: "Preferences",
          icon: Settings,
          href: "/settings/preferences",
          active: currentPath.startsWith("/settings/preferences"),
        },
        { label: "Help Center", icon: CircleHelp, href: "/help", active: currentPath.startsWith("/help") },
      ],
    },
  ];
}

function NavigationItem({ item }: { item: SidebarItem }) {
  const Icon = item.icon;
  const className = `sidebar-item${item.active ? " active" : ""}`;
  const content = (
    <>
      {item.active ? <SidebarActiveIndicator /> : null}
      <span
        className={`sidebar-icon${item.accent ? " accent" : ""}`}
        style={item.accent ? { backgroundColor: item.accent } : undefined}
      >
        <Icon
          aria-hidden="true"
          size={item.accent ? 14 : 19}
          strokeWidth={1.9}
        />
      </span>
      <span className="sidebar-item-label">{item.label}</span>
    </>
  );

  return (
    <Link
      aria-current={item.active ? "page" : undefined}
      className={className}
      href={item.href}
    >
      {content}
    </Link>
  );
}

export function SidebarNavigation({ currentPath = "/dashboard" }: { currentPath?: string }) {
  const sections = getSidebarSections(currentPath);

  return (
    <nav aria-label="Dashboard navigation">
      {sections.map((section) => (
        <div
          className={section.label ? "sidebar-group" : "sidebar-home"}
          key={section.label ?? "home"}
        >
          {section.label ? <p className="sidebar-label">{section.label}</p> : null}
          <div className="sidebar-links">
            {section.items.map((item) => <NavigationItem item={item} key={item.label} />)}
          </div>
        </div>
      ))}
    </nav>
  );
}

function TemplatePromotion() {
  return (
    <div className="template-promo">
      <div className="promo-copy">
        <strong>Save even more time</strong>
        <p>Use templates to create consistent, quality lesson plans in seconds.</p>
      </div>
      <div className="promo-art" aria-hidden="true">
        <PanelsTopLeft size={54} strokeWidth={1.25} />
      </div>
      <Link href="/templates">
        Explore Templates <ArrowRight aria-hidden="true" size={16} />
      </Link>
    </div>
  );
}

export function DashboardSidebar({ currentPath = "/dashboard" }: { currentPath?: string }) {
  return (
    <aside className="sidebar">
      <SidebarNavigation currentPath={currentPath} />
      <TemplatePromotion />
    </aside>
  );
}
