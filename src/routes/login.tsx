import { createFileRoute } from "@tanstack/react-router";
import { LoginScreen } from "@/screens/AuthScreens";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login · Hot Time Sauces" }] }),
  component: LoginScreen,
});
