import { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  ArrowLeft,
  Bookmark,
  Check,
  Copy,
  Download,
  Ellipsis,
  FileText,
  Forward,
  Heart,
  MoreHorizontal,
  Paperclip,
  Phone,
  Pin,
  Reply,
  Search,
  Trash2,
  Video,
  VolumeX,
  X,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNexus } from "./state";
import {
  Avatar,
  EmptyState,
  formatBytes,
  formatMessageTime,
  IconButton,
  MessageStatusIcon,
  Modal,
} from "./primitives";
import { CallDialog } from "./call-dialog";
import { MessageComposer } from "./message-composer";
import type { Conversation, Message } from "./types";

function dayLabel(value: string): string {
  const date = new Date(value);
  if (date.toDateString() === new Date().toDateString()) return "Today";
  return date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

function linkifyText(text: string) {
  return text.split(/(https?:\/\/[^\s]+)/g).map((part, index) =>
    part.startsWith("http") ? (
      <a
        key={`${part}-${index}`}
        href={part}
        target="_blank"
        rel="noreferrer"
        className="text-primary underline decoration-primary/40 underline-offset-2"
      >
        {part}
      </a>
    ) : (
      part
    ),
  );
}

function AttachmentCard({
  attachment,
  onNotice,
}: {
  attachment: Message["attachments"][number];
  onNotice: (notice: string) => void;
}) {
  if (attachment.kind === "image" && attachment.previewUrl) {
    return (
      <img
        src={attachment.previewUrl}
        alt={attachment.name}
        className="mt-2 max-h-64 w-full rounded-xl object-cover"
      />
    );
  }
  return (
    <div className="mt-2 flex items-center gap-3 rounded-xl border border-current/10 bg-black/10 px-3 py-2">
      <span className="grid size-9 place-items-center rounded-lg bg-primary/15 text-primary">
        <FileText className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium">{attachment.name}</span>
        <span className="text-[10px] opacity-65">
          {attachment.type || "File"} · {formatBytes(attachment.size)}
        </span>
      </span>
      <button
        type="button"
        className="grid size-8 place-items-center rounded-lg hover:bg-white/10"
        aria-label={`Download ${attachment.name}`}
        onClick={() => onNotice("Downloads are simulated locally in this preview.")}
      >
        <Download className="size-4" />
      </button>
    </div>
  );
}

function MessageActions({
  message,
  conversationId,
  onReply,
  onEdit,
  onClose,
  onNotice,
}: {
  message: Message;
  conversationId: string;
  onReply: () => void;
  onEdit: () => void;
  onClose: () => void;
  onNotice: (notice: string) => void;
}) {
  const { state, actions } = useNexus();
  const isMine = message.authorId === state.currentUser.id;

  async function copy() {
    try {
      await navigator.clipboard?.writeText(message.text);
      onNotice("Message copied to your clipboard.");
    } catch {
      onNotice("Copy is unavailable in this browser preview.");
    }
    onClose();
  }

  return (
    <div
      className="absolute top-0 z-20 flex w-44 flex-col gap-0.5 rounded-xl border border-border bg-popover p-1.5 shadow-2xl"
      style={{ [isMine ? "right" : "left"]: "calc(100% + 0.5rem)" }}
    >
      <button
        type="button"
        className="nexus-menu-item"
        onClick={() => {
          actions.toggleReaction(conversationId, message.id, "❤️");
          onClose();
        }}
      >
        <Heart className="size-3.5" /> React
      </button>
      <button
        type="button"
        className="nexus-menu-item"
        onClick={() => {
          onReply();
          onClose();
        }}
      >
        <Reply className="size-3.5" /> Reply
      </button>
      <button type="button" className="nexus-menu-item" onClick={copy}>
        <Copy className="size-3.5" /> Copy
      </button>
      <button
        type="button"
        className="nexus-menu-item"
        onClick={() => {
          actions.sendMessage(conversationId, { text: `Forwarded: ${message.text}` });
          onNotice("Message forwarded in this demo chat.");
          onClose();
        }}
      >
        <Forward className="size-3.5" /> Forward
      </button>
      <button
        type="button"
        className="nexus-menu-item"
        onClick={() => {
          actions.toggleMessagePinned(conversationId, message.id);
          onNotice(message.pinned ? "Message unpinned." : "Message pinned.");
          onClose();
        }}
      >
        <Pin className="size-3.5" /> {message.pinned ? "Unpin" : "Pin"}
      </button>
      <button
        type="button"
        className="nexus-menu-item"
        onClick={() => {
          actions.markConversationUnread(conversationId);
          onNotice("Conversation marked unread.");
          onClose();
        }}
      >
        <Bookmark className="size-3.5" /> Mark unread
      </button>
      {isMine && (
        <button
          type="button"
          className="nexus-menu-item"
          onClick={() => {
            onEdit();
            onClose();
          }}
        >
          <Pencil className="size-3.5" /> Edit
        </button>
      )}
      {isMine && (
        <button
          type="button"
          className="nexus-menu-item text-rose-300 hover:text-rose-200"
          onClick={() => {
            actions.deleteMessage(conversationId, message.id);
            onNotice("Message deleted locally.");
            onClose();
          }}
        >
          <Trash2 className="size-3.5" /> Delete
        </button>
      )}
    </div>
  );
}

function MessageBubble({
  message,
  previous,
  conversation,
  onReply,
  onEdit,
  onNotice,
}: {
  message: Message;
  previous: Message | undefined;
  conversation: Conversation;
  onReply: (message: Message) => void;
  onEdit: (message: Message) => void;
  onNotice: (notice: string) => void;
}) {
  const { state } = useNexus();
  const [menuOpen, setMenuOpen] = useState(false);
  const mine = message.authorId === state.currentUser.id;
  const grouped = previous?.authorId === message.authorId;
  const reactionEntries = Object.entries(message.reactions).filter(([, ids]) => ids.length > 0);

  return (
    <div
      className={cn(
        "group relative flex gap-2",
        mine ? "justify-end" : "justify-start",
        grouped ? "mt-1" : "mt-4",
      )}
    >
      {!mine && (
        <div className="w-8 shrink-0 self-end">
          {!grouped && (
            <Avatar
              src={message.authorAvatar}
              initials={message.authorInitials}
              name={message.authorName}
              size="xs"
            />
          )}
        </div>
      )}
      <div className={cn("relative max-w-[min(76%,36rem)]", mine && "items-end")}>
        {!mine && !grouped && (
          <p className="mb-1 px-1 text-[10px] font-semibold text-muted-foreground">
            {message.authorName}
          </p>
        )}
        <div
          className={cn(
            "relative rounded-2xl px-3.5 py-2.5 text-sm leading-6 shadow-sm",
            mine ? "nexus-bubble-out rounded-br-md" : "nexus-bubble-in rounded-bl-md",
            message.deleted && "italic opacity-70",
          )}
        >
          {message.replyToId && (
            <div className="mb-2 rounded-lg border-l-2 border-primary/60 bg-black/10 px-2 py-1 text-[10px] opacity-75">
              Replying to a previous message
            </div>
          )}
          {message.text && (
            <p className="whitespace-pre-wrap break-words">{linkifyText(message.text)}</p>
          )}
          {message.attachments.map((attachment) => (
            <AttachmentCard key={attachment.id} attachment={attachment} onNotice={onNotice} />
          ))}
          <div
            className={cn(
              "mt-1 flex items-center justify-end gap-1 text-[10px]",
              mine ? "text-white/65" : "text-muted-foreground",
            )}
          >
            {message.edited && <span>edited</span>}
            <span>{formatMessageTime(message.createdAt)}</span>
            {mine && <MessageStatusIcon status={message.status} />}
          </div>
          {reactionEntries.length > 0 && (
            <div className="absolute -bottom-3 left-3 flex gap-1 rounded-full border border-border bg-card px-1.5 py-0.5 text-[11px] shadow-lg">
              {reactionEntries.map(([emoji, ids]) => (
                <span key={emoji}>
                  {emoji} {ids.length}
                </span>
              ))}
            </div>
          )}
          {message.pinned && (
            <Pin className="absolute -top-2 -right-2 size-3.5 rounded-full bg-card p-0.5 text-primary" />
          )}
        </div>
        <button
          type="button"
          aria-label={`Actions for message from ${message.authorName}`}
          onClick={() => setMenuOpen((current) => !current)}
          className={cn(
            "absolute top-1/2 z-10 grid size-7 -translate-y-1/2 place-items-center rounded-full border border-border bg-card text-muted-foreground opacity-0 shadow-lg transition-opacity hover:text-foreground focus:opacity-100 group-hover:opacity-100",
            mine ? "-left-9" : "-right-9",
          )}
        >
          <MoreHorizontal className="size-3.5" />
        </button>
        {menuOpen && (
          <MessageActions
            message={message}
            conversationId={conversation.id}
            onReply={() => onReply(message)}
            onEdit={() => onEdit(message)}
            onClose={() => setMenuOpen(false)}
            onNotice={onNotice}
          />
        )}
      </div>
    </div>
  );
}

export function ChatView({
  conversation,
  onBack,
}: {
  conversation: Conversation;
  onBack: () => void;
}) {
  const { state, actions } = useNexus();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [call, setCall] = useState<"voice" | "video" | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [conversation.id, conversation.messages.length, conversation.typing]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 2500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const messages = useMemo(
    () =>
      conversation.messages.filter((message) => {
        const query = searchQuery.trim().toLowerCase();
        return (
          !query ||
          message.text.toLowerCase().includes(query) ||
          message.attachments.some((attachment) => attachment.name.toLowerCase().includes(query))
        );
      }),
    [conversation.messages, searchQuery],
  );

  function setConversationFlag(flag: "pinned" | "muted" | "archived") {
    actions.setConversationFlag(conversation.id, flag);
    setMenuOpen(false);
  }

  return (
    <section className="nexus-chat-workspace">
      <header className="nexus-chat-header">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <IconButton label="Back to conversations" onClick={onBack} className="lg:hidden">
            <ArrowLeft className="size-[18px]" />
          </IconButton>
          <Avatar
            src={conversation.avatar}
            initials={conversation.initials}
            name={conversation.name}
            size="sm"
            status={conversation.status}
          />
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-foreground">{conversation.name}</h2>
            <p className="truncate text-[11px] text-muted-foreground">
              {conversation.typing ? "typing..." : conversation.lastSeen}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1">
          <IconButton label="Start voice call" onClick={() => setCall("voice")}>
            <Phone className="size-[17px]" />
          </IconButton>
          <IconButton label="Start video call" onClick={() => setCall("video")}>
            <Video className="size-[17px]" />
          </IconButton>
          <IconButton
            label="Search this conversation"
            active={searchOpen}
            onClick={() => setSearchOpen((current) => !current)}
          >
            <Search className="size-[17px]" />
          </IconButton>
          <div className="relative">
            <IconButton
              label="Conversation options"
              active={menuOpen}
              onClick={() => setMenuOpen((current) => !current)}
            >
              <Ellipsis className="size-[18px]" />
            </IconButton>
            {menuOpen && (
              <div className="absolute top-11 right-0 z-30 w-48 rounded-xl border border-border bg-popover p-1.5 shadow-2xl">
                <button
                  type="button"
                  className="nexus-menu-item"
                  onClick={() => setConversationFlag("pinned")}
                >
                  <Pin className="size-3.5" /> {conversation.pinned ? "Unpin chat" : "Pin chat"}
                </button>
                <button
                  type="button"
                  className="nexus-menu-item"
                  onClick={() => setConversationFlag("muted")}
                >
                  <VolumeX className="size-3.5" />{" "}
                  {conversation.muted ? "Unmute chat" : "Mute chat"}
                </button>
                <button
                  type="button"
                  className="nexus-menu-item"
                  onClick={() => setConversationFlag("archived")}
                >
                  <Archive className="size-3.5" />{" "}
                  {conversation.archived ? "Unarchive chat" : "Archive chat"}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      {searchOpen && (
        <div className="border-b border-border bg-card/70 px-4 py-2">
          <label className="nexus-search-field">
            <Search className="size-4 text-muted-foreground" />
            <input
              autoFocus
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search messages in this chat"
            />
            <button
              type="button"
              aria-label="Close message search"
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery("");
              }}
            >
              <X className="size-4" />
            </button>
          </label>
        </div>
      )}
      <div ref={scrollRef} className="nexus-message-scroll scroll-slim">
        <div className="mx-auto w-full max-w-3xl px-3 py-4 sm:px-6 sm:py-6">
          <div className="mx-auto mb-5 flex max-w-md items-center gap-3 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-center text-[11px] leading-5 text-muted-foreground">
            <span className="grid size-7 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <Check className="size-3.5" />
            </span>
            <span>
              Messages are stored locally for this demo. A production build would connect your
              secure backend here.
            </span>
          </div>
          {messages.length === 0 ? (
            <EmptyState
              icon={<Search className="size-6" />}
              title="No matching messages"
              description="Try a different word or clear the conversation search."
            />
          ) : (
            messages.map((message, index) => {
              const previous = messages[index - 1];
              const showDate =
                !previous || dayLabel(previous.createdAt) !== dayLabel(message.createdAt);
              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="my-5 flex items-center gap-3">
                      <span className="h-px flex-1 bg-border" />
                      <span className="rounded-full border border-border bg-card px-3 py-1 text-[10px] font-medium text-muted-foreground">
                        {dayLabel(message.createdAt)}
                      </span>
                      <span className="h-px flex-1 bg-border" />
                    </div>
                  )}
                  <MessageBubble
                    message={message}
                    previous={previous}
                    conversation={conversation}
                    onReply={setReplyingTo}
                    onEdit={setEditingMessage}
                    onNotice={setNotice}
                  />
                </div>
              );
            })
          )}
          {conversation.typing && (
            <div className="mt-4 flex items-end gap-2">
              <Avatar
                src={conversation.avatar}
                initials={conversation.initials}
                name={conversation.name}
                size="xs"
              />
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-secondary px-3 py-3">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          )}
        </div>
      </div>
      {notice && (
        <div className="pointer-events-none absolute bottom-24 left-1/2 z-20 -translate-x-1/2 rounded-full border border-border bg-popover px-4 py-2 text-xs text-foreground shadow-2xl">
          {notice}
        </div>
      )}
      <MessageComposer
        conversationId={conversation.id}
        editingMessage={editingMessage}
        replyingTo={replyingTo}
        onCancelEdit={() => setEditingMessage(null)}
        onCancelReply={() => setReplyingTo(null)}
        onSent={() => {
          setEditingMessage(null);
          setReplyingTo(null);
        }}
      />
      {call && <CallDialog conversation={conversation} kind={call} onClose={() => setCall(null)} />}
    </section>
  );
}
