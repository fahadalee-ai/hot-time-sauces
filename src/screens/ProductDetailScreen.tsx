import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BackBar, CartButton } from "@/components/Chrome";
import { FireButton } from "@/components/FireButton";
import { HeatMeter } from "@/components/HeatMeter";
import { ProductCard } from "@/components/ProductCard";
import { DIETARY } from "@/data/navigation";
import { RETURN_DAYS, SUPPORT_EMAIL } from "@/data/config";
import { flavorTag, getProduct, heatLabel, relatedProducts, sameHeat } from "@/lib/catalog";
import { imageUrl, money } from "@/lib/format";
import { useApp } from "@/lib/store";

export function ProductDetailScreen({ handle }: { handle: string }) {
  const product = getProduct(handle);
  const navigate = useNavigate();
  const { toggleWish, wished, addToCart, notifyBack, pushToast } = useApp();
  const [variantId, setVariantId] = useState(product?.variants.find((v) => v.available)?.id ?? product?.variants[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"story" | "details" | "shipping">("story");
  const [index, setIndex] = useState(0);
  const [notify, setNotify] = useState(false);
  const [phone, setPhone] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setPhone(document.querySelector(".phone"));
  }, []);
  const [email, setEmail] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const saved = product ? wished(product.handle) : false;

  if (!product) {
    return (
      <div>
        <BackBar title="Missing" />
        <p className="px-4 text-sm text-ash">That sauce isn't in the catalog.</p>
      </div>
    );
  }

  const variant = product.variants.find((item) => item.id === variantId) ?? product.variants[0];
  const price = variant?.price ?? product.price;
  const compare = product.compareAtPrice;
  const diets = DIETARY.filter((item) => product.collections.includes(item.handle));
  const choices = product.variants.filter((item) => item.title !== "Default Title");
  const related = relatedProducts(product);
  const heatMates = sameHeat(product);

  const share = async () => {
    const url = `https://hottimesauces.com/products/${product.handle}`;
    if (navigator.share) {
      await navigator.share({ title: product.title, url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(url);
    pushToast("Link copied");
  };

  return (
    <div className="pb-28">
      <BackBar
        title=""
        action={
          <div className="flex items-center">
            <button type="button" aria-label={saved ? "Remove from wishlist" : "Save to wishlist"} onClick={() => toggleWish(product.handle)} className="press grid h-11 w-11 place-items-center">
              <Heart fill={saved ? "#e1261c" : "none"} color={saved ? "#e1261c" : "#FFF4E8"} />
            </button>
            <CartButton />
          </div>
        }
      />
      <div
        ref={scroller}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
        onScroll={(event) => {
          const width = event.currentTarget.clientWidth || 1;
          setIndex(Math.round(event.currentTarget.scrollLeft / width));
        }}
      >
        {(product.images.length ? product.images : [""]).map((src, imageIndex) => (
          <div key={`${src}-${imageIndex}`} className="w-full shrink-0 snap-center">
            <ZoomImage src={imageUrl(src, 1200)} alt={`${product.title} photo ${imageIndex + 1}`} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-center gap-1.5">
        {product.images.map((src, dot) => (
          <span key={src} className={`h-1.5 rounded-full ${dot === index ? "nav-glow w-5" : "w-1.5 bg-smoke"}`} />
        ))}
      </div>
      <div className="px-4 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-flame">{product.brand}</p>
            <h1 className="mt-1 font-sans text-xl font-semibold normal-case tracking-normal text-cream">{product.title}</h1>
          </div>
          <button type="button" aria-label="Share sauce" onClick={() => void share()} className="press grid h-11 w-11 place-items-center rounded-full bg-char">
            <Share2 className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-3">
          {product.heatScore > 0 ? (
            <>
              <HeatMeter score={product.heatScore} />
              <span className="text-sm text-ash">{heatLabel(product.heatLevel)}</span>
            </>
          ) : (
            <span className="rounded-full bg-char px-3 py-1 text-xs font-semibold uppercase text-flame">{flavorTag(product)}</span>
          )}
        </div>
        <div className="mt-3 flex items-end gap-2">
          <p className="text-2xl font-semibold text-flame">{money(price)}</p>
          {compare != null && compare > price && <p className="text-sm text-ash line-through">{money(compare)}</p>}
          {compare != null && compare > price && <span className="sale-pill">Save {money(compare - price)}</span>}
        </div>
        {choices.length > 0 && (
          <div className="mt-4">
            <p className="text-xs uppercase tracking-wide text-ash">Size</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {choices.map((choice) => (
                <button key={choice.id} type="button" disabled={!choice.available} onClick={() => setVariantId(choice.id)} className={`h-11 rounded-2xl border px-3 text-sm ${choice.id === variantId ? "border-flame text-flame" : "border-smoke"} disabled:opacity-40`}>
                  {choice.title} · {money(choice.price)}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs uppercase tracking-wide text-ash">Qty</span>
          <div className="flex items-center rounded-2xl border border-smoke">
            <button type="button" aria-label="Decrease quantity" onClick={() => setQty((value) => Math.max(1, value - 1))} className="grid h-11 w-11 place-items-center">
              −
            </button>
            <span className="w-6 text-center">{qty}</span>
            <button type="button" aria-label="Increase quantity" onClick={() => setQty((value) => Math.min(10, value + 1))} className="grid h-11 w-11 place-items-center">
              +
            </button>
          </div>
        </div>
        <div className="mt-5 flex gap-2 border-b border-smoke">
          {(["story", "details", "shipping"] as const).map((id) => (
            <button key={id} type="button" onClick={() => setTab(id)} className={`h-11 flex-1 text-sm font-semibold capitalize ${tab === id ? "border-b-2 border-flame text-flame" : "text-ash"}`}>
              {id === "story" ? "Description" : id === "details" ? "Details" : "Shipping"}
            </button>
          ))}
        </div>
        <div className="py-4 text-sm leading-relaxed text-ash">
          {tab === "story" && <p className="whitespace-pre-line">{product.description || "No description was published for this sauce."}</p>}
          {tab === "details" && (
            <ul className="space-y-2">
              <li>Heat: {heatLabel(product.heatLevel)}</li>
              <li>Brand: {product.brand}</li>
              {product.tags.length > 0 && <li>Tags: {product.tags.slice(0, 8).join(", ")}</li>}
              {diets.length > 0 && <li>Diet: {diets.map((item) => item.label).join(", ")}</li>}
              <li>{product.available ? "In stock" : "Sold out"}</li>
            </ul>
          )}
          {tab === "shipping" && (
            <div className="space-y-2">
              <p>Flat-rate USPS shipping from $8.50 in the USA. Free shipping on qualifying orders over $70.</p>
              <p>{RETURN_DAYS}-day returns on unopened bottles. Questions: {SUPPORT_EMAIL}.</p>
            </div>
          )}
        </div>
      </div>
      {related.length > 0 && (
        <section className="mt-2">
          <h2 className="font-display px-4 text-3xl">You May Also Like</h2>
          <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto px-4">
            {related.map((item) => (
              <ProductCard key={item.handle} product={item} layout="rail" />
            ))}
          </div>
        </section>
      )}
      {heatMates.length > 0 && (
        <section className="mt-6">
          <h2 className="font-display px-4 text-3xl">Same Heat Level</h2>
          <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto px-4">
            {heatMates.map((item) => (
              <ProductCard key={item.handle} product={item} layout="rail" />
            ))}
          </div>
        </section>
      )}
      {phone &&
        createPortal(
          <div className="absolute inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ember/90 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl">
            <div className="flex gap-2">
              {product.available ? (
                <>
                  <FireButton
                    onClick={() => {
                      const img = document.querySelector(".phone img");
                      const frame = document.querySelector(".phone")?.getBoundingClientRect();
                      const rect = img?.getBoundingClientRect();
                      addToCart(
                        product.handle,
                        variant?.id ?? product.id,
                        qty,
                        rect && frame ? { src: imageUrl(product.images[0], 200), x: rect.left - frame.left, y: rect.top - frame.top, size: 80 } : undefined,
                      );
                    }}
                  >
                    Add to Cart
                  </FireButton>
                  <button
                    type="button"
                    className="press h-[52px] shrink-0 rounded-2xl border border-flame px-4 text-sm font-bold text-flame"
                    onClick={() => {
                      addToCart(product.handle, variant?.id ?? product.id, qty);
                      navigate({ to: "/checkout" });
                    }}
                  >
                    Buy Now
                  </button>
                </>
              ) : (
                <div className="w-full">
                  {notify ? (
                    <form
                      className="flex gap-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        if (!/^\S+@\S+\.\S+$/.test(email)) return;
                        notifyBack(product.handle);
                        setNotify(false);
                      }}
                    >
                      <input aria-label="Email for restock alert" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" className="field" />
                      <button type="submit" className="press h-[52px] rounded-2xl bg-flame px-4 font-bold text-black">
                        Notify
                      </button>
                    </form>
                  ) : (
                    <FireButton onClick={() => setNotify(true)}>Notify Me</FireButton>
                  )}
                </div>
              )}
            </div>
          </div>,
          phone,
        )}
      <Link to="/cart" className="sr-only">
        Cart
      </Link>
    </div>
  );
}

function ZoomImage({ src, alt }: { src: string; alt: string }) {
  const [scale, setScale] = useState(1);
  const start = useRef({ dist: 0, scale: 1 });
  return (
    <div className="aspect-square overflow-hidden bg-[#120e0c]">
      <img
        src={src}
        alt={alt}
        style={{ transform: `scale(${scale})` }}
        className="h-full w-full object-contain"
        onTouchStart={(event) => {
          if (event.touches.length === 2) {
            const [a, b] = [event.touches[0], event.touches[1]];
            if (!a || !b) return;
            start.current = { dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), scale };
          }
        }}
        onTouchMove={(event) => {
          if (event.touches.length === 2) {
            const [a, b] = [event.touches[0], event.touches[1]];
            if (!a || !b || start.current.dist === 0) return;
            const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
            setScale(Math.min(3, Math.max(1, (start.current.scale * dist) / start.current.dist)));
          }
        }}
        onDoubleClick={() => setScale(1)}
      />
    </div>
  );
}
