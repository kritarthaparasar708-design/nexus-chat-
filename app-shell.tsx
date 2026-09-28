import { Link, useLocation } from "@tanstack/react-router";
import {
  Bell,
  Compass,
  Hexagon,
  MessageCircle,
  Search,
  Settings,
  UserRound,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, type ReactNode } from "react";
import { useNexus } from "./state";
import { Avatar, BrandMark, IconButton } from "./primitives";
import { NotificationCenter } from "./notification-center";

type NavItem = {
  to: "/messages" | "/search" | "/friends" | "/profile" | "/settings";
  label: string;
  icon: typeof MessageCircle;
};

const navItems: NavItem[] = [
  { to: "/messages", label: "Messages", icon: MessageCircle },
  { to: "/search", label: "Search", icon: Search },
  { to: "/friends", label: "Friends", icon: UsersRound },
  { to: "/profile", label: "Profile", icon: UserRound },
  { to: "/settings", label: "Settings", icon: Settings },
];

function NavLink({
  item,
  active,
  compact = false,
}: {
  item: NavItem;
  active: boolean;
  compact?: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      aria-current={active ? "page" : undefined}
      className={cn(
        "nexus-nav-link",
        active && "nexus-nav-link-active",
        compact && "justify-center px-2",
      )}
      title={compact ? item.label : undefined}
    >
      <Icon className="size-[18px] shrink-0" />
      <span className={cn(compact && "hidden xl:inline")}>{item.label}</span>
    </Link>
  );
}

export function AppShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}) {
  const location = useLocation();
  const { state, unreadNotifications } = useNexus();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const currentPath = location.pathname;

  return (
    <div className="nexus-app min-h-[100dvh]">
      <aside className="nexus-sidebar">
        <div className="px-3 py-5 xl:px-5">
          <Link to="/messages" aria-label="Nexus Chat messages" className="block">
            <BrandMark className="xl:hidden" compact />
            <BrandMark className="hidden xl:flex" />
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3 xl:px-4" aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink key={item.to} item={item} active={currentPath.startsWith(item.to)} compact />
          ))}
          <div className="my-3 h-px bg-border" />
          <button
            type="button"
            onClick={() => setNotificationsOpen((open) => !open)}
            className={cn(
              "nexus-nav-link relative",
              notificationsOpen && "nexus-nav-link-active",
              "justify-center px-2 xl:justify-start xl:px-4",
            )}
            title="Notifications"
          >
            <Bell className="size-[18px] shrink-0" />
            <span className="hidden xl:inline">Notifications</span>
            {unreadNotifications > 0 && (
              <span className="nexus-count-badge absolute top-1 right-2 xl:right-3">
                {unreadNotifications}
              </span>
            )}
          </button>
        </nav>
        <div className="mt-auto border-t border-border p-3 xl:p-4">
          <Link
            to="/profile"
            className="flex items-center justify-center gap-3 rounded-2xl p-2 transition-colors hover:bg-secondary/70 xl:justify-start"
          >
            <Avatar
              src={state.currentUser.avatar}
              initials={state.currentUser.initials}
              name={state.currentUser.name}
              size="sm"
              status="online"
            />
            <span className="hidden min-w-0 xl:block">
              <span className="block truncate text-xs font-semibold text-foreground">
                {state.currentUser.name}
              </span>
              <span className="block truncate text-[10px] text-muted-foreground">
                {state.currentUser.username}
              </span>
            </span>
          </Link>
        </div>
      </aside>

      <div className="nexus-content min-h-[100dvh]">
        <header className="nexus-mobile-header">
          <Link to="/messages" aria-label="Go to messages">
            <BrandMark compact />
          </Link>
          <div className="flex items-center gap-2">
            {title && (
              <span className="hidden text-sm font-semibold text-foreground sm:inline">
                {title}
              </span>
            )}
            <button
              type="button"
              className="nexus-notification-trigger"
              aria-label="Open notifications"
              onClick={() => setNotificationsOpen((open) => !open)}
            >
              <Bell className="size-[18px]" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-primary ring-2 ring-background" />
              )}
            </button>
          </div>
        </header>
        {title && (
          <div className="hidden items-center justify-between px-5 pt-5 lg:flex xl:px-8">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
              {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className="nexus-demo-pill">
                <span className="size-1.5 rounded-full bg-emerald-400" /> Demo workspace
              </span>
              <IconButton
                label="Open notifications"
                onClick={() => setNotificationsOpen((open) => !open)}
                active={notificationsOpen}
              >
                <Bell className="size-4" />
              </IconButton>
            </div>
          </div>
        )}
        <main className="nexus-main">{children}</main>
      </div>

      <nav className="nexus-bottom-nav" aria-label="Mobile navigation">
        {navItems.slice(0, 4).map((item) => (
          <NavLink key={item.to} item={item} active={currentPath.startsWith(item.to)} />
        ))}
      </nav>

      {notificationsOpen && <NotificationCenter onClose={() => setNotificationsOpen(false)} />}
    </div>
  );
}

export function NexusMarkOnly() {
  return (
    <span className="nexus-mark">
      <Hexagon className="size-5 fill-current" />
    </span>
  );
}

export function ExploreLink() {
  return (
    <Link to="/search" className="nexus-text-button inline-flex items-center gap-2">
      <Compass className="size-4" /> Explore
    </Link>
  );
}
