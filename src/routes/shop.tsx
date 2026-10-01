import { createFileRoute } from "@tanstack/react-router";
import { ShopScreen } from "@/screens/ShopScreen";

export const Route = createFileRoute("/shop")({
  head: () => ({ meta: [{ title: "Shop · Hot Time Sauces" }] }),
  component: ShopScreen,
});
