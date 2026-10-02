import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ArrowLeft, Check, MessageCircle, Search, Wifi, WifiOff, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useNexus } from "./state";
import { Avatar, EmptyState, formatMessageTime, IconButton } from "./primitives";
import { MessageComposer } from "./message-composer";
import type { Conversation, Message } from "./types";

function dateLabel(value: string): string {
  const date = new Date(value);
  if (date.toDateString() === new Date().toDateString()) return "Today";
  return date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

function MessageBubble({ message, previous, ownId }: { message: Message; previous: Message | undefined; ownId: string }) {
  const mine = message.authorId === ownId;
  const grouped = previous?.authorId === message.authorId;
  return (
    <div className={cn("group relative flex gap-2", mine ? "justify-end" : "justify-start", grouped ? "mt-1" : "mt-4")}>
      {!mine && <div className="w-8 shrink-0 self-end">{!grouped && <Avatar src={message.authorAvatar} initials={message.authorInitials} name={message.authorName} size="xs" />}</div>}
      <div className={cn("relative max-w-[min(76%,36rem)]", mine && "items-end")}>
        {!mine && !grouped && <p className="mb-1 px-1 text-[10px] font-semibold text-muted-foreground">{message.authorName}</p>}
        <div className={cn("relative rounded-2xl px-3.5 py-2.5 text-sm leading-6 shadow-sm", mine ? "nexus-bubble-out rounded-br-md" : "nexus-bubble-in rounded-bl-md")}>
          <p className="whitespace-pre-wrap break-words">{message.text}</p>
          <div className={cn("mt-1 flex items-center justify-end gap-1 text-[10px]", mine ? "text-white/65" : "text-muted-foreground")}>
            <span>{formatMessageTime(message.createdAt)}</span>
            {mine && <Check className="size-3" />}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChatView({ conversation, onBack }: { conversation: Conversation; onBack: () => void }) {
  const { state, messagesLoading, messageError, realtimeStatus } = useNexus();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const peerId = conversation.memberIds.find((id) => id !== state.currentUser.id);
  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return conversation.messages.filter((message) => !query || message.text.toLowerCase().includes(query));
  }, [conversation.messages, searchQuery]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [conversation.id, conversation.messages.length]);

  return (
    <section className="nexus-chat-workspace">
      <header className="nexus-chat-header">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <IconButton label="Back to conversations" onClick={onBack} className="lg:hidden"><ArrowLeft className="size-[18px]" /></IconButton>
          <Avatar src={conversation.avatar} initials={conversation.initials} name={conversation.name} size="sm" />
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-foreground">{conversation.name}</h2>
            <p className="truncate text-[11px] text-muted-foreground">{conversation.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {realtimeStatus === "connected" ? <span className="hidden items-center gap-1 text-[10px] text-emerald-300 sm:flex"><Wifi className="size-3" /> Live</span> : realtimeStatus === "error" ? <span className="hidden items-center gap-1 text-[10px] text-amber-300 sm:flex" title="Realtime connection unavailable"><WifiOff className="size-3" /> Reconnecting</span> : null}
          {peerId && <Link to="/profile" search={{ user: peerId }} className="nexus-secondary-button hidden px-2 py-1.5 text-xs sm:inline-flex">Profile</Link>}
          <IconButton label="Search messages" active={searchOpen} onClick={() => setSearchOpen((value) => !value)}><Search className="size-[17px]" /></IconButton>
        </div>
      </header>
      {searchOpen && <div className="border-b border-border bg-card/70 px-4 py-2"><label className="nexus-search-field"><Search className="size-4 text-muted-foreground" /><input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search messages in this chat" /><button type="button" aria-label="Close message search" onClick={() => { setSearchOpen(false); setSearchQuery(""); }}><X className="size-4" /></button></label></div>}
      <div ref={scrollRef} className="nexus-message-scroll scroll-slim">
        <div className="mx-auto w-full max-w-3xl px-3 py-4 sm:px-6 sm:py-6">
          {messagesLoading ? <div className="py-12 text-center text-sm text-muted-foreground">Loading messages…</div> : null}
          {messageError && <p role="alert" className="mb-4 rounded-xl border border-destructive/30 bg-destructive/8 px-3 py-2 text-xs text-destructive">{messageError}</p>}
          {!messagesLoading && filtered.length === 0 && (
            searchQuery ? <EmptyState icon={<Search className="size-6" />} title="No matching messages" description="Try another search or clear the conversation search." /> :
              <EmptyState icon={<MessageCircle className="size-6" />} title="Start the conversation" description={`Send a message to ${conversation.name}. Messages are securely saved to your account.`} />
          )}
          {filtered.map((message, index) => {
            const previous = filtered[index - 1];
            const showDate = !previous || dateLabel(previous.createdAt) !== dateLabel(message.createdAt);
            return <div key={message.id}>{showDate && <div className="my-5 flex items-center gap-3"><span className="h-px flex-1 bg-border" /><span className="rounded-full border border-border bg-card px-3 py-1 text-[10px] font-medium text-muted-foreground">{dateLabel(message.createdAt)}</span><span className="h-px flex-1 bg-border" /></div>}<MessageBubble message={message} previous={previous} ownId={state.currentUser.id} /></div>;
          })}
        </div>
      </div>
      <MessageComposer conversationId={conversation.id} />
    </section>
  );
}
