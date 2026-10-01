import { createFileRoute } from "@tanstack/react-router";
import { AccountScreen } from "@/screens/AccountScreens";

export const Route = createFileRoute("/account/")({
  head: () => ({ meta: [{ title: "Account · Hot Time Sauces" }] }),
  component: AccountScreen,
});
