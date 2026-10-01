import { Heart, Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { flavorTag, type Product } from "@/lib/catalog";
import { money } from "@/lib/format";
import { useApp } from "@/lib/store";
import { HeatMeter } from "./HeatMeter";
import { SauceImage } from "./SauceImage";

export function ProductCard({ product, layout = "grid" }: { product: Product; layout?: "grid" | "rail" }) {
  const { toggleWish, wished, addToCart } = useApp();
  const saved = wished(product.handle);
  const variant = product.variants.find((item) => item.available) ?? product.variants[0];
  const flavor = flavorTag(product);
  const save = product.compareAtPrice != null ? product.compareAtPrice - product.price : 0;

  return (
    <article className={`sauce-card press flex flex-col ${layout === "rail" ? "w-[168px] shrink-0" : ""} ${product.available ? "" : "opacity-70"}`}>
      <div className="relative">
        <Link to="/p/$handle" params={{ handle: product.handle }} className="block" aria-label={product.title}>
          <SauceImage src={product.images[0]} alt={product.title} className="aspect-square" />
        </Link>
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {product.onSale && <span className="sale-pill">SALE</span>}
          {!product.available && <span className="sold-pill">SOLD OUT</span>}
        </div>
        <button
          type="button"
          aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
          aria-pressed={saved}
          onClick={() => toggleWish(product.handle)}
          className="press absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-2xl bg-black/55"
        >
          <Heart className="h-5 w-5" fill={saved ? "#e1261c" : "none"} color={saved ? "#e1261c" : "#FFF4E8"} />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="truncate text-[13px] uppercase tracking-wide text-ash">{product.brand}</p>
        <Link to="/p/$handle" params={{ handle: product.handle }} className="line-clamp-2 text-[15px] font-medium leading-snug text-cream">
          {product.title}
        </Link>
        <div className="mt-1 flex items-center justify-between gap-2">
          {product.heatScore > 0 ? (
            <HeatMeter score={product.heatScore} />
          ) : (
            <span className="rounded-2xl bg-[#2A211E] px-2 py-1 text-[13px] font-semibold text-flame">{flavor}</span>
          )}
          <p className="text-[17px] font-semibold leading-tight text-flame">{money(product.price)}</p>
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            {product.compareAtPrice != null && (
              <p className="text-[13px] text-ash line-through">{money(product.compareAtPrice)}</p>
            )}
            {save > 0 && <p className="text-[13px] font-semibold text-fire">Save {money(save)}</p>}
          </div>
          <button
            type="button"
            aria-label={product.available ? `Add ${product.title} to cart` : `${product.title} is sold out`}
            disabled={!product.available || !variant}
            onClick={(event) => {
              const img = event.currentTarget.closest("article")?.querySelector("img");
              const phone = document.querySelector(".phone")?.getBoundingClientRect();
              const rect = img?.getBoundingClientRect();
              addToCart(
                product.handle,
                variant?.id ?? product.id,
                1,
                rect && phone
                  ? { src: img?.src ?? "", x: rect.left - phone.left, y: rect.top - phone.top, size: rect.width }
                  : undefined,
              );
            }}
            className="press grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-fire to-flame text-white disabled:bg-none disabled:bg-[#2A211E] disabled:text-ash"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </article>
  );
}
