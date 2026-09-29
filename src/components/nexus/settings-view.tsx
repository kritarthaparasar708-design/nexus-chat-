import { useState } from "react";
import {
  Bell,
  Check,
  ChevronRight,
  CircleHelp,
  Database,
  LockKeyhole,
  Moon,
  Palette,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Sun,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppShell } from "./app-shell";
import { useNexus } from "./state";
import { Avatar, Modal } from "./primitives";

function SettingRow({
  icon,
  title,
  description,
  children,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-foreground">{title}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
      </span>
      {children ?? <ChevronRight className="size-4 text-muted-foreground" />}
    </>
  );
  const className =
    "flex w-full items-center gap-3 rounded-2xl border border-border bg-secondary/30 px-4 py-3 text-left transition-colors hover:bg-secondary/60";

  if (onClick && !children) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        "relative h-6 w-11 rounded-full p-1 transition-colors",
        checked ? "bg-primary" : "bg-secondary",
      )}
    >
      <span
        className={cn(
          "block size-4 rounded-full bg-white shadow transition-transform",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
}

export function SettingsView() {
  const { state, actions } = useNexus();
  const [resetOpen, setResetOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  return (
    <AppShell title="Settings" subtitle="Tune your Nexus Chat experience.">
      <div className="nexus-settings-grid">
        <section className="space-y-4">
          <div className="nexus-panel p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <Avatar
                src={state.currentUser.avatar}
                initials={state.currentUser.initials}
                name={state.currentUser.name}
                size="md"
                status="online"
              />
              <div>
                <h2 className="text-sm font-semibold text-foreground">{state.currentUser.name}</h2>
                <p className="text-xs text-muted-foreground">{state.currentUser.username}</p>
              </div>
            </div>
          </div>
          <div className="nexus-panel space-y-2 p-3 sm:p-4">
            <p className="nexus-list-label px-1">Appearance</p>
            <SettingRow
              icon={
                state.settings.theme === "dark" ? (
                  <Moon className="size-4" />
                ) : (
                  <Sun className="size-4" />
                )
              }
              title="Theme"
              description={
                state.settings.theme === "dark" ? "Dark violet workspace" : "Light violet workspace"
              }
            >
              <span className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Use dark theme"
                  className={cn(
                    "grid size-7 place-items-center rounded-lg",
                    state.settings.theme === "dark"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground",
                  )}
                  onClick={(event) => {
                    event.stopPropagation();
                    actions.setSettings({ theme: "dark" });
                  }}
                >
                  <Moon className="size-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Use light theme"
                  className={cn(
                    "grid size-7 place-items-center rounded-lg",
                    state.settings.theme === "light"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground",
                  )}
                  onClick={(event) => {
                    event.stopPropagation();
                    actions.setSettings({ theme: "light" });
                  }}
                >
                  <Sun className="size-3.5" />
                </button>
              </span>
            </SettingRow>
            <SettingRow
              icon={<Palette className="size-4" />}
              title="Compact mode"
              description="Fit a little more into your inbox"
            >
              <Toggle
                checked={state.settings.compactMode}
                label="Compact mode"
                onChange={() => actions.setSettings({ compactMode: !state.settings.compactMode })}
              />
            </SettingRow>
          </div>
          <div className="nexus-panel space-y-2 p-3 sm:p-4">
            <p className="nexus-list-label px-1">Notifications & privacy</p>
            <SettingRow
              icon={<Bell className="size-4" />}
              title="Notifications"
              description="Allow message and friend alerts"
            >
              <Toggle
                checked={state.settings.notifications}
                label="Notifications"
                onChange={() =>
                  actions.setSettings({ notifications: !state.settings.notifications })
                }
              />
            </SettingRow>
            <SettingRow
              icon={<Volume2 className="size-4" />}
              title="Sounds"
              description="Play subtle interaction sounds"
            >
              <Toggle
                checked={state.settings.sounds}
                label="Sounds"
                onChange={() => actions.setSettings({ sounds: !state.settings.sounds })}
              />
            </SettingRow>
            <SettingRow
              icon={<ShieldCheck className="size-4" />}
              title="Read receipts"
              description="Show when messages have been read"
            >
              <Toggle
                checked={state.settings.readReceipts}
                label="Read receipts"
                onChange={() => actions.setSettings({ readReceipts: !state.settings.readReceipts })}
              />
            </SettingRow>
            <SettingRow
              icon={<LockKeyhole className="size-4" />}
              title="Online status"
              description="Let friends see when you are active"
            >
              <Toggle
                checked={state.settings.onlineStatus}
                label="Online status"
                onChange={() => actions.setSettings({ onlineStatus: !state.settings.onlineStatus })}
              />
            </SettingRow>
          </div>
        </section>
        <aside className="space-y-4">
          <div className="nexus-panel p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-primary/12 text-primary">
                <Sparkles className="size-5" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Demo workspace</h2>
                <p className="text-xs text-muted-foreground">Local state is enabled</p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              This preview keeps messages, profile edits, friends, settings, and auth session data
              in your browser. It does not provide real encryption, identity verification, or
              network messaging.
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/8 px-3 py-2 text-[11px] text-emerald-300">
              <Check className="size-3.5" /> Device persistence active
            </div>
          </div>
          <div className="nexus-panel space-y-2 p-4">
            <SettingRow
              icon={<Database className="size-4" />}
              title="Reset demo data"
              description="Restore the reference workspace"
              onClick={() => setResetOpen(true)}
            />
            <SettingRow
              icon={<CircleHelp className="size-4" />}
              title="Help & support"
              description="Read about the local preview"
              onClick={() => setHelpOpen(true)}
            />
          </div>
        </aside>
      </div>
      {resetOpen && (
        <Modal
          title="Reset demo workspace"
          description="This clears local changes and restores the seeded Nexus Chat experience."
          onClose={() => setResetOpen(false)}
        >
          <div className="flex gap-2">
            <button
              type="button"
              className="nexus-secondary-button flex-1"
              onClick={() => setResetOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="nexus-primary-button flex-1"
              onClick={() => {
                actions.resetDemo();
                setResetOpen(false);
              }}
            >
              <RotateCcw className="size-4" /> Reset data
            </button>
          </div>
        </Modal>
      )}
      {helpOpen && (
        <Modal
          title="About this preview"
          description="Nexus Chat is running as a local-first frontend demo."
          onClose={() => setHelpOpen(false)}
        >
          <div className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>
              Your messages, profile edits, settings, friends, and demo session are persisted in
              this browser only.
            </p>
            <p>
              Production identity, encryption, cloud sync, notifications, and real-time calls still
              require a backend service.
            </p>
          </div>
          <button
            type="button"
            className="nexus-primary-button mt-5 w-full"
            onClick={() => setHelpOpen(false)}
          >
            Got it
          </button>
        </Modal>
      )}
    </AppShell>
  );
}
