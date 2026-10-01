import { createFileRoute } from "@tanstack/react-router";
import { CheckoutScreen } from "@/screens/CheckoutScreen";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout · Hot Time Sauces" }] }),
  component: CheckoutScreen,
});
