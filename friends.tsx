import { createFileRoute } from "@tanstack/react-router";
import { FriendsView } from "@/components/nexus/friends-view";

export const Route = createFileRoute("/friends")({
  head: () => ({ meta: [{ title: "Friends · Nexus Chat" }] }),
  component: FriendsView,
});
