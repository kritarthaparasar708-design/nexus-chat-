import { createFileRoute } from "@tanstack/react-router";
import { MessagesView } from "@/components/nexus/messages-view";

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [{ title: "Messages · Nexus Chat" }] }),
  component: MessagesView,
});
