"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Bell,
  BookOpen,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  Settings,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { signOutAction } from "@/app/auth/actions";
import type { HeaderTeacherProfile } from "@/schemas/profile";

type DashboardHeaderProps = {
  mobileNavigation: ReactNode;
  profile: HeaderTeacherProfile;
};

const profileActions = [
  { label: "School & Profile", icon: UserRound, href: "/settings/profile" },
  { label: "Preferences", icon: Settings, href: "/settings/preferences" },
] as const;

function Brand() {
  return (
    <div className="brand">
      <BookOpen aria-hidden="true" className="brand-mark" strokeWidth={1.8} />
      <div>
        <div className="brand-name">AralAI</div>
        <div className="brand-subtitle">Lesson Planning Assistant</div>
      </div>
    </div>
  );
}

function SearchControl() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }

    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  return (
    <form action="/search" className="searchbox" method="get">
      <Search aria-hidden="true" size={21} strokeWidth={1.8} />
      <input ref={inputRef} aria-label="Search lessons, templates, and resources" autoComplete="off" name="q" placeholder="Search lessons, templates, resources..." type="search" />
      <kbd aria-hidden="true">⌘ K</kbd>
    </form>
  );
}

function NotificationsMenu() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="notification-button" type="button" aria-label="Notifications">
          <Bell aria-hidden="true" size={20} strokeWidth={1.85} />
          <span className="notification-dot" aria-hidden="true" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          className="header-menu-content notification-menu-content"
          collisionPadding={12}
          sideOffset={10}
        >
          <DropdownMenu.Label className="header-menu-label">Notifications</DropdownMenu.Label>
          <div className="notification-empty">
            <span className="notification-empty-icon"><Bell aria-hidden="true" size={17} /></span>
            <div><strong>You&apos;re all caught up</strong><span>No new notifications right now.</span></div>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function ProfileAvatar({ profile }: { profile: HeaderTeacherProfile }) {
  const [imageFailed, setImageFailed] = useState(false);
  const initials = profile.displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "T";

  if (profile.schoolLogoPath && !imageFailed) {
    return (
      <Image
        alt={`${profile.schoolName || "School"} logo`}
        className="avatar"
        height={42}
        onError={() => setImageFailed(true)}
        priority
        src={`/api/profile/logo?v=${encodeURIComponent(profile.updatedAt)}`}
        unoptimized
        width={42}
      />
    );
  }
  return <span aria-hidden="true" className="avatar avatar-initials">{initials}</span>;
}

function ProfileMenu({ profile }: { profile: HeaderTeacherProfile }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="profile" type="button" aria-label="Open profile menu">
          <ProfileAvatar profile={profile} />
          <span className="profile-copy">
            <strong>{profile.displayName}</strong>
            <span>{profile.roleTitle}</span>
          </span>
          <ChevronDown className="profile-chevron" aria-hidden="true" size={17} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          className="header-menu-content profile-menu-content"
          collisionPadding={12}
          sideOffset={10}
        >
          <DropdownMenu.Label className="profile-menu-identity">
            <strong>{profile.displayName}</strong>
            <span>{profile.schoolName || profile.roleTitle}</span>
          </DropdownMenu.Label>
          <DropdownMenu.Separator className="header-menu-separator" />
          {profileActions.map(({ label, icon: Icon, href }) => (
            <DropdownMenu.Item asChild key={label}>
              <Link className="header-menu-item" href={href}>
                <Icon aria-hidden="true" size={14} strokeWidth={1.8} />
                {label}
              </Link>
            </DropdownMenu.Item>
          ))}
          <DropdownMenu.Separator className="header-menu-separator" />
          <form action={signOutAction}>
            <DropdownMenu.Item asChild>
              <button className="header-menu-item muted-action profile-sign-out" type="submit">
                <LogOut aria-hidden="true" size={14} strokeWidth={1.8} />
                Sign out
              </button>
            </DropdownMenu.Item>
          </form>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function DashboardHeader({ mobileNavigation, profile }: DashboardHeaderProps) {
  const [currentProfile, setCurrentProfile] = useState(profile);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/profile", { signal: controller.signal, credentials: "same-origin" })
      .then(async (response) => {
        if (!response.ok) return null;
        const payload = await response.json();
        return payload?.data as HeaderTeacherProfile | undefined;
      })
      .then((nextProfile) => {
        if (nextProfile) setCurrentProfile(nextProfile);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          // The shell keeps its safe teacher fallback when profile loading fails.
        }
      });
    return () => controller.abort();
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-brand"><Brand /></div>
      <div className="program-pill">MATATAG + ILAW</div>
      <details className="mobile-menu">
        <summary aria-label="Open navigation"><Menu aria-hidden="true" size={21} /></summary>
        <div className="mobile-menu-panel">{mobileNavigation}</div>
      </details>
      <div className="topbar-actions">
        <SearchControl />
        <Link aria-label="Search workspace" className="mobile-search-link" href="/search"><Search aria-hidden="true" /></Link>
        <NotificationsMenu />
        <ProfileMenu profile={currentProfile} />
      </div>
    </header>
  );
}
