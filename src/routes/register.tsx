import { createFileRoute } from "@tanstack/react-router";
import { RegisterScreen } from "@/screens/AuthScreens";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Join · Hot Time Sauces" }] }),
  component: RegisterScreen,
});
