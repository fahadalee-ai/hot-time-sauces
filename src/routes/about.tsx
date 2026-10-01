import { createFileRoute } from "@tanstack/react-router";
import { AboutScreen } from "@/screens/InfoScreens";

export const Route = createFileRoute("/about")({ component: AboutScreen });
