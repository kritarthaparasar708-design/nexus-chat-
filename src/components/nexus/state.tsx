import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AuthError, Session, User as AuthUser } from "@supabase/supabase-js";
import { createInitialState, EMPTY_USER, profileToUser, userToFriend } from "./data";
import type {
  Conversation,
  Friend,
  Message,
  NewMessageInput,
  Notification,
  Profile,
  Settings,
  Story,
  User,
  NexusState,
} from "./types";
import { isSupabaseConfigured, requireSupabase, supabase } from "@/lib/supabase";
import {
  createDirectConversation,
  fetchConversations,
  fetchMessage,
  fetchMessages,
  fetchProfile,
  searchProfiles,
  sendMessage as persistMessage,
} from "@/lib/chat-api";
import type { Database } from "@/lib/database.types";

type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
type RealtimeStatus = "connecting" | "connected" | "disconnected" | "error";
type ProfileInput = { displayName: string; username: string; bio: string; avatarUrl?: string | null };

type NexusActions = {
  openConversation: (conversationId: string) => Promise<void>;
  closeConversation: (conversationId: string) => void;
  sendMessage: (conversationId: string, input: NewMessageInput) => Promise<void>;
  createConversation: (friend: Friend | User) => Promise<string>;
  updateProfile: (patch: Partial<User>) => Promise<void>;
  saveProfile: (input: ProfileInput) => Promise<Profile>;
  uploadAvatar: (file: File) => Promise<string>;
  searchUsers: (query: string) => Promise<User[]>;
  getProfile: (userId: string) => Promise<User | null>;
  signUp: (email: string, phone: string, password: string) => Promise<void>;
  signIn: (identifier: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  sendPhoneVerification: () => Promise<void>;
  verifyPhone: (token: string) => Promise<void>;
  setSettings: (patch: Partial<Settings>) => void;
  addRecentSearch: (query: string) => void;
  removeRecentSearch: (query: string) => void;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
};

type NexusContextValue = {
  state: NexusState;
  hydrated: boolean;
  unreadNotifications: number;
  actions: NexusActions;
  authUser: AuthUser | null;
  authSession: Session | null;
  authLoading: boolean;
  authConfigured: boolean;
  authError: string | null;
  profile: Profile | null;
  profileLoading: boolean;
  profileError: string | null;
  conversationLoading: boolean;
  conversationError: string | null;
  activeConversationId: string | null;
  messagesLoading: boolean;
  messageError: string | null;
  realtimeStatus: RealtimeStatus;
  passwordRecovery: boolean;
};

export type AuthState = Pick<
  NexusContextValue,
  "authUser" | "authSession" | "authLoading" | "authConfigured" | "authError"
>;

const NexusContext = createContext<NexusContextValue | null>(null);

function readableError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function asMessageRow(payload: unknown): MessageRow | null {
  if (typeof payload !== "object" || payload === null) return null;
  const row = payload as Record<string, unknown>;
  if (
    typeof row["id"] !== "string" ||
    typeof row["conversation_id"] !== "string" ||
    typeof row["sender_id"] !== "string" ||
    typeof row["body"] !== "string" ||
    typeof row["created_at"] !== "string" ||
    typeof row["updated_at"] !== "string"
  ) return null;
  return {
    id: row["id"],
    conversation_id: row["conversation_id"],
    sender_id: row["sender_id"],
    body: row["body"],
    created_at: row["created_at"],
    updated_at: row["updated_at"],
  };
}

function sortMessages(messages: Message[]): Message[] {
  return [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
}

function mergeMessage(messages: Message[], incoming: Message): Message[] {
  const persistedMessages = messages.filter((message) => !message.id.startsWith("preview-"));
  if (persistedMessages.some((message) => message.id === incoming.id)) return persistedMessages;
  return sortMessages([...persistedMessages, incoming]);
}

function mergeMessages(existing: Message[], incoming: Message[]): Message[] {
  const byId = new Map(existing
    .filter((message) => !message.id.startsWith("preview-"))
    .map((message) => [message.id, message]));
  for (const message of incoming) byId.set(message.id, message);
  return sortMessages([...byId.values()]);
}

function profileUsernameError(error: unknown): Error {
  const message = readableError(error, "Unable to save your profile.");
  if (message.toLowerCase().includes("profiles_username_lower_unique") || message.includes("23505")) {
    return new Error("Username already taken.");
  }
  return new Error(message);
}

export function NexusProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NexusState>(() => createInitialState());
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authSession, setAuthSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [conversationError, setConversationError] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>("disconnected");
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const channelRef = useRef<ReturnType<NonNullable<typeof supabase>["channel"]> | null>(null);
  const sessionGeneration = useRef(0);
  const activeConversationRef = useRef<string | null>(null);
  const profileRef = useRef<Profile | null>(null);

  const applySession = useCallback(async (session: Session | null) => {
    const generation = ++sessionGeneration.current;
    setAuthSession(session);
    setAuthUser(session?.user ?? null);
    setAuthError(null);
    setProfileError(null);
    setConversationError(null);
    setActiveConversationId(null);
    activeConversationRef.current = null;
    setMessagesLoading(false);
    setMessageError(null);
    channelRef.current?.unsubscribe();
    channelRef.current = null;
    setRealtimeStatus("disconnected");

    if (!session?.user) {
      profileRef.current = null;
      setProfile(null);
      setProfileLoading(false);
      setConversationLoading(false);
      setState((previous) => ({ ...createInitialState(), settings: previous.settings }));
      setAuthLoading(false);
      return;
    }

    setProfile(null);
    profileRef.current = null;
    setState((previous) => ({ ...createInitialState(), settings: previous.settings }));
    setProfileLoading(true);
    setConversationLoading(true);
    try {
      const nextProfile = await fetchProfile(session.user.id);
      if (generation !== sessionGeneration.current) return;
      profileRef.current = nextProfile;
      setProfile(nextProfile);
      if (nextProfile) {
        setState((previous) => ({ ...previous, currentUser: profileToUser(nextProfile) }));
        try {
          const conversations = await fetchConversations(session.user.id);
          if (generation !== sessionGeneration.current) return;
          setState((previous) => ({ ...previous, conversations }));
          setConversationError(null);
        } catch (error) {
          if (generation === sessionGeneration.current) {
            setConversationError(readableError(error, "Unable to load conversations."));
          }
        }
      }
    } catch (error) {
      if (generation === sessionGeneration.current) {
        setProfileError(readableError(error, "Unable to load your profile."));
      }
    } finally {
      if (generation === sessionGeneration.current) {
        setProfileLoading(false);
        setConversationLoading(false);
        setAuthLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthLoading(false);
      return;
    }
    let mounted = true;
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY") setPasswordRecovery(true);
      if (event === "SIGNED_OUT") setPasswordRecovery(false);
      setAuthSession(session);
      setAuthUser(session?.user ?? null);
      // Defer Supabase requests until after the auth callback releases its internal lock.
      window.setTimeout(() => {
        if (mounted) void applySession(session);
      }, 0);
    });
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) setAuthError(error.message);
      void applySession(data.session);
    });
    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
      channelRef.current?.unsubscribe();
      channelRef.current = null;
    };
  }, [applySession]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("light", state.settings.theme === "light");
    document.documentElement.style.colorScheme = state.settings.theme;
  }, [state.settings.theme]);

  const signUp = useCallback(async (email: string, phone: string, password: string) => {
    setAuthError(null);
    const origin = typeof window === "undefined" ? "" : window.location.origin;
    const { data, error } = await requireSupabase().auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/verify`,
        data: { signup_phone: phone },
      },
    });
    if (error) {
      setAuthError(error.message);
      throw error;
    }
    if (data.session) await applySession(data.session);
  }, [applySession]);

  const signIn = useCallback(async (identifier: string, password: string) => {
    setAuthError(null);
    const client = requireSupabase();
    const value = identifier.trim();
    const isPhone = /^\+?[\d\s().-]+$/.test(value) && /\d{7,}/.test(value);
    const credentials = isPhone
      ? { phone: value.replace(/[\s().-]/g, ""), password }
      : { email: value, password };
    const { data, error } = await client.auth.signInWithPassword(credentials);
    if (error) {
      setAuthError(error.message);
      throw error;
    }
    await applySession(data.session);
  }, [applySession]);

  const signOut = useCallback(async () => {
    setAuthError(null);
    const { error } = await requireSupabase().auth.signOut();
    if (error) {
      setAuthError(error.message);
      throw error;
    }
    await applySession(null);
  }, [applySession]);

  const requestPasswordReset = useCallback(async (email: string) => {
    const options = typeof window === "undefined" ? {} : { redirectTo: `${window.location.origin}/reset-password` };
    const { error } = await requireSupabase().auth.resetPasswordForEmail(email, options);
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await requireSupabase().auth.updateUser({ password });
    if (error) throw error;
    setPasswordRecovery(false);
  }, []);

  const sendPhoneVerification = useCallback(async () => {
    if (!authUser) throw new Error("Sign in and verify your email before verifying your phone.");
    const rawPhone: unknown = authUser.user_metadata["signup_phone"];
    if (typeof rawPhone !== "string" || !rawPhone) throw new Error("No signup phone number was found.");
    if (authUser.phone === rawPhone && authUser.phone_confirmed_at) return;
    const { error } = await requireSupabase().auth.updateUser({ phone: rawPhone });
    if (error) throw error;
  }, [authUser]);

  const verifyPhone = useCallback(async (token: string) => {
    if (!authUser) throw new Error("Your verification session has expired. Sign in again.");
    const rawPhone: unknown = authUser.user_metadata["signup_phone"];
    if (typeof rawPhone !== "string" || !rawPhone) throw new Error("No signup phone number was found.");
    const { data, error } = await requireSupabase().auth.verifyOtp({ phone: rawPhone, token, type: "phone_change" });
    if (error) throw error;
    if (!data.user?.phone_confirmed_at) throw new Error("Supabase did not confirm this phone number.");
    await applySession(data.session);
  }, [applySession, authUser]);

  const saveProfile = useCallback(async (input: ProfileInput): Promise<Profile> => {
    if (!authUser) throw new Error("Sign in before completing your profile.");
    const displayName = input.displayName.trim();
    const username = input.username.trim().replace(/^@/, "");
    if (!displayName) throw new Error("Full name is required.");
    if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
      throw new Error("Username must be 3 to 20 characters using letters, numbers, or underscores.");
    }
    try {
      const { data, error } = await requireSupabase()
        .from("profiles")
        .upsert({
          id: authUser.id,
          display_name: displayName,
          username,
          bio: input.bio.trim(),
          avatar_url: input.avatarUrl ?? profileRef.current?.avatar_url ?? null,
        })
        .select("*")
        .single();
      if (error) throw error;
      profileRef.current = data;
      setProfile(data);
      setProfileError(null);
      setState((previous) => ({ ...previous, currentUser: profileToUser(data) }));
      return data;
    } catch (error) {
      throw profileUsernameError(error);
    }
  }, [authUser]);

  const uploadAvatar = useCallback(async (file: File) => {
    if (!authUser) throw new Error("Sign in before uploading a profile picture.");
    if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
    if (file.size > 5 * 1024 * 1024) throw new Error("Profile images must be 5 MB or smaller.");
    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${authUser.id}/${crypto.randomUUID()}.${extension}`;
    const { error } = await requireSupabase().storage.from("avatars").upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });
    if (error) throw error;
    const { data } = requireSupabase().storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  }, [authUser]);

  const searchUsers = useCallback(async (query: string) => {
    if (!authUser) throw new Error("Sign in to search for people.");
    const profiles = await searchProfiles(query, authUser.id);
    return profiles.map(profileToUser);
  }, [authUser]);

  const getProfile = useCallback(async (userId: string) => {
    if (!authUser) throw new Error("Sign in to view profiles.");
    const result = await fetchProfile(userId);
    return result ? profileToUser(result) : null;
  }, [authUser]);

  const openConversation = useCallback(async (conversationId: string) => {
    if (!authUser) throw new Error("Sign in to open conversations.");
    const client = requireSupabase();
    activeConversationRef.current = conversationId;
    setActiveConversationId(conversationId);
    setMessagesLoading(true);
    setMessageError(null);
    setRealtimeStatus("connecting");
    channelRef.current?.unsubscribe();
    let resolveSubscribed: (connected: boolean) => void = () => {};
    const subscriptionReady = new Promise<boolean>((resolve) => {
      resolveSubscribed = resolve;
    });
    const subscriptionTimer = window.setTimeout(() => resolveSubscribed(false), 5000);
    channelRef.current = client
      .channel(`messages:${conversationId}:${authUser?.id ?? "session"}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const row = asMessageRow(payload.new);
          if (!row || activeConversationRef.current !== conversationId) return;
          void fetchMessage(row).then((message) => {
            if (activeConversationRef.current !== conversationId) return;
            setState((previous) => ({
              ...previous,
              conversations: previous.conversations.map((conversation) => conversation.id === conversationId
                ? { ...conversation, messages: mergeMessage(conversation.messages, message) }
                : conversation),
            }));
          }).catch((error: unknown) => setMessageError(readableError(error, "Unable to load a new message.")));
        },
      )
      .subscribe((status) => {
        if (activeConversationRef.current !== conversationId) return;
        if (status === "SUBSCRIBED") {
          setRealtimeStatus("connected");
          resolveSubscribed(true);
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setRealtimeStatus("error");
          resolveSubscribed(false);
        }
        else setRealtimeStatus("connecting");
      });

    try {
      // Subscribe first so a message arriving during history loading is also delivered live.
      await subscriptionReady;
      window.clearTimeout(subscriptionTimer);
      if (activeConversationRef.current !== conversationId) return;
      const messages = await fetchMessages(conversationId);
      if (activeConversationRef.current !== conversationId) return;
      setState((previous) => ({
        ...previous,
        conversations: previous.conversations.map((conversation) => conversation.id === conversationId
          ? { ...conversation, messages: mergeMessages(conversation.messages, messages) }
          : conversation),
      }));
    } catch (error) {
      if (activeConversationRef.current === conversationId) {
        setMessageError(readableError(error, "Unable to load messages."));
      }
    } finally {
      window.clearTimeout(subscriptionTimer);
      if (activeConversationRef.current === conversationId) setMessagesLoading(false);
    }
  }, [authUser?.id]);

  const closeConversation = useCallback((conversationId: string) => {
    if (activeConversationRef.current !== conversationId) return;
    activeConversationRef.current = null;
    channelRef.current?.unsubscribe();
    channelRef.current = null;
    setActiveConversationId(null);
    setMessagesLoading(false);
    setRealtimeStatus("disconnected");
  }, []);

  const sendMessage = useCallback(async (conversationId: string, input: NewMessageInput) => {
    if (!authUser) throw new Error("Sign in to send messages.");
    const body = input.text.trim();
    if (!body) return;
    const saved = await persistMessage(conversationId, authUser.id, body);
    setState((previous) => ({
      ...previous,
      conversations: previous.conversations.map((conversation) => conversation.id === conversationId
        ? { ...conversation, messages: mergeMessage(conversation.messages, saved) }
        : conversation),
    }));
    setMessageError(null);
  }, [authUser]);

  const createConversation = useCallback(async (friend: Friend | User) => {
    if (!authUser) throw new Error("Sign in to start a conversation.");
    const conversationId = await createDirectConversation(friend.id);
    const conversations = await fetchConversations(authUser.id);
    setState((previous) => ({ ...previous, conversations }));
    return conversationId;
  }, [authUser]);

  const updateProfile = useCallback(async (patch: Partial<User>) => {
    const active = profileRef.current;
    if (!active) throw new Error("Complete your profile before editing it.");
    await saveProfile({
      displayName: patch.name ?? active.display_name,
      username: patch.username?.replace(/^@/, "") ?? active.username,
      bio: patch.bio ?? active.bio,
      avatarUrl: patch.avatar ?? active.avatar_url,
    });
  }, [saveProfile]);

  const setSettings = useCallback((patch: Partial<Settings>) => {
    setState((previous) => ({ ...previous, settings: { ...previous.settings, ...patch } }));
  }, []);
  const addRecentSearch = useCallback((query: string) => {
    const clean = query.trim();
    if (!clean) return;
    setState((previous) => ({ ...previous, recentSearches: [clean, ...previous.recentSearches.filter((value) => value !== clean)].slice(0, 8) }));
  }, []);
  const removeRecentSearch = useCallback((query: string) => {
    setState((previous) => ({ ...previous, recentSearches: previous.recentSearches.filter((value) => value !== query) }));
  }, []);
  const markNotificationRead = useCallback((_notificationId: string) => {}, []);
  const markAllNotificationsRead = useCallback(() => {}, []);

  const actions = useMemo<NexusActions>(() => ({
    openConversation,
    closeConversation,
    sendMessage,
    createConversation,
    updateProfile,
    saveProfile,
    uploadAvatar,
    searchUsers,
    getProfile,
    signUp,
    signIn,
    signOut,
    requestPasswordReset,
    updatePassword,
    sendPhoneVerification,
    verifyPhone,
    setSettings,
    addRecentSearch,
    removeRecentSearch,
    markNotificationRead,
    markAllNotificationsRead,
  }), [
    openConversation, closeConversation, sendMessage, createConversation, updateProfile, saveProfile, uploadAvatar,
    searchUsers, getProfile, signUp, signIn, signOut, requestPasswordReset, updatePassword,
    sendPhoneVerification, verifyPhone, setSettings, addRecentSearch, removeRecentSearch,
    markNotificationRead, markAllNotificationsRead,
  ]);

  const value = useMemo<NexusContextValue>(() => ({
    state,
    hydrated: !authLoading,
    unreadNotifications: 0,
    actions,
    authUser,
    authSession,
    authLoading,
    authConfigured: isSupabaseConfigured,
    authError,
    profile,
    profileLoading,
    profileError,
    conversationLoading,
    conversationError,
    activeConversationId,
    messagesLoading,
    messageError,
    realtimeStatus,
    passwordRecovery,
  }), [
    state, actions, authUser, authSession, authLoading, authError, profile, profileLoading,
    profileError, conversationLoading, conversationError, activeConversationId, messagesLoading,
    messageError, realtimeStatus, passwordRecovery,
  ]);

  return <NexusContext.Provider value={value}>{children}</NexusContext.Provider>;
}

export function useNexus() {
  const context = useContext(NexusContext);
  if (!context) throw new Error("useNexus must be used within NexusProvider");
  return context;
}

export function supabaseError(error: unknown): AuthError | null {
  return error instanceof Error ? (error as AuthError) : null;
}

export { userToFriend };
