import { useEffect, useMemo, useState } from "react";
import { MessageCirclePlus, Search, UsersRound, X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useNexus } from "./state";
import { AppShell } from "./app-shell";
import { Avatar, EmptyState, formatRelativeTime, IconButton, Modal } from "./primitives";
import { ChatView } from "./chat-view";
import type { Conversation, User } from "./types";

function ConversationRow({ conversation, active, onOpen }: { conversation: Conversation; active: boolean; onOpen: () => void }) {
  const last = conversation.messages[conversation.messages.length - 1];
  return (
    <button type="button" onClick={onOpen} className={cn("group flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors", active ? "bg-primary/10" : "hover:bg-secondary/60")}>
      <Avatar src={conversation.avatar} initials={conversation.initials} name={conversation.name} size="md" />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2"><span className="truncate text-sm font-semibold text-foreground">{conversation.name}</span><span className="shrink-0 text-[10px] text-muted-foreground">{last ? formatRelativeTime(last.createdAt) : "New"}</span></span>
        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{conversation.username}</span>
        <span className="mt-1 block truncate text-xs text-muted-foreground">{last?.text || "No messages yet. Say hello."}</span>
      </span>
    </button>
  );
}

function NewConversationModal({ onClose, onOpen }: { onClose: () => void; onOpen: (user: User) => void }) {
  const { actions } = useNexus();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true);
    const timer = window.setTimeout(() => {
      void actions.searchUsers(query).then((result) => {
        if (active) setUsers(result);
      }).catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to search users.");
      }).finally(() => {
        if (active) setLoading(false);
      });
    }, 180);
    return () => { active = false; window.clearTimeout(timer); };
  }, [actions, query]);

  return (
    <Modal title="New message" description="Choose a registered Nexus Chat user." onClose={onClose}>
      <label className="nexus-search-field"><Search className="size-4 text-muted-foreground" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or username" /><IconButton label="Clear search" onClick={() => setQuery("")}><X className="size-4" /></IconButton></label>
      <div className="mt-4 max-h-[55vh] space-y-1 overflow-y-auto">
        {loading ? <p className="py-8 text-center text-xs text-muted-foreground">Searching registered users…</p> : null}
        {error && <p role="alert" className="py-4 text-center text-xs text-destructive">{error}</p>}
        {!loading && !error && users.length === 0 && <p className="py-8 text-center text-xs text-muted-foreground">No users found.</p>}
        {users.map((user) => (
          <button key={user.id} type="button" onClick={() => onOpen(user)} className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-secondary/70">
            <Avatar src={user.avatar} initials={user.initials} name={user.name} size="sm" />
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-foreground">{user.name}</span><span className="block truncate text-xs text-muted-foreground">{user.username}{user.bio ? ` · ${user.bio}` : ""}</span></span>
            <MessageCirclePlus className="size-4 text-primary" />
          </button>
        ))}
      </div>
    </Modal>
  );
}

