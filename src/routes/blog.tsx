import { createFileRoute } from "@tanstack/react-router";
import { BlogScreen } from "@/screens/InfoScreens";

export const Route = createFileRoute("/blog")({ component: BlogScreen });
