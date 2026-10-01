import { createFileRoute } from "@tanstack/react-router";
import { PepperWeekScreen } from "@/screens/InfoScreens";

export const Route = createFileRoute("/pepper-week")({ component: PepperWeekScreen });
