import { createFileRoute } from "@tanstack/react-router";
import { OrdersScreen } from "@/screens/AccountScreens";

export const Route = createFileRoute("/account/orders/")({
  component: OrdersScreen,
});
