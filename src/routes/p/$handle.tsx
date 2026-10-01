import { createFileRoute } from "@tanstack/react-router";
import { ProductDetailScreen } from "@/screens/ProductDetailScreen";

export const Route = createFileRoute("/p/$handle")({
  component: function ProductPage() {
    const { handle } = Route.useParams();
    return <ProductDetailScreen handle={handle} />;
  },
});
