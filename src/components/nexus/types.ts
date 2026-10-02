export type Presence = "online" | "away" | "offline";
export type ConversationKind = "direct" | "group";
export type MessageStatus = "sending" | "sent" | "delivered" | "read";
export type AttachmentKind = "image" | "video" | "file" | "audio";

export type Attachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  kind: AttachmentKind;
  url: string;
  previewUrl: string;
  progress: number;
};

export type User = {
  id: string;
  name: string;
  username: string;
  initials: string;
  avatar: string;
  bio: string;
  email: string;
  phone: string;
  website: string;
  location: string;
  joinedAt: string;
};

export type Profile = {
  id: string;
  display_name: string;
  username: string;
  bio: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  conversationId: string;
  authorId: string;
  authorName: string;
  authorInitials: string;
  authorAvatar: string;
  text: string;
  createdAt: string;
  status: MessageStatus;
  attachments: Attachment[];
  replyToId: string | null;
  reactions: Record<string, string[]>;
  edited: boolean;
  pinned: boolean;
  deleted: boolean;
};

export type Conversation = {
  id: string;
  kind: ConversationKind;
  name: string;
  username: string;
  initials: string;
  avatar: string;
  unread: number;
  pinned: boolean;
  muted: boolean;
  archived: boolean;
  typing: boolean;
  memberIds: string[];
  groupDescription: string;
  messages: Message[];
};

export type FriendState = "accepted" | "pending-incoming" | "pending-outgoing";
export type Friend = {
  id: string;
  name: string;
  username: string;
  initials: string;
  avatar: string;
  state: FriendState;
  mutualGroups: number;
  bio?: string;
};

export type NotificationType = "message" | "friend-request" | "friend-accepted" | "mention" | "group-activity";
export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
  initials: string;
  avatar: string;
};

export type StoryKind = "text" | "image";
export type Story = {
  id: string;
  authorId: string;
  name: string;
  initials: string;
  avatar: string;
  kind: StoryKind;
  content: string;
  image: string;
  createdAt: string;
  expiresAt: string;
  viewed: boolean;
};

export type Settings = {
  theme: "dark" | "light";
  notifications: boolean;
  sounds: boolean;
  compactMode: boolean;
  readReceipts: boolean;
  onlineStatus: boolean;
};

export type NexusState = {
  currentUser: User;
  conversations: Conversation[];
  friends: Friend[];
  notifications: Notification[];
  stories: Story[];
  recentSearches: string[];
  settings: Settings;
};

export type NewMessageInput = { text: string };
