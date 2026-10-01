import { createFileRoute } from "@tanstack/react-router";
import { BrandProducts } from "@/screens/BrowseScreens";

export const Route = createFileRoute("/brand/$name")({
  component: function BrandPage() {
    const { name } = Route.useParams();
    return <BrandProducts name={name} />;
  },
});
