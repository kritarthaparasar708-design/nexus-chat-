import { useEffect, useState } from "react";
import { LoaderCircle, MessageCircle, Search, UserRound, UsersRound } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { AppShell } from "./app-shell";
import { useNexus } from "./state";
import { Avatar, EmptyState } from "./primitives";
import type { User } from "./types";

export function FriendsView() {
  const { actions, authUser, authLoading } = useNexus();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startingChat, setStartingChat] = useState<string | null>(null);

  useEffect(() => {
    if (!authUser || authLoading) {
      setLoading(true);
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    const timer = window.setTimeout(() => {
      void actions.searchUsers(query).then((results) => {
        if (active) setUsers(results);
      }).catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load registered users.");
      }).finally(() => {
        if (active) setLoading(false);
      });
    }, 150);
    return () => { active = false; window.clearTimeout(timer); };
  }, [actions, query, authUser, authLoading]);

  async function openChat(user: User) {
    setStartingChat(user.id);
    setError("");
    try {
      const conversation = await actions.createConversation(user);
      await navigate({ to: "/messages", search: { conversation } });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to start a private chat.");
    } finally {
      setStartingChat(null);
    }
  }

  return (
    <AppShell title="Friends" subtitle="Discover registered users and start a private conversation.">
      <div className="nexus-page-grid">
        <section className="nexus-panel p-4 sm:p-6">
          <div className="mb-5 flex items-center justify-between"><div><h2 className="nexus-section-title">People on Nexus Chat</h2><p className="mt-1 text-xs text-muted-foreground">Public profiles only. Email and phone are never shown.</p></div><UsersRound className="size-5 text-primary" /></div>
          <label className="nexus-search-field"><Search className="size-4 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people by name or username" /></label>
          {error && <p role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/8 px-3 py-2 text-xs text-destructive">{error}</p>}
          {loading ? <div className="flex justify-center py-12 text-sm text-muted-foreground"><LoaderCircle className="mr-2 size-4 animate-spin" /> Loading users…</div> : users.length === 0 && !error ? <EmptyState icon={<UsersRound className="size-6" />} title="No users found" description="Try a different search. Registered profiles will appear here." /> : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {users.map((user) => <article key={user.id} className="nexus-friend-card">
                <Avatar src={user.avatar} initials={user.initials} name={user.name} size="md" />
                <div className="min-w-0 flex-1"><button type="button" className="block max-w-full truncate text-left text-sm font-semibold text-foreground hover:text-primary" onClick={() => void navigate({ to: "/profile", search: { user: user.id } })}>{user.name}</button><p className="truncate text-xs text-primary">{user.username}</p>{user.bio && <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground">{user.bio}</p>}</div>
                <button type="button" aria-label={`Message ${user.name}`} className="nexus-icon-button" disabled={startingChat === user.id} onClick={() => void openChat(user)}>{startingChat === user.id ? <LoaderCircle className="size-4 animate-spin" /> : <MessageCircle className="size-4" />}</button>
              </article>)}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
