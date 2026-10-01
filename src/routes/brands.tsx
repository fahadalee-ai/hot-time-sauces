import { createFileRoute } from "@tanstack/react-router";
import { BrandsScreen } from "@/screens/InfoScreens";

export const Route = createFileRoute("/brands")({ component: BrandsScreen });
