import { createFileRoute } from "@tanstack/react-router";
import { ProductListScreen } from "@/screens/BrowseScreens";

export const Route = createFileRoute("/c/$handle")({
  component: function CollectionPage() {
    const { handle } = Route.useParams();
    return <ProductListScreen handle={handle} />;
  },
});
