import type { Profile, User, Message, Conversation } from "@/components/nexus/types";
import { profileToUser } from "@/components/nexus/data";
import { requireSupabase } from "./supabase";
import type { Database } from "./database.types";

type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
type ConversationRow = Database["public"]["Tables"]["conversations"]["Row"];
type MembershipRow = Database["public"]["Tables"]["conversation_members"]["Row"];

export function profileFromRow(profile: Profile): User {
  return profileToUser(profile);
}

function toMessage(row: MessageRow, sender: Profile | undefined): Message {
  const author = sender ? profileToUser(sender) : null;
  return {
    id: row.id,
    conversationId: row.conversation_id,
    authorId: row.sender_id,
    authorName: author?.name ?? "Former member",
    authorInitials: author?.initials ?? "",
    authorAvatar: author?.avatar ?? "",
    text: row.body,
    createdAt: row.created_at,
    status: "sent",
    attachments: [],
    replyToId: null,
    reactions: {},
    edited: row.updated_at !== row.created_at,
    pinned: false,
    deleted: false,
  };
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await requireSupabase()
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function searchProfiles(query: string, excludeUserId?: string): Promise<Profile[]> {
  const client = requireSupabase();
  const safe = query.trim().replace(/^@/, "").replace(/[^A-Za-z0-9_ ]/g, " ").replace(/\s+/g, " ");
  let request = client.from("profiles").select("*").order("display_name").limit(50);
  if (excludeUserId) request = request.neq("id", excludeUserId);
  if (safe) {
    const pattern = `%${safe}%`;
    request = request.or(`display_name.ilike.${pattern},username.ilike.${pattern}`);
  }
  const { data, error } = await request;
  if (error) throw error;
  return data ?? [];
}

function latestPreview(conversation: ConversationRow, profiles: Map<string, Profile>): Message[] {
  if (!conversation.last_message || !conversation.last_message_at || !conversation.last_sender_id) {
    return [];
  }
  const row: MessageRow = {
    id: `preview-${conversation.id}`,
    conversation_id: conversation.id,
    sender_id: conversation.last_sender_id,
    body: conversation.last_message,
    created_at: conversation.last_message_at,
    updated_at: conversation.last_message_at,
  };
  return [toMessage(row, profiles.get(conversation.last_sender_id))];
}

export async function fetchConversations(userId: string): Promise<Conversation[]> {
  const client = requireSupabase();
  const membershipsResult = await client
    .from("conversation_members")
    .select("conversation_id,user_id,created_at")
    .eq("user_id", userId);
  if (membershipsResult.error) throw membershipsResult.error;
  const memberships: MembershipRow[] = membershipsResult.data ?? [];
  const conversationIds = [...new Set(memberships.map((member) => member.conversation_id))];
  if (conversationIds.length === 0) return [];

  const [conversationsResult, membersResult] = await Promise.all([
    client
      .from("conversations")
      .select("id,is_group,created_at,direct_user_low,direct_user_high,last_message,last_message_at,last_sender_id")
      .in("id", conversationIds)
      .order("last_message_at", { ascending: false, nullsFirst: false }),
    client
      .from("conversation_members")
      .select("conversation_id,user_id,created_at")
      .in("conversation_id", conversationIds),
  ]);
  if (conversationsResult.error) throw conversationsResult.error;
  if (membersResult.error) throw membersResult.error;

  const conversations: ConversationRow[] = conversationsResult.data ?? [];
  const members: MembershipRow[] = membersResult.data ?? [];
  const otherIds = [...new Set(members.map((member) => member.user_id).filter((id) => id !== userId))];
  const previewSenderIds = conversations
    .map((conversation) => conversation.last_sender_id)
    .filter((id): id is string => Boolean(id));
  const profileIds = [...new Set([...otherIds, ...previewSenderIds])];
  const profilesResult = profileIds.length
    ? await client.from("profiles").select("*").in("id", profileIds)
    : { data: [], error: null };
  if (profilesResult.error) throw profilesResult.error;
  const profiles = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile]));
  const memberIdsByConversation = new Map<string, string[]>();
  for (const member of members) {
    const ids = memberIdsByConversation.get(member.conversation_id) ?? [];
    ids.push(member.user_id);
    memberIdsByConversation.set(member.conversation_id, ids);
  }

  return conversations.flatMap((conversation) => {
    const ids = memberIdsByConversation.get(conversation.id) ?? [];
    const otherId = ids.find((id) => id !== userId);
    const peerProfile = otherId ? profiles.get(otherId) : undefined;
    if (!peerProfile || conversation.is_group) return [];
    const peer = profileToUser(peerProfile);
    return [{
      id: conversation.id,
      kind: "direct" as const,
      name: peer.name,
      username: peer.username,
      initials: peer.initials,
      avatar: peer.avatar,
      unread: 0,
      pinned: false,
      muted: false,
      archived: false,
      typing: false,
      memberIds: ids,
      groupDescription: "",
      messages: latestPreview(conversation, profiles),
    }];
  });
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const client = requireSupabase();
  const pageSize = 1000;
  const rows: MessageRow[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await client
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    const page: MessageRow[] = data ?? [];
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  if (rows.length === 0) return [];

  const senderIds = [...new Set(rows.map((row) => row.sender_id))];
  const { data: profiles, error } = await client.from("profiles").select("*").in("id", senderIds);
  if (error) throw error;
  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  return rows.map((row) => toMessage(row, profilesById.get(row.sender_id)));
}

export async function fetchMessage(row: MessageRow): Promise<Message> {
  const { data, error } = await requireSupabase().from("profiles").select("*").eq("id", row.sender_id).maybeSingle();
  if (error) throw error;
  return toMessage(row, data ?? undefined);
}

export async function createDirectConversation(targetUserId: string): Promise<string> {
  const { data, error } = await requireSupabase().rpc("create_direct_conversation", {
    target_user_id: targetUserId,
  });
  if (error) throw error;
  return data;
}

export async function sendMessage(conversationId: string, senderId: string, body: string): Promise<Message> {
  const { data, error } = await requireSupabase()
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, body })
    .select("*")
    .single();
  if (error) throw error;
  return fetchMessage(data);
}
