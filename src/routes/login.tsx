import { createFileRoute } from "@tanstack/react-router";
import { LoginView } from "@/components/nexus/auth-view";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in · Nexus Chat" }] }),
  component: LoginView,
});
