import { createFileRoute } from "@tanstack/react-router";
import { SignupView } from "@/components/nexus/auth-view";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create account · Nexus Chat" }] }),
  component: SignupView,
});
