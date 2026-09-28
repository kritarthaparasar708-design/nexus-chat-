import { createFileRoute } from "@tanstack/react-router";
import { SettingsView } from "@/components/nexus/settings-view";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings · Nexus Chat" }] }),
  component: SettingsView,
});
