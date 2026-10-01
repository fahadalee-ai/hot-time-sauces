import { createFileRoute } from "@tanstack/react-router";
import { SplashScreen } from "@/screens/AuthScreens";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Hot Time Sauces" }] }),
  component: SplashScreen,
});
