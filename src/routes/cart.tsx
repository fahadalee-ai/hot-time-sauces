import { createFileRoute } from "@tanstack/react-router";
import { CartScreen } from "@/screens/CartScreens";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Cart · Hot Time Sauces" }] }),
  component: CartScreen,
});
