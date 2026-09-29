import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createSeedState } from "./data";
import { loadPersistedState, savePersistedState } from "./storage";
import type {
  Attachment,
  Conversation,
  DemoState,
  Friend,
  Message,
  NewMessageInput,
  Notification,
  Settings,
  Story,
  User,
} from "./types";

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function findConversation(state: DemoState, conversationId: string): Conversation | undefined {
  return state.conversations.find((conversation) => conversation.id === conversationId);
}

type NexusActions = {
  openConversation: (conversationId: string) => void;
  sendMessage: (conversationId: string, input: NewMessageInput) => void;
  editMessage: (conversationId: string, messageId: string, text: string) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  toggleReaction: (conversationId: string, messageId: string, emoji: string) => void;
  toggleMessagePinned: (conversationId: string, messageId: string) => void;
  markConversationUnread: (conversationId: string) => void;
  setConversationFlag: (
    conversationId: string,
    flag: "pinned" | "muted" | "archived",
    value?: boolean,
  ) => void;
  removeConversation: (conversationId: string) => void;
  createConversation: (friend: Friend) => string;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  addNotification: (notification: Omit<Notification, "id" | "createdAt" | "read">) => void;
  updateProfile: (patch: Partial<User>) => void;
  addFriend: (name: string, username: string) => void;
  updateFriendState: (friendId: string, state: Friend["state"]) => void;
  addStory: (story: Pick<Story, "kind" | "content" | "image">) => void;
  markStoryViewed: (storyId: string) => void;
  addRecentSearch: (query: string) => void;
  removeRecentSearch: (query: string) => void;
  setSettings: (patch: Partial<Settings>) => void;
  setSession: (patch: Partial<DemoState["session"]>) => void;
  resetDemo: () => void;
};

type NexusContextValue = {
  state: DemoState;
  hydrated: boolean;
  unreadNotifications: number;
  actions: NexusActions;
};

const NexusContext = createContext<NexusContextValue | null>(null);

