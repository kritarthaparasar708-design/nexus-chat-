import { createFileRoute } from "@tanstack/react-router";
import { ProfileView } from "@/components/nexus/profile-view";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile · Nexus Chat" }] }),
  component: ProfileView,
});
