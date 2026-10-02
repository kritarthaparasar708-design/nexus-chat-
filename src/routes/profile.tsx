import { createFileRoute } from "@tanstack/react-router";
import { ProfileView } from "@/components/nexus/profile-view";

export const Route = createFileRoute("/profile")({
  validateSearch: (search: Record<string, unknown>): { user?: string } =>
    typeof search["user"] === "string" ? { user: search["user"] } : {},
  head: () => ({ meta: [{ title: "Profile · Nexus Chat" }] }),
  component: ProfileRoute,
});

function ProfileRoute() {
  const { user } = Route.useSearch();
  return <ProfileView userId={user} />;
}
