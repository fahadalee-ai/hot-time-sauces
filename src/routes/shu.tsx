import { createFileRoute } from "@tanstack/react-router";
import { ShuScreen } from "@/screens/InfoScreens";

export const Route = createFileRoute("/shu")({ component: ShuScreen });
