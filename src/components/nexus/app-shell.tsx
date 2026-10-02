import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Compass,
  Hexagon,
  LogOut,
  MessageCircle,
  Search,
  Settings,
  UserRound,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState, type ReactNode } from "react";
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

function NavLink({ item, active, compact = false }: { item: NavItem; active: boolean; compact?: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      aria-current={active ? "page" : undefined}
      className={cn("nexus-nav-link", active && "nexus-nav-link-active", compact && "justify-center px-2")}
      title={compact ? item.label : undefined}
    >
      <Icon className="size-[18px] shrink-0" />
      <span className={cn(compact && "hidden xl:inline")}>{item.label}</span>
    </Link>
  );
}

function AppLoading({ message }: { message: string }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-5">
      <div className="text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-primary/30 bg-primary/12 text-primary">
          <Hexagon className="size-6 fill-current" />
        </span>
        <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

export function AppShell({ children, title, subtitle }: { children: ReactNode; title?: string; subtitle?: string }) {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    state,
    unreadNotifications,
    actions,
    authConfigured,
    authLoading,
    authUser,
    profile,
    profileLoading,
    profileError,
  } = useNexus();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const currentPath = location.pathname;
  const emailVerified = Boolean(authUser?.email_confirmed_at || authUser?.confirmed_at);
  const phoneVerified = Boolean(authUser?.phone && authUser.phone_confirmed_at);
  const accountVerified = emailVerified && phoneVerified;

  useEffect(() => {
    if (!authLoading && authConfigured && !authUser) void navigate({ to: "/login", replace: true });
  }, [authLoading, authConfigured, authUser, navigate]);
  useEffect(() => {
    if (!authLoading && authUser && !accountVerified && currentPath !== "/verify") {
      void navigate({ to: "/verify", replace: true });
    }
  }, [authLoading, authUser, accountVerified, currentPath, navigate]);
  useEffect(() => {
    if (!authLoading && authUser && accountVerified && !profileLoading && !profile && currentPath !== "/profile") {
      void navigate({ to: "/profile", replace: true });
    }
  }, [authLoading, authUser, accountVerified, profileLoading, profile, currentPath, navigate]);

  if (!authConfigured) {
    return (
      <AppLoading message="Connect Supabase by adding VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment, then reload." />
    );
  }
  if (authLoading || (authUser && profileLoading)) return <AppLoading message="Restoring your Nexus Chat session…" />;
  if (!authUser) return <AppLoading message="Redirecting to sign in…" />;
  if (!accountVerified) return <AppLoading message="Finish email and phone verification to continue…" />;
  if (profileError) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background px-5">
        <div className="nexus-panel max-w-lg p-6 text-center">
          <h1 className="text-lg font-semibold text-foreground">Unable to load your profile</h1>
          <p className="mt-2 text-sm text-muted-foreground">{profileError}</p>
          <button type="button" className="nexus-primary-button mt-5" onClick={() => window.location.reload()}>
            Try again
          </button>
        </div>
      </div>
    );
  }
  if (!profile && currentPath !== "/profile") return <AppLoading message="Taking you to profile setup…" />;

  async function logout() {
    setLogoutError("");
    try {
      await actions.signOut();
      await navigate({ to: "/login", replace: true });
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : "Unable to log out.");
    }
  }

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
          {navItems.map((item) => <NavLink key={item.to} item={item} active={currentPath.startsWith(item.to)} compact />)}
          <div className="my-3 h-px bg-border" />
          <button
            type="button"
            onClick={() => setNotificationsOpen((open) => !open)}
            className={cn("nexus-nav-link relative justify-center px-2 xl:justify-start xl:px-4", notificationsOpen && "nexus-nav-link-active")}
            title="Notifications"
          >
            <Bell className="size-[18px] shrink-0" />
            <span className="hidden xl:inline">Notifications</span>
            {unreadNotifications > 0 && <span className="nexus-count-badge absolute top-1 right-2 xl:right-3">{unreadNotifications}</span>}
          </button>
        </nav>
        <div className="mt-auto border-t border-border p-3 xl:p-4">
          <Link to="/profile" className="flex items-center justify-center gap-3 rounded-2xl p-2 transition-colors hover:bg-secondary/70 xl:justify-start">
            <Avatar src={state.currentUser.avatar} initials={state.currentUser.initials} name={state.currentUser.name} size="sm" />
            <span className="hidden min-w-0 flex-1 xl:block">
              <span className="block truncate text-xs font-semibold text-foreground">{state.currentUser.name}</span>
              <span className="block truncate text-[10px] text-muted-foreground">{state.currentUser.username}</span>
            </span>
          </Link>
          <button type="button" onClick={() => void logout()} className="nexus-nav-link mt-2 w-full justify-center px-2 xl:justify-start xl:px-4" aria-label="Log out">
            <LogOut className="size-[18px] shrink-0" />
            <span className="hidden xl:inline">Log out</span>
          </button>
          {logoutError && <p role="alert" className="mt-2 text-[10px] text-destructive">{logoutError}</p>}
        </div>
      </aside>

      <div className="nexus-content min-h-[100dvh]">
        <header className="nexus-mobile-header">
          <Link to="/messages" aria-label="Go to messages"><BrandMark compact /></Link>
          <div className="flex items-center gap-2">
            {title && <span className="hidden text-sm font-semibold text-foreground sm:inline">{title}</span>}
            <button type="button" className="nexus-notification-trigger" aria-label="Open notifications" onClick={() => setNotificationsOpen((open) => !open)}>
              <Bell className="size-[18px]" />
              {unreadNotifications > 0 && <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-primary ring-2 ring-background" />}
            </button>
          </div>
        </header>
        {title && (
          <div className="hidden items-center justify-between px-5 pt-5 lg:flex xl:px-8">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
              {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
            </div>
            <IconButton label="Open notifications" onClick={() => setNotificationsOpen((open) => !open)} active={notificationsOpen}>
              <Bell className="size-4" />
            </IconButton>
          </div>
        )}
        <main className="nexus-main">{children}</main>
      </div>

      <nav className="nexus-bottom-nav" aria-label="Mobile navigation">
        {navItems.slice(0, 4).map((item) => <NavLink key={item.to} item={item} active={currentPath.startsWith(item.to)} />)}
      </nav>
      {notificationsOpen && <NotificationCenter onClose={() => setNotificationsOpen(false)} />}
    </div>
  );
}

export function NexusMarkOnly() {
  return <span className="nexus-mark"><Hexagon className="size-5 fill-current" /></span>;
}

export function ExploreLink() {
  return <Link to="/search" className="nexus-text-button inline-flex items-center gap-2"><Compass className="size-4" /> Explore</Link>;
}
