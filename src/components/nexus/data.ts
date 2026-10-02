import type { Profile, User, Friend, Message, NexusState } from "./types";

export const EMPTY_USER: User = {
  id: "",
  name: "",
  username: "",
  initials: "",
  avatar: "",
  bio: "",
  email: "",
  phone: "",
  website: "",
  location: "",
  joinedAt: "",
};

export function profileToUser(profile: Profile): User {
  const name = profile.display_name;
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return {
    id: profile.id,
    name,
    username: `@${profile.username}`,
    initials,
    avatar: profile.avatar_url ?? "",
    bio: profile.bio ?? "",
    email: "",
    phone: "",
    website: "",
    location: "",
    joinedAt: profile.created_at,
  };
}

export function userToFriend(user: User): Friend {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    initials: user.initials,
    avatar: user.avatar,
    state: "accepted",
    mutualGroups: 0,
    bio: user.bio,
  };
}

export function emptyMessage(): Message | null {
  return null;
}

export function createInitialState(): NexusState {
  return {
    currentUser: EMPTY_USER,
    conversations: [],
    friends: [],
    notifications: [],
    stories: [],
    recentSearches: [],
    settings: {
      theme: "dark",
      notifications: true,
      sounds: false,
      compactMode: false,
      readReceipts: true,
      onlineStatus: false,
    },
  };
}
