import { useEffect, useState } from "react";
import { LoaderCircle, MessageCircle, Search as SearchIcon, UserRound, UsersRound, X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { AppShell } from "./app-shell";
import { useNexus } from "./state";
import { Avatar, EmptyState, IconButton } from "./primitives";
import type { User } from "./types";

export function SearchView() {
  const { actions, state, authUser, authLoading } = useNexus();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [startingChat, setStartingChat] = useState<string | null>(null);

  useEffect(() => {
    const clean = query.trim();
    if (!authUser || authLoading || !clean) {
      setUsers([]);
      setError("");
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    const timer = window.setTimeout(() => {
      void actions.searchUsers(clean).then((results) => {
        if (active) setUsers(results);
      }).catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to search users.");
      }).finally(() => {
        if (active) setLoading(false);
      });
    }, 220);
    return () => { active = false; window.clearTimeout(timer); };
  }, [actions, query, authUser, authLoading]);

  async function message(user: User) {
    setStartingChat(user.id);
    setError("");
    try {
      const conversation = await actions.createConversation(user);
      actions.addRecentSearch(user.name);
      await navigate({ to: "/messages", search: { conversation } });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to start this conversation.");
    } finally {
      setStartingChat(null);
    }
  }

  return (
    <AppShell title="Search" subtitle="Find real Nexus Chat users by name or username.">
      <div className="nexus-page-grid">
        <section className="nexus-panel p-4 sm:p-6">
          <label className="nexus-search-field nexus-search-large">
            <SearchIcon className="size-5 text-primary" />
            <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && query.trim()) actions.addRecentSearch(query); }} placeholder="Search by name or username" />
            {query && <IconButton label="Clear search" onClick={() => setQuery("")}><X className="size-4" /></IconButton>}
          </label>
          <div className="mt-5 flex items-center gap-2"><span className="nexus-tab nexus-tab-active"><UsersRound className="mr-1 inline size-3.5" /> People</span><span className="text-xs text-muted-foreground">Searches display only public profile details.</span></div>
          {error && <p role="alert" className="mt-5 rounded-xl border border-destructive/30 bg-destructive/8 px-3 py-2 text-xs text-destructive">{error}</p>}
          {!query.trim() ? (
            <div className="mt-8">
              <div className="flex items-center justify-between"><h2 className="nexus-section-title">Recent searches</h2><button type="button" className="nexus-text-button text-xs" onClick={() => state.recentSearches.forEach(actions.removeRecentSearch)}>Clear all</button></div>
              {state.recentSearches.length ? <div className="mt-3 flex flex-wrap gap-2">{state.recentSearches.map((item) => <button key={item} type="button" onClick={() => setQuery(item)} className="nexus-chip">{item}</button>)}</div> : <EmptyState icon={<SearchIcon className="size-6" />} title="Search for someone" description="Enter a display name or username to find registered users." />}
            </div>
          ) : loading ? <div className="flex justify-center py-12 text-sm text-muted-foreground"><LoaderCircle className="mr-2 size-4 animate-spin" /> Searching users…</div> : users.length === 0 && !error ? <EmptyState icon={<UserRound className="size-6" />} title="No users found" description="Try another name or username. Only registered profiles appear here." /> : (
            <div className="mt-5 space-y-2">
              {users.map((user) => <article key={user.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card/55 p-3 sm:p-4">
                <Avatar src={user.avatar} initials={user.initials} name={user.name} size="md" />
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => { actions.addRecentSearch(user.name); void navigate({ to: "/profile", search: { user: user.id } }); }}>
                  <span className="block truncate text-sm font-semibold text-foreground">{user.name}</span><span className="block truncate text-xs text-primary">{user.username}</span>{user.bio && <span className="mt-1 block truncate text-xs text-muted-foreground">{user.bio}</span>}
                </button>
                <button type="button" className="nexus-secondary-button shrink-0 px-3 py-2 text-xs" disabled={startingChat === user.id} onClick={() => void message(user)}>{startingChat === user.id ? <LoaderCircle className="size-3.5 animate-spin" /> : <MessageCircle className="size-3.5" />}<span className="hidden sm:inline">Message</span></button>
              </article>)}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
