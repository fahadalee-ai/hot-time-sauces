import { createFileRoute } from "@tanstack/react-router";
import { WishlistScreen } from "@/screens/CartScreens";

export const Route = createFileRoute("/wishlist")({
  head: () => ({ meta: [{ title: "Wishlist · Hot Time Sauces" }] }),
  component: WishlistScreen,
});
