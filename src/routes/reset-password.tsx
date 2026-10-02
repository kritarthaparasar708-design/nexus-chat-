import { createFileRoute } from "@tanstack/react-router";
import { ResetPasswordView } from "@/components/nexus/auth-view";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password · Nexus Chat" }] }),
  component: ResetPasswordView,
});
