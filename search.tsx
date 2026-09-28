import { createFileRoute } from "@tanstack/react-router";
import { SearchView } from "@/components/nexus/search-view";

export const Route = createFileRoute("/search")({
  head: () => ({ meta: [{ title: "Search · Nexus Chat" }] }),
  component: SearchView,
});
