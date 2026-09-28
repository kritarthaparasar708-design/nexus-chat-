import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  FileText,
  Hash,
  MessageCircle,
  Search as SearchIcon,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { AppShell } from "./app-shell";
import { useNexus } from "./state";
import { Avatar, EmptyState, formatMessageTime, highlightText, IconButton } from "./primitives";

type Category = "all" | "people" | "groups" | "messages";

export function SearchView() {
  const { state, actions } = useNexus();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("all");
  const categories: { id: Category; label: string }[] = [
    { id: "all", label: "All" },
    { id: "people", label: "People" },
    { id: "groups", label: "Groups" },
    { id: "messages", label: "Messages" },
  ];
  const cleanQuery = query.trim().toLowerCase();

  const people = useMemo(
    () =>
      state.friends.filter((friend) =>
        `${friend.name} ${friend.username}`.toLowerCase().includes(cleanQuery),
      ),
    [cleanQuery, state.friends],
  );
  const groups = useMemo(
    () =>
      state.conversations.filter(
        (conversation) =>
          conversation.kind === "group" && conversation.name.toLowerCase().includes(cleanQuery),
      ),
    [cleanQuery, state.conversations],
  );
  const messages = useMemo(
    () =>
      state.conversations.flatMap((conversation) =>
        conversation.messages
          .filter((message) => message.text.toLowerCase().includes(cleanQuery))
          .map((message) => ({ conversation, message })),
      ),
    [cleanQuery, state.conversations],
  );
  const hasResults =
    Boolean(cleanQuery) &&
    ((category === "all" && (people.length > 0 || groups.length > 0 || messages.length > 0)) ||
      (category === "people" && people.length > 0) ||
      (category === "groups" && groups.length > 0) ||
      (category === "messages" && messages.length > 0));

  return (
    <AppShell title="Search" subtitle="Find people, groups, messages, and shared moments.">
      <div className="nexus-page-grid">
        <section className="nexus-panel p-4 sm:p-6">
          <label className="nexus-search-field nexus-search-large">
            <SearchIcon className="size-5 text-primary" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") actions.addRecentSearch(query);
              }}
              placeholder="Search anything in Nexus Chat"
            />
            <kbd>⌘ K</kbd>
            {query && (
              <IconButton label="Clear search" onClick={() => setQuery("")}>
                <X className="size-4" />
              </IconButton>
            )}
          </label>
          <div className="nexus-tab-row mt-5">
            {categories.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setCategory(item.id)}
                className={cn("nexus-tab", category === item.id && "nexus-tab-active")}
              >
                {item.label}
              </button>
            ))}
          </div>
          {!cleanQuery ? (
            <div className="mt-8">
              <div className="flex items-center justify-between">
                <h2 className="nexus-section-title">Recent searches</h2>
                <button
                  type="button"
                  className="nexus-text-button text-xs"
                  onClick={() => state.recentSearches.forEach(actions.removeRecentSearch)}
                >
                  Clear all
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {state.recentSearches.map((search) => (
                  <button
                    type="button"
                    key={search}
                    onClick={() => setQuery(search)}
                    className="nexus-chip"
                  >
                    {search}
                    <X
                      className="size-3 text-muted-foreground"
                      onClick={(event) => {
                        event.stopPropagation();
                        actions.removeRecentSearch(search);
                      }}
                    />
                  </button>
                ))}
              </div>
              <div className="mt-12 grid gap-3 sm:grid-cols-3">
                <div className="nexus-feature-mini">
                  <UserRound className="size-4 text-primary" />
                  <span>
                    <strong>People</strong>
                    <small>Find your circle</small>
                  </span>
                </div>
                <div className="nexus-feature-mini">
                  <Hash className="size-4 text-primary" />
                  <span>
                    <strong>Groups</strong>
                    <small>Explore communities</small>
                  </span>
                </div>
                <div className="nexus-feature-mini">
                  <MessageCircle className="size-4 text-primary" />
                  <span>
                    <strong>Messages</strong>
                    <small>Search your history</small>
                  </span>
                </div>
              </div>
            </div>
          ) : !hasResults ? (
            <EmptyState
              icon={<SearchIcon className="size-6" />}
              title="No results found"
              description="Try a name, group, or phrase from one of your conversations."
            />
          ) : (
            <div className="mt-6 space-y-7">
              {(category === "all" || category === "people") && people.length > 0 && (
                <ResultSection title="People" icon={<UserRound className="size-4" />}>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {people.map((friend) => (
                      <Link
                        key={friend.id}
                        to="/friends"
                        className="nexus-result-card"
                        onClick={() => actions.addRecentSearch(friend.name)}
                      >
                        <Avatar
                          src={friend.avatar}
                          initials={friend.initials}
                          name={friend.name}
                          size="sm"
                          status={friend.status}
                        />
                        <span className="min-w-0 flex-1">
                          <strong>{highlightText(friend.name, query)}</strong>
                          <small>{friend.username}</small>
                        </span>
                        <ArrowUpRight className="size-4 text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                </ResultSection>
              )}
              {(category === "all" || category === "groups") && groups.length > 0 && (
                <ResultSection title="Groups" icon={<UsersRound className="size-4" />}>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {groups.map((group) => (
                      <Link
                        key={group.id}
                        to="/messages"
                        className="nexus-result-card"
                        onClick={() => actions.addRecentSearch(group.name)}
                      >
                        <Avatar
                          src={group.avatar}
                          initials={group.initials}
                          name={group.name}
                          size="sm"
                        />
                        <span className="min-w-0 flex-1">
                          <strong>{highlightText(group.name, query)}</strong>
                          <small>
                            {group.memberIds.length} members · {group.lastSeen}
                          </small>
                        </span>
                        <ArrowUpRight className="size-4 text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                </ResultSection>
              )}
              {(category === "all" || category === "messages") && messages.length > 0 && (
                <ResultSection title="Messages" icon={<MessageCircle className="size-4" />}>
                  <div className="space-y-2">
                    {messages.map(({ conversation, message }) => (
                      <Link
                        key={message.id}
                        to="/messages"
                        className="nexus-result-card items-start"
                        onClick={() => actions.addRecentSearch(message.text)}
                      >
                        <Avatar
                          src={conversation.avatar}
                          initials={conversation.initials}
                          name={conversation.name}
                          size="sm"
                        />
                        <span className="min-w-0 flex-1">
                          <strong>{conversation.name}</strong>
                          <small>{highlightText(message.text, query)}</small>
                        </span>
                        <time>{formatMessageTime(message.createdAt)}</time>
                      </Link>
                    ))}
                  </div>
                </ResultSection>
              )}
            </div>
          )}
        </section>
        <aside className="nexus-panel hidden p-5 xl:block">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-2xl bg-primary/12 text-primary">
              <SearchIcon className="size-5" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Search smarter</h2>
              <p className="text-xs text-muted-foreground">People, places, and moments.</p>
            </div>
          </div>
          <div className="mt-6 space-y-3 text-xs leading-5 text-muted-foreground">
            <p>Search works across your local demo contacts, group names, and message contents.</p>
            <p>Recent searches stay on this device so your flow feels fast between sessions.</p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function ResultSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        {icon}
        {title}
      </div>
      {children}
    </section>
  );
}