export function NexusProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(() => createSeedState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const persisted = loadPersistedState();
    if (persisted) setState(persisted);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) savePersistedState(state);
  }, [hydrated, state]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("light", state.settings.theme === "light");
    document.documentElement.style.colorScheme = state.settings.theme;
  }, [state.settings.theme]);

  const openConversation = useCallback((conversationId: string) => {
    setState((previous) => ({
      ...previous,
      conversations: previous.conversations.map((conversation) =>
        conversation.id === conversationId ? { ...conversation, unread: 0 } : conversation,
      ),
    }));
  }, []);

  const sendMessage = useCallback((conversationId: string, input: NewMessageInput) => {
    const text = input.text.trim();
    if (!text && !input.attachments?.length) return;

    setState((previous) => {
      const conversation = findConversation(previous, conversationId);
      if (!conversation) return previous;

      const message: Message = {
        id: createId("message"),
        conversationId,
        authorId: previous.currentUser.id,
        authorName: previous.currentUser.name,
        authorInitials: previous.currentUser.initials,
        authorAvatar: previous.currentUser.avatar,
        text,
        createdAt: new Date().toISOString(),
        status: "read",
        attachments: input.attachments ?? [],
        replyToId: input.replyToId ?? null,
        reactions: {},
        edited: false,
        pinned: false,
        deleted: false,
      };

      return {
        ...previous,
        conversations: previous.conversations.map((item) =>
          item.id === conversationId
            ? { ...item, unread: 0, typing: false, messages: [...item.messages, message] }
            : item,
        ),
      };
    });
  }, []);

  const editMessage = useCallback((conversationId: string, messageId: string, text: string) => {
    const nextText = text.trim();
    if (!nextText) return;
    setState((previous) => ({
      ...previous,
      conversations: previous.conversations.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              messages: conversation.messages.map((message) =>
                message.id === messageId ? { ...message, text: nextText, edited: true } : message,
              ),
            }
          : conversation,
      ),
    }));
  }, []);

  const deleteMessage = useCallback((conversationId: string, messageId: string) => {
    setState((previous) => ({
      ...previous,
      conversations: previous.conversations.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              messages: conversation.messages.map((message) =>
                message.id === messageId
                  ? { ...message, text: "This message was deleted", deleted: true, attachments: [] }
                  : message,
              ),
            }
          : conversation,
      ),
    }));
  }, []);

  const toggleReaction = useCallback((conversationId: string, messageId: string, emoji: string) => {
    setState((previous) => ({
      ...previous,
      conversations: previous.conversations.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              messages: conversation.messages.map((message) => {
                if (message.id !== messageId) return message;
                const current = message.reactions[emoji] ?? [];
                const hasReacted = current.includes(previous.currentUser.id);
                return {
                  ...message,
                  reactions: {
                    ...message.reactions,
                    [emoji]: hasReacted
                      ? current.filter((id) => id !== previous.currentUser.id)
                      : [...current, previous.currentUser.id],
                  },
                };
              }),
            }
          : conversation,
      ),
    }));
  }, []);

  const toggleMessagePinned = useCallback((conversationId: string, messageId: string) => {
    setState((previous) => ({
      ...previous,
      conversations: previous.conversations.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              messages: conversation.messages.map((message) =>
                message.id === messageId ? { ...message, pinned: !message.pinned } : message,
              ),
            }
          : conversation,
      ),
    }));
  }, []);

  const markConversationUnread = useCallback((conversationId: string) => {
    setState((previous) => ({
      ...previous,
      conversations: previous.conversations.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, unread: Math.max(conversation.unread, 1) }
          : conversation,
      ),
    }));
  }, []);

  const setConversationFlag = useCallback(
    (conversationId: string, flag: "pinned" | "muted" | "archived", value?: boolean) => {
      setState((previous) => ({
        ...previous,
        conversations: previous.conversations.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, [flag]: value ?? !conversation[flag] }
            : conversation,
        ),
      }));
    },
    [],
  );

  const removeConversation = useCallback((conversationId: string) => {
    setState((previous) => ({
      ...previous,
      conversations: previous.conversations.filter(
        (conversation) => conversation.id !== conversationId,
      ),
    }));
  }, []);

  const createConversation = useCallback((friend: Friend) => {
    let createdId = friend.id;
    setState((previous) => {
      const existing = previous.conversations.find(
        (conversation) =>
          conversation.memberIds.includes(friend.id) && conversation.kind === "direct",
      );
      if (existing) {
        createdId = existing.id;
        return previous;
      }

      const newConversation: Conversation = {
        id: `direct-${friend.id}`,
        kind: "direct",
        name: friend.name,
        initials: friend.initials,
        avatar: friend.avatar,
        status: friend.status,
        lastSeen: friend.lastSeen,
        unread: 0,
        pinned: false,
        muted: false,
        archived: false,
        typing: false,
        memberIds: [previous.currentUser.id, friend.id],
        groupDescription: "Direct conversation",
        messages: [],
      };
      createdId = newConversation.id;
      return { ...previous, conversations: [newConversation, ...previous.conversations] };
    });
    return createdId;
  }, []);

  const markNotificationRead = useCallback((notificationId: string) => {
    setState((previous) => ({
      ...previous,
      notifications: previous.notifications.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification,
      ),
    }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setState((previous) => ({
      ...previous,
      notifications: previous.notifications.map((notification) => ({
        ...notification,
        read: true,
      })),
    }));
  }, []);

  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "createdAt" | "read">) => {
      setState((previous) => ({
        ...previous,
        notifications: [
          {
            ...notification,
            id: createId("notification"),
            createdAt: new Date().toISOString(),
            read: false,
          },
          ...previous.notifications,
        ],
      }));
    },
    [],
  );

  const updateProfile = useCallback((patch: Partial<User>) => {
    setState((previous) => ({
      ...previous,
      currentUser: { ...previous.currentUser, ...patch },
    }));
  }, []);

  const addFriend = useCallback((name: string, username: string) => {
    const cleanName = name.trim();
    const cleanUsername = username.trim().replace(/^@/, "");
    if (!cleanName || !cleanUsername) return;
    setState((previous) => ({
      ...previous,
      friends: [
        {
          id: createId("friend"),
          name: cleanName,
          username: `@${cleanUsername}`,
          initials: cleanName
            .split(" ")
            .map((part) => part[0] ?? "")
            .join("")
            .slice(0, 2)
            .toUpperCase(),
          avatar: "",
          status: "offline",
          lastSeen: "Request pending",
          state: "pending-outgoing",
          mutualGroups: 0,
        },
        ...previous.friends,
      ],
    }));
  }, []);

  const updateFriendState = useCallback((friendId: string, state: Friend["state"]) => {
    setState((previous) => ({
      ...previous,
      friends: previous.friends.map((friend) =>
        friend.id === friendId ? { ...friend, state } : friend,
      ),
    }));
  }, []);

  const addStory = useCallback((story: Pick<Story, "kind" | "content" | "image">) => {
    setState((previous) => ({
      ...previous,
      stories: [
        {
          id: createId("story"),
          authorId: previous.currentUser.id,
          name: "Your status",
          initials: previous.currentUser.initials,
          avatar: previous.currentUser.avatar,
          kind: story.kind,
          content: story.content,
          image: story.image,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
          viewed: true,
        },
        ...previous.stories.filter((item) => item.authorId !== previous.currentUser.id),
      ],
    }));
  }, []);

  const markStoryViewed = useCallback((storyId: string) => {
    setState((previous) => ({
      ...previous,
      stories: previous.stories.map((story) =>
        story.id === storyId ? { ...story, viewed: true } : story,
      ),
    }));
  }, []);

  const addRecentSearch = useCallback((query: string) => {
    const clean = query.trim();
    if (!clean) return;
    setState((previous) => ({
      ...previous,
      recentSearches: [
        clean,
        ...previous.recentSearches.filter((item) => item.toLowerCase() !== clean.toLowerCase()),
      ].slice(0, 8),
    }));
  }, []);

  const removeRecentSearch = useCallback((query: string) => {
    setState((previous) => ({
      ...previous,
      recentSearches: previous.recentSearches.filter((item) => item !== query),
    }));
  }, []);

  const setSettings = useCallback((patch: Partial<Settings>) => {
    setState((previous) => ({ ...previous, settings: { ...previous.settings, ...patch } }));
  }, []);

  const setSession = useCallback((patch: Partial<DemoState["session"]>) => {
    setState((previous) => ({ ...previous, session: { ...previous.session, ...patch } }));
  }, []);

  const resetDemo = useCallback(() => {
    setState(createSeedState());
  }, []);

  const actions = useMemo<NexusActions>(
    () => ({
      openConversation,
      sendMessage,
      editMessage,
      deleteMessage,
      toggleReaction,
      toggleMessagePinned,
      markConversationUnread,
      setConversationFlag,
      removeConversation,
      createConversation,
      markNotificationRead,
      markAllNotificationsRead,
      addNotification,
      updateProfile,
      addFriend,
      updateFriendState,
      addStory,
      markStoryViewed,
      addRecentSearch,
      removeRecentSearch,
      setSettings,
      setSession,
      resetDemo,
    }),
    [
      addFriend,
      addNotification,
      addRecentSearch,
      addStory,
      createConversation,
      deleteMessage,
      editMessage,
      markAllNotificationsRead,
      markConversationUnread,
      markNotificationRead,
      markStoryViewed,
      openConversation,
      removeConversation,
      removeRecentSearch,
      resetDemo,
      sendMessage,
      setConversationFlag,
      setSession,
      setSettings,
      toggleMessagePinned,
      toggleReaction,
      updateFriendState,
      updateProfile,
    ],
  );

  const value = useMemo<NexusContextValue>(
    () => ({
      state,
      hydrated,
      unreadNotifications: state.notifications.filter((notification) => !notification.read).length,
      actions,
    }),
    [actions, hydrated, state],
  );

  return <NexusContext.Provider value={value}>{children}</NexusContext.Provider>;
}

export function useNexus(): NexusContextValue {
  const context = useContext(NexusContext);
  if (!context) throw new Error("useNexus must be used inside NexusProvider");
  return context;
}
