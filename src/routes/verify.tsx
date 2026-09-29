import { createFileRoute } from "@tanstack/react-router";
import { VerifyView } from "@/components/nexus/auth-view";

export const Route = createFileRoute("/verify")({
  head: () => ({ meta: [{ title: "Verify account · Nexus Chat" }] }),
  component: VerifyView,
});
