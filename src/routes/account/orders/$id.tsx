import { createFileRoute } from "@tanstack/react-router";
import { OrderDetailScreen } from "@/screens/AccountScreens";

export const Route = createFileRoute("/account/orders/$id")({
  component: function OrderDetailPage() {
    const { id } = Route.useParams();
    return <OrderDetailScreen id={id} />;
  },
});
