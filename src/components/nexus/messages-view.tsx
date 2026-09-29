import { useMemo, useState } from "react";
import {
  Archive,
  Bell,
  Check,
  ChevronRight,
  Edit3,
  Filter,
  Hash,
  MessageCirclePlus,
  MoreHorizontal,
  Pin,
  Plus,
  Search,
  Sparkles,
  UserPlus,
  VolumeX,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNexus } from "./state";
import { AppShell } from "./app-shell";
import {
  Avatar,
  EmptyState,
  formatMessageTime,
  formatRelativeTime,
  IconButton,
  Modal,
} from "./primitives";
import { ChatView } from "./chat-view";
import type { Conversation, Friend, Story } from "./types";

const tabs = ["all", "groups", "unread", "archived"] as const;
type Tab = (typeof tabs)[number];

function StatusStrip({
  stories,
  onOpen,
  onAdd,
}: {
  stories: Story[];
  onOpen: (story: Story) => void;
  onAdd: () => void;
}) {
  return (
    <div className="nexus-status-strip scroll-slim">
      <button type="button" onClick={onAdd} className="nexus-story-card nexus-story-add">
        <span className="grid size-10 place-items-center rounded-full border border-dashed border-primary/60 bg-primary/10 text-primary">
          <Plus className="size-4" />
        </span>
        <span className="truncate text-[10px] font-medium">Your status</span>
      </button>
      {stories
        .filter((story) => story.authorId !== "me")
        .map((story) => (
          <button
            type="button"
            key={story.id}
            onClick={() => onOpen(story)}
            className={cn("nexus-story-card", !story.viewed && "nexus-story-unviewed")}
          >
            <span className="relative">
              <Avatar src={story.avatar} initials={story.initials} name={story.name} size="md" />
              <span className="absolute inset-[-3px] rounded-full border border-primary/60" />
            </span>
            <span className="max-w-16 truncate text-[10px] font-medium text-foreground">
              {story.name.split(" ")[0]}
            </span>
          </button>
        ))}
    </div>
  );
}

