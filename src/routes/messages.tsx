import { createFileRoute } from "@tanstack/react-router";
import { MessagesView } from "@/components/nexus/messages-view";

export const Route = createFileRoute("/messages")({
  validateSearch: (search: Record<string, unknown>): { conversation?: string } =>
    typeof search["conversation"] === "string" ? { conversation: search["conversation"] } : {},
  head: () => ({ meta: [{ title: "Messages · Nexus Chat" }] }),
  component: MessagesRoute,
});

function MessagesRoute() {
  const { conversation } = Route.useSearch();
  return <MessagesView requestedConversationId={conversation} />;
}
