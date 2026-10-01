import { createFileRoute } from "@tanstack/react-router";
import { OnboardingScreen } from "@/screens/AuthScreens";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Welcome · Hot Time Sauces" }] }),
  component: OnboardingScreen,
});
