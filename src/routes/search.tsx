import { createFileRoute } from "@tanstack/react-router";
import { SearchScreen } from "@/screens/BrowseScreens";

export const Route = createFileRoute("/search")({
  head: () => ({ meta: [{ title: "Search · Hot Time Sauces" }] }),
  component: SearchScreen,
});
