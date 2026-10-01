import { createFileRoute } from "@tanstack/react-router";
import { GiftsScreen } from "@/screens/InfoScreens";

export const Route = createFileRoute("/gifts")({ component: GiftsScreen });