export function MessagesView({ requestedConversationId }: { requestedConversationId: string | undefined }) {
  const { state, actions, authUser, authLoading, conversationLoading, conversationError } = useNexus();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(requestedConversationId ?? null);
  const [mobileChat, setMobileChat] = useState(Boolean(requestedConversationId));
  const [newOpen, setNewOpen] = useState(false);
  const [selectionError, setSelectionError] = useState("");

  useEffect(() => {
    if (!authUser || authLoading) return;
    if (requestedConversationId && requestedConversationId !== selectedId) {
      setSelectedId(requestedConversationId);
      setMobileChat(true);
      return;
    }
    if (!requestedConversationId && !selectedId && !conversationLoading && state.conversations.length > 0) {
      setSelectedId(state.conversations[0]?.id ?? null);
    }
  }, [requestedConversationId, selectedId, authUser, authLoading, conversationLoading, state.conversations]);

  const hasSelectedConversation = Boolean(selectedId && state.conversations.some((conversation) => conversation.id === selectedId));
  useEffect(() => {
    if (!authUser || authLoading || !selectedId || conversationLoading) return;
    if (!hasSelectedConversation) {
      if (requestedConversationId === selectedId) setSelectionError("This conversation is unavailable or you are not a member.");
      return;
    }
    setSelectionError("");
    void actions.openConversation(selectedId);
    return () => actions.closeConversation(selectedId);
  }, [selectedId, authUser, authLoading, conversationLoading, hasSelectedConversation, requestedConversationId, actions]);

  const filtered = useMemo(() => {
    const clean = query.trim().toLowerCase();
    return state.conversations.filter((conversation) => `${conversation.name} ${conversation.username} ${conversation.messages.at(-1)?.text ?? ""}`.toLowerCase().includes(clean));
  }, [query, state.conversations]);
  const activeConversation = state.conversations.find((conversation) => conversation.id === selectedId);

  async function openUser(user: User) {
    setSelectionError("");
    try {
      const conversationId = await actions.createConversation(user);
      setNewOpen(false);
      setSelectedId(conversationId);
      setMobileChat(true);
      await navigate({ to: "/messages", search: { conversation: conversationId } });
    } catch (reason) {
      setSelectionError(reason instanceof Error ? reason.message : "Unable to start a private conversation.");
    }
  }

  function openConversation(conversationId: string) {
    setSelectedId(conversationId);
    setMobileChat(true);
    setSelectionError("");
  }

  return (
    <AppShell title="Messages" subtitle="Private conversations, delivered in real time.">
      <div className="nexus-messages-layout">
        <section className={cn("nexus-conversation-panel", mobileChat && "nexus-mobile-hidden")}>
          <div className="flex items-center justify-between gap-3 px-4 pb-3 sm:px-5">
            <div className="flex items-center gap-2"><span className="text-sm font-semibold text-foreground">Inbox</span><span className="rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-semibold text-primary">{state.conversations.length}</span></div>
            <IconButton label="New message" onClick={() => setNewOpen(true)} className="bg-primary/15 text-primary hover:bg-primary/25"><MessageCirclePlus className="size-4" /></IconButton>
          </div>
          <div className="px-4 pb-3 sm:px-5"><label className="nexus-search-field"><Search className="size-4 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search conversations" /></label></div>
          {conversationError && <p role="alert" className="mx-4 mb-3 rounded-xl border border-destructive/30 bg-destructive/8 px-3 py-2 text-xs text-destructive">Unable to load conversations: {conversationError}</p>}
          {selectionError && <p role="alert" className="mx-4 mb-3 rounded-xl border border-destructive/30 bg-destructive/8 px-3 py-2 text-xs text-destructive">{selectionError}</p>}
          <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-3 pb-4">
            {conversationLoading && state.conversations.length === 0 ? <p className="py-8 text-center text-xs text-muted-foreground">Loading conversations…</p> : null}
            {!conversationLoading && !conversationError && filtered.length === 0 ? (
              <EmptyState icon={<UsersRound className="size-6" />} title={query ? "No conversations found" : "No conversations yet"} description={query ? "Try another name or username." : "Search for someone registered on Nexus Chat and start a private conversation."} action={!query ? <button type="button" className="nexus-secondary-button" onClick={() => setNewOpen(true)}>Find people</button> : undefined} />
            ) : filtered.map((conversation) => <ConversationRow key={conversation.id} conversation={conversation} active={conversation.id === selectedId} onOpen={() => openConversation(conversation.id)} />)}
          </div>
        </section>
        <section className={cn("nexus-chat-panel", !mobileChat && "nexus-mobile-hidden-chat")}>
          {activeConversation ? <ChatView conversation={activeConversation} onBack={() => setMobileChat(false)} /> : <EmptyState icon={<MessageCirclePlus className="size-6" />} title="Choose a conversation" description="Open a conversation or find another registered user to message." />}
        </section>
      </div>
      {newOpen && <NewConversationModal onClose={() => setNewOpen(false)} onOpen={(user) => void openUser(user)} />}
    </AppShell>
  );
}
