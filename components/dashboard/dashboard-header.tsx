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
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

type DashboardHeaderProps = {
  mobileNavigation: ReactNode;
};

const profileActions = [
  { label: "School & Profile", icon: UserRound },
  { label: "Preferences", icon: Settings },
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
    <label className="searchbox">
      <Search aria-hidden="true" size={21} strokeWidth={1.8} />
      <input
        ref={inputRef}
        aria-label="Search lessons, templates, and resources"
        autoComplete="off"
        placeholder="Search lessons, templates, resources..."
        type="search"
      />
      <kbd aria-hidden="true">⌘ K</kbd>
    </label>
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

function ProfileMenu() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="profile" type="button" aria-label="Open profile menu">
          <Image className="avatar" src="/avatar.png" alt="" width={42} height={42} priority />
          <span className="profile-copy">
            <strong>Ma. Victoria O.</strong>
            <span>Teacher</span>
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
            <strong>Ma. Victoria O.</strong>
            <span>Teacher</span>
          </DropdownMenu.Label>
          <DropdownMenu.Separator className="header-menu-separator" />
          {profileActions.map(({ label, icon: Icon }) => (
            <DropdownMenu.Item className="header-menu-item" key={label}>
              <Icon aria-hidden="true" size={14} strokeWidth={1.8} />
              {label}
            </DropdownMenu.Item>
          ))}
          <DropdownMenu.Separator className="header-menu-separator" />
          <DropdownMenu.Item className="header-menu-item muted-action">
            <LogOut aria-hidden="true" size={14} strokeWidth={1.8} />
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function DashboardHeader({ mobileNavigation }: DashboardHeaderProps) {
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
        <NotificationsMenu />
        <ProfileMenu />
      </div>
    </header>
  );
}
