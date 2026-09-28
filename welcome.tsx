import { createFileRoute } from "@tanstack/react-router";
import { WelcomeView } from "@/components/nexus/welcome-view";

export const Route = createFileRoute("/welcome")({
  head: () => ({ meta: [{ title: "Welcome to Nexus Chat" }] }),
  component: WelcomeView,
});
