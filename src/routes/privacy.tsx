import { createFileRoute } from "@tanstack/react-router";
import { PrivacyScreen } from "@/screens/InfoScreens";

export const Route = createFileRoute("/privacy")({ component: PrivacyScreen });