function ConversationRow({
  conversation,
  active,
  onOpen,
}: {
  conversation: Conversation;
  active: boolean;
  onOpen: () => void;
}) {
  const { actions } = useNexus();
  const [menuOpen, setMenuOpen] = useState(false);
  const last = conversation.messages[conversation.messages.length - 1];
  return (
    <div
      className={cn(
        "group flex items-center gap-1 rounded-2xl p-1 transition-colors",
        active && "bg-primary/10",
        !active && "hover:bg-secondary/60",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2.5 py-2.5 text-left"
      >
        <Avatar
          src={conversation.avatar}
          initials={conversation.initials}
          name={conversation.name}
          size="md"
          status={conversation.status}
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-foreground">
              {conversation.name}
            </span>
            {conversation.pinned && <Pin className="size-3 shrink-0 text-primary" />}
            {conversation.muted && <VolumeX className="size-3 shrink-0 text-muted-foreground" />}
          </span>
          <span
            className={cn(
              "mt-0.5 block truncate text-xs",
              conversation.typing ? "font-medium text-primary" : "text-muted-foreground",
            )}
          >
            {conversation.typing ? "typing..." : last?.text || "No messages yet"}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-[10px] text-muted-foreground">
            {last ? formatRelativeTime(last.createdAt) : "new"}
          </span>
          {conversation.unread > 0 && (
            <span className="nexus-count-badge">
              {conversation.unread > 99 ? "99+" : conversation.unread}
            </span>
          )}
        </span>
      </button>
      <div className="relative self-stretch pt-2 pr-1">
        <IconButton
          label={`Options for ${conversation.name}`}
          onClick={() => setMenuOpen((current) => !current)}
          active={menuOpen}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100"
        >
          <MoreHorizontal className="size-4" />
        </IconButton>
        {menuOpen && (
          <div className="absolute top-10 right-1 z-30 w-44 rounded-xl border border-border bg-popover p-1.5 shadow-2xl">
            <button
              type="button"
              className="nexus-menu-item"
              onClick={() => {
                actions.setConversationFlag(conversation.id, "pinned");
                setMenuOpen(false);
              }}
            >
              <Pin className="size-3.5" /> {conversation.pinned ? "Unpin" : "Pin"}
            </button>
            <button
              type="button"
              className="nexus-menu-item"
              onClick={() => {
                actions.setConversationFlag(conversation.id, "muted");
                setMenuOpen(false);
              }}
            >
              <VolumeX className="size-3.5" /> {conversation.muted ? "Unmute" : "Mute"}
            </button>
            <button
              type="button"
              className="nexus-menu-item"
              onClick={() => {
                actions.setConversationFlag(conversation.id, "archived");
                setMenuOpen(false);
              }}
            >
              <Archive className="size-3.5" /> {conversation.archived ? "Unarchive" : "Archive"}
            </button>
            <button
              type="button"
              className="nexus-menu-item text-rose-300 hover:text-rose-200"
              onClick={() => {
                actions.removeConversation(conversation.id);
                setMenuOpen(false);
              }}
            >
              <X className="size-3.5" /> Delete chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function NewConversationModal({
  friends,
  onClose,
  onOpen,
}: {
  friends: Friend[];
  onClose: () => void;
  onOpen: (friend: Friend) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = friends.filter(
    (friend) =>
      friend.state === "accepted" &&
      `${friend.name} ${friend.username}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <Modal
      title="Start a new conversation"
      description="Choose a friend to open a local demo chat."
      onClose={onClose}
    >
      <label className="nexus-search-field mb-4">
        <Search className="size-4 text-muted-foreground" />
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search friends"
        />
      </label>
      <div className="space-y-1">
        {filtered.map((friend) => (
          <button
            key={friend.id}
            type="button"
            onClick={() => onOpen(friend)}
            className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-secondary/70"
          >
            <Avatar
              src={friend.avatar}
              initials={friend.initials}
              name={friend.name}
              size="sm"
              status={friend.status}
            />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-foreground">{friend.name}</span>
              <span className="text-xs text-muted-foreground">{friend.username}</span>
            </span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="py-6 text-center text-xs text-muted-foreground">
            No accepted friends found.
          </p>
        )}
      </div>
    </Modal>
  );
}

function StatusModal({
  story,
  onClose,
  onSave,
}: {
  story: Story | undefined;
  onClose: () => void;
  onSave: (content: string) => void;
}) {
  const [content, setContent] = useState(story?.content ?? "");
  return (
    <Modal
      title={story ? story.name : "Add a status"}
      description={
        story
          ? "Status preview · expires after 24 hours"
          : "Share a small thought with your friends."
      }
      onClose={onClose}
    >
      <div
        className={cn(
          "mb-4 min-h-32 rounded-2xl border border-primary/20 bg-[radial-gradient(circle_at_top,#4c1d95,transparent_65%),#121027] p-5 text-center",
          story?.kind === "image" && "bg-cover bg-center",
        )}
        style={
          story?.image
            ? {
                backgroundImage: `linear-gradient(rgba(12,8,30,.2),rgba(12,8,30,.65)), url(${story.image})`,
              }
            : undefined
        }
      >
        <Sparkles className="mx-auto size-5 text-violet-200" />
        <p className="mt-4 text-sm font-medium text-white">
          {content || "Your next update starts here."}
        </p>
      </div>
      {!story && (
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={3}
          placeholder="What’s happening?"
          className="nexus-textarea"
        />
      )}
      {!story && (
        <button
          type="button"
          disabled={!content.trim()}
          onClick={() => onSave(content.trim())}
          className="nexus-primary-button mt-4 w-full"
        >
          Share status
        </button>
      )}
    </Modal>
  );
}

export function MessagesView() {
  const { state, actions } = useNexus();
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(
    state.conversations.find((conversation) => !conversation.archived)?.id ??
      state.conversations[0]?.id ??
      "",
  );
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [mobileChat, setMobileChat] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [storyOpen, setStoryOpen] = useState<Story | null | false>(false);

  const activeConversation =
    state.conversations.find((conversation) => conversation.id === activeId) ??
    state.conversations[0];
  const filtered = useMemo(
    () =>
      state.conversations
        .filter((conversation) => {
          const matchesQuery =
            `${conversation.name} ${conversation.messages[conversation.messages.length - 1]?.text ?? ""}`
              .toLowerCase()
              .includes(query.trim().toLowerCase());
          const matchesTab =
            tab === "all"
              ? !conversation.archived
              : tab === "groups"
                ? conversation.kind === "group" && !conversation.archived
                : tab === "unread"
                  ? conversation.unread > 0 && !conversation.archived
                  : conversation.archived;
          return matchesQuery && matchesTab;
        })
        .filter((conversation) => !pinnedOnly || conversation.pinned)
        .sort((a, b) => Number(b.pinned) - Number(a.pinned)),
    [pinnedOnly, query, state.conversations, tab],
  );

  function openConversation(id: string) {
    setActiveId(id);
    actions.openConversation(id);
    setMobileChat(true);
  }

  function openFriend(friend: Friend) {
    const id = actions.createConversation(friend);
    setNewOpen(false);
    openConversation(id);
  }

  return (
    <AppShell title="Messages" subtitle="Connect, chat, and share moments with your people.">
      <div className="nexus-messages-layout">
        <section className={cn("nexus-conversation-panel", mobileChat && "nexus-mobile-hidden")}>
          <div className="flex items-center justify-between gap-3 px-4 pb-3 sm:px-5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Inbox</span>
              <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-semibold text-primary">
                {state.conversations.filter((conversation) => !conversation.archived).length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <IconButton
                label={pinnedOnly ? "Show all conversations" : "Show pinned conversations"}
                active={pinnedOnly}
                onClick={() => setPinnedOnly((value) => !value)}
              >
                <Filter className="size-4" />
              </IconButton>
              <IconButton
                label="New message"
                onClick={() => setNewOpen(true)}
                className="bg-primary/15 text-primary hover:bg-primary/25"
              >
                <MessageCirclePlus className="size-4" />
              </IconButton>
            </div>
          </div>
          <div className="px-4 pb-3 sm:px-5">
            <label className="nexus-search-field">
              <Search className="size-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search messages, people, groups"
              />
              <kbd>⌘ K</kbd>
            </label>
          </div>
          <div className="nexus-tab-row px-4 pb-3 sm:px-5">
            {tabs.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={cn("nexus-tab", tab === item && "nexus-tab-active")}
              >
                {item === "all"
                  ? "All"
                  : item === "groups"
                    ? "Groups"
                    : item === "unread"
                      ? "Unread"
                      : "Archived"}
                {item === "archived" && (
                  <span className="ml-1 text-[9px]">
                    {state.conversations.filter((conversation) => conversation.archived).length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <StatusStrip
            stories={state.stories}
            onOpen={(story) => {
              actions.markStoryViewed(story.id);
              setStoryOpen(story);
            }}
            onAdd={() => setStoryOpen(null)}
          />
          <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-3 pb-4">
            {filtered.length === 0 ? (
              <EmptyState
                icon={<MessageCirclePlus className="size-6" />}
                title="Nothing here yet"
                description={
                  query
                    ? "Try a different search or clear the filter."
                    : "Your archived and unread conversations will appear here."
                }
                action={
                  <button
                    type="button"
                    className="nexus-secondary-button"
                    onClick={() => {
                      setQuery("");
                      setTab("all");
                    }}
                  >
                    View all messages
                  </button>
                }
              />
            ) : (
              <>
                {filtered.some((conversation) => conversation.pinned && tab !== "archived") && (
                  <p className="nexus-list-label">Pinned</p>
                )}
                {filtered.map((conversation) => (
                  <ConversationRow
                    key={conversation.id}
                    conversation={conversation}
                    active={conversation.id === activeId}
                    onOpen={() => openConversation(conversation.id)}
                  />
                ))}
              </>
            )}
          </div>
        </section>
        <section className={cn("nexus-chat-panel", !mobileChat && "nexus-mobile-hidden-chat")}>
          {activeConversation ? (
            <ChatView conversation={activeConversation} onBack={() => setMobileChat(false)} />
          ) : (
            <EmptyState
              icon={<MessageCirclePlus className="size-6" />}
              title="Choose a conversation"
              description="Open a conversation to start chatting."
            />
          )}
        </section>
      </div>
      {newOpen && (
        <NewConversationModal
          friends={state.friends}
          onClose={() => setNewOpen(false)}
          onOpen={openFriend}
        />
      )}
      {storyOpen !== false && (
        <StatusModal
          story={storyOpen || undefined}
          onClose={() => setStoryOpen(false)}
          onSave={(content) => {
            actions.addStory({ kind: "text", content, image: "" });
            setStoryOpen(false);
          }}
        />
      )}
    </AppShell>
  );
}
