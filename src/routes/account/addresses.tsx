import { createFileRoute } from "@tanstack/react-router";
import { AddressesScreen } from "@/screens/AccountScreens";

export const Route = createFileRoute("/account/addresses")({
  component: AddressesScreen,
});
