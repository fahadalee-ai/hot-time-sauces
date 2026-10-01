import { createFileRoute } from "@tanstack/react-router";
import { FaqScreen } from "@/screens/InfoScreens";

export const Route = createFileRoute("/faq")({ component: FaqScreen });
