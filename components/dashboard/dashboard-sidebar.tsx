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
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { SidebarActiveIndicator } from "./dashboard-motion";

type SidebarItem = {
  label: string;
  icon: LucideIcon;
  href?: string;
  active?: boolean;
  accent?: string;
};

type SidebarSection = {
  label?: string;
  items: SidebarItem[];
};

const sidebarSections: SidebarSection[] = [
  {
    items: [
      { label: "Dashboard", icon: House, href: "/dashboard", active: true },
    ],
  },
  {
    label: "CREATE",
    items: [
      { label: "New Lesson Plan", icon: FilePlus2, accent: "#5736f5", href: "#lesson-plan-composer" },
      { label: "Presentation Maker", icon: Presentation, accent: "#ff4f7b" },
      { label: "Assessment Builder", icon: ClipboardCheck, accent: "#18c87a" },
      { label: "Worksheet Generator", icon: FileCheck2, accent: "#ff9f1c" },
      { label: "Rubric Builder", icon: Target, accent: "#9a71f7" },
    ],
  },
  {
    label: "MANAGE",
    items: [
      { label: "My Lesson Plans", icon: Files },
      { label: "Templates", icon: FolderOpen },
      { label: "Resources", icon: BookOpen },
      { label: "Calendar", icon: CalendarDays },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      { label: "School & Profile", icon: GraduationCap },
      { label: "Preferences", icon: Settings },
      { label: "Help Center", icon: CircleHelp },
    ],
  },
];

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

  if (item.href) {
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

  return <button className={className} type="button">{content}</button>;
}

export function SidebarNavigation() {
  return (
    <nav aria-label="Dashboard navigation">
      {sidebarSections.map((section) => (
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
      <button type="button">
        Explore Templates <ArrowRight aria-hidden="true" size={16} />
      </button>
    </div>
  );
}

export function DashboardSidebar() {
  return (
    <aside className="sidebar">
      <SidebarNavigation />
      <TemplatePromotion />
    </aside>
  );
}
