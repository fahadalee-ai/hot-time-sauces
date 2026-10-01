import { createFileRoute } from "@tanstack/react-router";
import { ReturnsScreen } from "@/screens/InfoScreens";

export const Route = createFileRoute("/returns")({ component: ReturnsScreen });
