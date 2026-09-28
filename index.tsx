import { createFileRoute } from "@tanstack/react-router";
import { WelcomeView } from "@/components/nexus/welcome-view";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Nexus Chat · Connect with the people who matter most" }] }),
  component: WelcomeView,
});
