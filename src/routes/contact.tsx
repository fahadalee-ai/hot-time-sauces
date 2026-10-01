import { createFileRoute } from "@tanstack/react-router";
import { ContactScreen } from "@/screens/InfoScreens";

export const Route = createFileRoute("/contact")({ component: ContactScreen });
