import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { ArrowLeft, Camera, LoaderCircle, MessageCircle, Save, UserRound } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { AppShell } from "./app-shell";
import { useNexus } from "./state";
import { Avatar, Modal } from "./primitives";
import type { User } from "./types";

function ProfileFields({ user, setup = false, onClose }: { user: User | null; setup?: boolean; onClose?: () => void }) {
  const { actions } = useNexus();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(user?.name ?? "");
  const [username, setUsername] = useState(user?.username.replace(/^@/, "") ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [avatar, setAvatar] = useState(user?.avatar ?? "");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function selectAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      setAvatar(await actions.uploadAvatar(file));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to upload this profile picture.");
    } finally {
      setUploading(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const cleanName = displayName.trim();
    const cleanUsername = username.trim().replace(/^@/, "");
    if (!cleanName) return setError("Full name is required.");
    if (!/^[A-Za-z0-9_]{3,20}$/.test(cleanUsername)) {
      return setError("Username must be 3 to 20 characters using letters, numbers, or underscores.");
    }
    setSaving(true);
    try {
      await actions.saveProfile({ displayName: cleanName, username: cleanUsername, bio, avatarUrl: avatar || null });
      if (setup) await navigate({ to: "/messages", replace: true });
      else onClose?.();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save your profile.");
    } finally {
      setSaving(false);
    }
  }

  const content = (
    <form className="space-y-4" onSubmit={(event) => void save(event)}>
      <div className="flex items-center gap-4">
        <Avatar src={avatar} initials={displayName.split(/\s+/).map((part) => part[0] ?? "").join("").slice(0, 2).toUpperCase()} name={displayName || "Profile picture"} size="lg" />
        <label className="nexus-secondary-button cursor-pointer">
          {uploading ? <LoaderCircle className="size-4 animate-spin" /> : <Camera className="size-4" />}
          {uploading ? "Uploading…" : "Add photo"}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(event) => void selectAvatar(event)} disabled={uploading} />
        </label>
      </div>
      <label className="nexus-form-label">Full name<input className="nexus-input" autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={80} required /></label>
      <label className="nexus-form-label">Username<span className="relative"><span className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">@</span><input className="nexus-input pl-8" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value.replace(/^@/, ""))} minLength={3} maxLength={20} pattern="[A-Za-z0-9_]{3,20}" required /></span><span className="text-[10px] font-normal text-muted-foreground">3–20 letters, numbers, or underscores. Usernames are case-insensitively unique.</span></label>
      <label className="nexus-form-label">Bio <span className="font-normal text-muted-foreground">(optional)</span><textarea className="nexus-textarea" rows={3} maxLength={280} value={bio} onChange={(event) => setBio(event.target.value)} placeholder="A little about you" /></label>
      {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/8 px-3 py-2 text-xs text-destructive">{error}</p>}
      <button type="submit" className="nexus-primary-button w-full" disabled={saving || uploading}>{saving ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}{setup ? "Continue" : "Save changes"}</button>
    </form>
  );

  if (setup) return content;
  return <Modal title="Edit profile" description="Your public Nexus profile is visible to signed-in users." onClose={onClose ?? (() => {})}>{content}</Modal>;
}

export function ProfileView({ userId }: { userId: string | undefined }) {
  const { state, profile, profileLoading, actions } = useNexus();
  const navigate = useNavigate();
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [otherLoading, setOtherLoading] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const isOwnProfile = !profile || !userId || userId === profile.id;

  useEffect(() => {
    let active = true;
    if (isOwnProfile || !userId || !profile) {
      setOtherUser(null);
      setOtherLoading(false);
      return;
    }
    setOtherLoading(true);
    setError("");
    void actions.getProfile(userId).then((result) => {
      if (active) setOtherUser(result);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Unable to load this profile.");
    }).finally(() => {
      if (active) setOtherLoading(false);
    });
    return () => { active = false; };
  }, [actions, isOwnProfile, userId, profile]);

  async function message(user: User) {
    setError("");
    setStartingChat(true);
    try {
      const conversationId = await actions.createConversation(user);
      await navigate({ to: "/messages", search: { conversation: conversationId } });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to start this conversation.");
    } finally {
      setStartingChat(false);
    }
  }

  if (profileLoading || (userId && !isOwnProfile && otherLoading)) {
    return <AppShell title="Profile"><div className="nexus-panel p-8 text-center text-sm text-muted-foreground">Loading profile…</div></AppShell>;
  }

  if (isOwnProfile && !profile) {
    return (
      <AppShell title="Complete your profile" subtitle="Set up the name and username other people will see.">
        <div className="mx-auto max-w-xl"><section className="nexus-panel p-5 sm:p-7"><div className="mb-5 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-primary/12 text-primary"><UserRound className="size-5" /></span><div><h2 className="text-base font-semibold text-foreground">Complete your profile</h2><p className="text-xs text-muted-foreground">Full name and unique username are required.</p></div></div><ProfileFields user={null} setup /></section></div>
      </AppShell>
    );
  }

  if (!isOwnProfile) {
    if (!otherUser) return <AppShell title="Profile"><div className="nexus-panel p-8 text-center"><p className="text-sm text-muted-foreground">{error || "This profile could not be found."}</p><button type="button" className="nexus-secondary-button mt-4" onClick={() => void navigate({ to: "/search" })}><ArrowLeft className="size-4" /> Back to search</button></div></AppShell>;
    return (
      <AppShell title="Profile" subtitle="Public profile">
        <section className="nexus-panel mx-auto max-w-2xl p-6 sm:p-8">
          <div className="flex flex-col items-center text-center">
            <Avatar src={otherUser.avatar} initials={otherUser.initials} name={otherUser.name} size="xl" />
            <h2 className="mt-4 text-xl font-semibold text-foreground">{otherUser.name}</h2>
            <p className="mt-1 text-sm text-primary">{otherUser.username}</p>
            {otherUser.bio && <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">{otherUser.bio}</p>}
            {error && <p role="alert" className="mt-4 text-xs text-destructive">{error}</p>}
            <button type="button" className="nexus-primary-button mt-6" disabled={startingChat} onClick={() => void message(otherUser)}>{startingChat ? <LoaderCircle className="size-4 animate-spin" /> : <MessageCircle className="size-4" />} Message</button>
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell title="Profile" subtitle="Manage the public details people see when they find you.">
      <section className="nexus-panel mx-auto max-w-3xl overflow-hidden">
        <div className="h-28 bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,.35),transparent_55%),linear-gradient(120deg,rgba(70,40,110,.35),rgba(15,12,26,.7))]" />
        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-12 flex items-end justify-between gap-3">
            <Avatar src={state.currentUser.avatar} initials={state.currentUser.initials} name={state.currentUser.name} size="xl" />
            <button type="button" className="nexus-secondary-button" onClick={() => setEditing(true)}><Camera className="size-4" /> Edit profile</button>
          </div>
          <h2 className="mt-4 text-xl font-semibold text-foreground">{state.currentUser.name}</h2>
          <p className="mt-1 text-sm text-primary">{state.currentUser.username}</p>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{state.currentUser.bio || "No bio added yet."}</p>
          <div className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">Your email and phone number are private and are not shown on your profile.</div>
        </div>
      </section>
      {editing && <ProfileFields user={state.currentUser} onClose={() => setEditing(false)} />}
    </AppShell>
  );
}
