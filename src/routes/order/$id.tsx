import { createFileRoute } from "@tanstack/react-router";
import { OrderSuccessScreen } from "@/screens/CheckoutScreen";

export const Route = createFileRoute("/order/$id")({
  component: function OrderPage() {
    const { id } = Route.useParams();
    return <OrderSuccessScreen id={id} />;
  },
});
