import { Check, Moon, Sun } from "lucide-react";
import { AppShell } from "./app-shell";
import { Avatar } from "./primitives";
import { useNexus } from "./state";

export function SettingsView() {
  const { state, authUser, actions } = useNexus();
  const metadataPhone = typeof authUser?.user_metadata["signup_phone"] === "string" ? authUser.user_metadata["signup_phone"] : "";
  const phone = authUser?.phone || metadataPhone;
  const emailVerified = Boolean(authUser?.email_confirmed_at);
  const phoneVerified = Boolean(authUser?.phone_confirmed_at && authUser.phone);

  return (
    <AppShell title="Settings" subtitle="Manage your workspace and account security.">
      <div className="nexus-page-grid">
        <section className="nexus-panel p-5 sm:p-6">
          <h2 className="nexus-section-title">Appearance</h2>
          <p className="mt-1 text-xs text-muted-foreground">Theme preference is held in this browser session.</p>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => actions.setSettings({ theme: "dark" })} className={`nexus-secondary-button ${state.settings.theme === "dark" ? "border-primary/40 bg-primary/10 text-primary" : ""}`}><Moon className="size-4" /> Dark</button>
            <button type="button" onClick={() => actions.setSettings({ theme: "light" })} className={`nexus-secondary-button ${state.settings.theme === "light" ? "border-primary/40 bg-primary/10 text-primary" : ""}`}><Sun className="size-4" /> Light</button>
          </div>
        </section>
        <section className="nexus-panel p-5 sm:p-6">
          <div className="flex items-center gap-3"><Avatar src={state.currentUser.avatar} initials={state.currentUser.initials} name={state.currentUser.name} size="md" /><div><h2 className="text-sm font-semibold text-foreground">{state.currentUser.name}</h2><p className="text-xs text-primary">{state.currentUser.username}</p></div></div>
          <div className="mt-5 border-t border-border pt-4"><h3 className="text-sm font-semibold text-foreground">Sign-in and verification</h3><dl className="mt-3 space-y-3 text-xs">
            <div className="flex items-center justify-between gap-3"><dt className="text-muted-foreground">Email</dt><dd className="truncate text-right text-foreground">{authUser?.email || "Not available"}</dd></div>
            <div className="flex items-center justify-between gap-3"><dt className="text-muted-foreground">Email verification</dt><dd className={emailVerified ? "text-emerald-300" : "text-amber-300"}>{emailVerified ? "Verified" : "Pending"}</dd></div>
            <div className="flex items-center justify-between gap-3"><dt className="text-muted-foreground">Phone</dt><dd className="truncate text-right text-foreground">{phone || "Not provided"}</dd></div>
            <div className="flex items-center justify-between gap-3"><dt className="text-muted-foreground">Phone verification</dt><dd className={phoneVerified ? "text-emerald-300" : "text-muted-foreground"}>{phoneVerified ? "Verified" : "Optional"}</dd></div>
          </dl></div>
          <p className="mt-4 rounded-xl border border-border bg-secondary/40 px-3 py-2 text-[11px] leading-5 text-muted-foreground">These details are visible only to you in settings. Public search shows your name, username, bio, and optional profile picture.</p>
        </section>
        <section className="nexus-panel p-5 sm:p-6">
          <div className="flex items-start gap-3"><span className="grid size-9 place-items-center rounded-xl bg-primary/12 text-primary"><Check className="size-4" /></span><div><h2 className="text-sm font-semibold text-foreground">Notifications</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Notifications are not enabled yet. Nexus Chat will show an empty state until real notification delivery is configured.</p></div></div>
          {state.notifications.length === 0 && <p className="mt-4 text-[11px] text-muted-foreground">No notifications.</p>}
        </section>
      </div>
    </AppShell>
  );
}
