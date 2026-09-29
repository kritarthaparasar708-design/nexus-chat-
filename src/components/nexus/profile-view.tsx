import { useEffect, useState, type ChangeEvent } from "react";
import {
  Camera,
  Copy,
  Edit3,
  Globe2,
  ImagePlus,
  Link2,
  Mail,
  MapPin,
  Phone,
  Share2,
  UserRound,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppShell } from "./app-shell";
import { useNexus } from "./state";
import { Avatar, IconButton, Modal } from "./primitives";
import type { User } from "./types";

function EditProfileModal({ user, onClose }: { user: User; onClose: () => void }) {
  const { actions } = useNexus();
  const [form, setForm] = useState(user);
  const [saved, setSaved] = useState(false);
  function update(field: keyof User, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }
  function handleAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") update("avatar", reader.result);
    };
    reader.readAsDataURL(file);
  }
  function save() {
    actions.updateProfile(form);
    setSaved(true);
  }
  return (
    <Modal
      title="Edit profile"
      description="Your changes are saved to this device."
      onClose={onClose}
      wide
    >
      {saved ? (
        <div className="py-6 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-400/12 text-emerald-300">
            <UserRound className="size-5" />
          </span>
          <h3 className="mt-3 text-sm font-semibold text-foreground">Profile updated</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Your Nexus identity is ready to share.
          </p>
          <button type="button" onClick={onClose} className="nexus-primary-button mt-5">
            Done
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar src={form.avatar} initials={form.initials} name={form.name} size="lg" />
            <label className="nexus-secondary-button cursor-pointer">
              <ImagePlus className="size-4" /> Choose image
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="nexus-form-label">
              Display name
              <input
                className="nexus-input"
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
              />
            </label>
            <label className="nexus-form-label">
              Username
              <input
                className="nexus-input"
                value={form.username}
                onChange={(event) => update("username", event.target.value)}
              />
            </label>
            <label className="nexus-form-label sm:col-span-2">
              Bio
              <textarea
                className="nexus-textarea"
                rows={3}
                value={form.bio}
                onChange={(event) => update("bio", event.target.value)}
              />
            </label>
            <label className="nexus-form-label">
              Phone
              <input
                className="nexus-input"
                value={form.phone}
                onChange={(event) => update("phone", event.target.value)}
              />
            </label>
            <label className="nexus-form-label">
              Email
              <input
                className="nexus-input"
                type="email"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
              />
            </label>
            <label className="nexus-form-label">
              Website
              <input
                className="nexus-input"
                value={form.website}
                onChange={(event) => update("website", event.target.value)}
              />
            </label>
            <label className="nexus-form-label">
              Location
              <input
                className="nexus-input"
                value={form.location}
                onChange={(event) => update("location", event.target.value)}
              />
            </label>
          </div>
          <button type="button" onClick={save} className="nexus-primary-button w-full">
            <CheckIcon /> Save changes
          </button>
        </div>
      )}
    </Modal>
  );
}

function CheckIcon() {
  return <span aria-hidden="true">✓</span>;
}

export function ProfileView() {
  const { state } = useNexus();
  const [editOpen, setEditOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const user = state.currentUser;
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 2200);
    return () => window.clearTimeout(timeout);
  }, [notice]);
  async function share() {
    try {
      await navigator.clipboard?.writeText(`https://nexus.chat/${user.username.replace("@", "")}`);
      setNotice("Profile link copied.");
    } catch {
      setNotice("Profile link ready to share.");
    }
  }
  return (
    <AppShell title="Profile" subtitle="Make your identity feel like home.">
      <div className="nexus-profile-wrap">
        <section className="nexus-panel overflow-hidden">
          <div className="nexus-profile-cover">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(168,85,247,.45),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(79,70,229,.38),transparent_35%)]" />
            <span className="absolute right-5 bottom-4 rounded-full border border-white/15 bg-black/20 px-3 py-1 text-[10px] text-white/70">
              Nexus identity
            </span>
          </div>
          <div className="relative px-5 pb-6 sm:px-8">
            <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
              <Avatar
                src={user.avatar}
                initials={user.initials}
                name={user.name}
                size="xl"
                status={user.status}
                className="ring-4 ring-card"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  className="nexus-secondary-button"
                  onClick={() => setEditOpen(true)}
                >
                  <Edit3 className="size-4" /> Edit profile
                </button>
                <button
                  type="button"
                  className="nexus-icon-button"
                  aria-label="Share profile"
                  onClick={share}
                >
                  <Share2 className="size-4" />
                </button>
              </div>
            </div>
            <div className="mt-4">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">{user.name}</h2>
              <p className="mt-1 text-sm text-primary">{user.username}</p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{user.bio}</p>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2 border-y border-border py-4 text-center">
              <Metric value="12" label="Friends" icon={<UsersRound className="size-3.5" />} />
              <Metric value="8" label="Groups" icon={<HashIcon />} />
              <Metric value="34" label="Media" icon={<ImagePlus className="size-3.5" />} />
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <InfoRow icon={<Phone className="size-4" />} label="Phone" value={user.phone} />
              <InfoRow icon={<Mail className="size-4" />} label="Email" value={user.email} />
              <InfoRow icon={<Globe2 className="size-4" />} label="Website" value={user.website} />
              <InfoRow
                icon={<MapPin className="size-4" />}
                label="Location"
                value={user.location}
              />
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="grid size-7 place-items-center rounded-lg bg-secondary">
                <UserRound className="size-3.5" />
              </span>
              Joined {user.joinedAt}
            </div>
          </div>
        </section>
        <aside className="space-y-4">
          <div className="nexus-panel p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Links</h3>
              <Link2 className="size-4 text-primary" />
            </div>
            <a
              className="mt-4 flex items-center gap-3 rounded-xl border border-border p-3 text-xs text-muted-foreground hover:bg-secondary/60"
              href={`https://${user.website}`}
              target="_blank"
              rel="noreferrer"
            >
              <Globe2 className="size-4 text-primary" />
              {user.website}
              <ArrowIcon />
            </a>
            <button
              type="button"
              onClick={share}
              className="mt-2 flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left text-xs text-muted-foreground hover:bg-secondary/60"
            >
              <Copy className="size-4 text-primary" />
              Copy profile link
              <ArrowIcon />
            </button>
          </div>
          <div className="nexus-panel p-5">
            <h3 className="text-sm font-semibold text-foreground">About this demo</h3>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Profile edits and image previews are persisted locally. Connect a profile service for
              production accounts.
            </p>
          </div>
        </aside>
      </div>
      {notice && <div className="nexus-toast">{notice}</div>}
      {editOpen && <EditProfileModal user={user} onClose={() => setEditOpen(false)} />}
    </AppShell>
  );
}

function Metric({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-center gap-1 text-lg font-semibold text-foreground">
        {value}
      </div>
      <div className="mt-1 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
        {icon}
        {label}
      </div>
    </div>
  );
}
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/35 px-3 py-3">
      <span className="text-primary">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[10px] text-muted-foreground">{label}</span>
        <span className="block truncate text-xs font-medium text-foreground">{value}</span>
      </span>
    </div>
  );
}
function HashIcon() {
  return <span className="text-xs font-semibold">#</span>;
}
function ArrowIcon() {
  return <span className="ml-auto text-primary">↗</span>;
}
