import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import emptyCart from "@/img/generated/empty-cart.webp";
import emptyWish from "@/img/generated/empty-wishlist.webp";
import { EmptyState } from "@/components/Chrome";
import { FireButton } from "@/components/FireButton";
import { SauceImage } from "@/components/SauceImage";
import { FREE_SHIPPING_THRESHOLD } from "@/data/config";
import { getProduct } from "@/lib/catalog";
import { eligibleShippingSubtotal, money, shippingQuote } from "@/lib/format";
import { useApp } from "@/lib/store";

export function WishlistScreen() {
  const { wishlist, toggleWish, moveWishToCart, hydrated } = useApp();
  const items = wishlist.map((handle) => getProduct(handle)).filter((item) => item != null);

  if (!hydrated) return <div className="shimmer m-4 h-40 rounded-[20px]" />;

  return (
    <div>
      <header className="px-4 pb-3 pt-[max(0.9rem,env(safe-area-inset-top))]">
        <h1 className="font-display text-4xl">Wishlist</h1>
      </header>
      {items.length === 0 ? (
        <EmptyState
          image={emptyWish}
          title="No flames saved"
          body="Tap the heart on a sauce to keep it close."
          action={
            <Link to="/shop" className="fire-btn">
              Browse sauces
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4 pb-6">
          {items.map((product) => (
            <article key={product.handle} className="sauce-card p-2">
              <Link to="/p/$handle" params={{ handle: product.handle }}>
                <SauceImage src={product.images[0]} alt={product.title} className="aspect-square rounded-2xl" />
                <p className="mt-2 line-clamp-2 text-sm">{product.title}</p>
                <p className="text-sm font-semibold text-flame">{money(product.price)}</p>
              </Link>
              <button type="button" disabled={!product.available} onClick={() => moveWishToCart(product.handle)} className="press mt-2 h-11 w-full rounded-2xl bg-gradient-to-r from-fire to-flame text-sm font-bold disabled:opacity-40">
                {product.available ? "Move to cart" : "Sold out"}
              </button>
              <button type="button" onClick={() => toggleWish(product.handle)} className="mt-1 h-11 w-full text-sm text-ash">
                Remove
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export function CartScreen() {
  const navigate = useNavigate();
  const { cart, hydrated, setQty, removeLine, subtotal, promo, discount, applyPromo, promoError, clearPromo } = useApp();
  const [code, setCode] = useState(promo?.code ?? "");
  const lines = cart
    .map((line) => {
      const product = getProduct(line.handle);
      if (!product) return null;
      const variant = product.variants.find((item) => item.id === line.variantId);
      return { line, product, variant, price: variant?.price ?? product.price };
    })
    .filter((row) => row != null);

  if (!hydrated) return <div className="shimmer m-4 h-48 rounded-[20px]" />;

  const eligible = eligibleShippingSubtotal(lines.map((row) => ({ price: row.price, qty: row.line.qty, isBundle: row.product.isBundle })));
  const quote = shippingQuote({ eligibleSubtotal: eligible, method: "ground", percentOff: promo?.kind === "percent" });
  const progress = Math.min(1, eligible / FREE_SHIPPING_THRESHOLD);
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - eligible);
  const onlyBundles = lines.length > 0 && lines.every((row) => row.product.isBundle);

  return (
    <div>
      <header className="px-4 pb-2 pt-[max(0.9rem,env(safe-area-inset-top))]">
        <h1 className="font-display text-4xl">Cart</h1>
      </header>
      {lines.length === 0 ? (
        <EmptyState
          image={emptyCart}
          title="The basket is cold"
          body="Your cart is empty. Go find a sauce that bites back."
          action={
            <Link to="/shop" className="fire-btn">
              Continue Shopping
            </Link>
          }
        />
      ) : (
        <div className="px-4 pb-6">
          <ul className="space-y-3">
            {lines.map((row) => (
              <CartRow key={row.line.id} title={row.product.title} image={row.product.images[0]} variant={row.variant?.title} qty={row.line.qty} price={row.price * row.line.qty} onQty={(qty) => setQty(row.line.id, qty)} onRemove={() => removeLine(row.line.id)} />
            ))}
          </ul>
          <form
            className="mt-4 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!code.trim()) clearPromo();
              else applyPromo(code);
            }}
          >
            <input aria-label="Promo code" value={code} onChange={(event) => setCode(event.target.value)} placeholder="Promo code" className="field" />
            <button type="submit" className="press h-[52px] rounded-2xl border border-flame px-4 text-sm font-bold text-flame">
              Apply
            </button>
          </form>
          <p className="mt-1 text-[11px] text-ash">Demo codes: HEAT10 (10% off) or FIRE5 ($5 off). Percentage codes turn off free shipping, same as the store.</p>
          {promoError && <p className="mt-1 text-xs text-fire">{promoError}</p>}
          <div className="mt-4 rounded-[20px] border border-smoke bg-char p-3">
            <p className="text-sm">{onlyBundles ? "Package deals ship at the flat rate." : quote.free ? "You've unlocked FREE shipping." : `Add ${money(remaining)} more for FREE shipping`}</p>
            {!onlyBundles && (
              <div className="progress-fire mt-2">
                <span style={{ width: `${progress * 100}%` }} />
              </div>
            )}
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Subtotal" value={money(subtotal)} />
            {discount > 0 && <Row label="Promo" value={`−${money(discount)}`} />}
            <Row label="Shipping" value={quote.free ? "FREE" : money(quote.cost)} />
            <Row label="Taxes" value="Calculated at checkout" />
            <Row label="Total" value={money(subtotal - discount + quote.cost)} strong />
          </dl>
          <div className="mt-4">
            <FireButton onClick={() => navigate({ to: "/checkout" })}>Proceed to Checkout</FireButton>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "text-base font-semibold text-cream" : "text-ash"}`}>
      <dt>{label}</dt>
      <dd className={strong ? "text-flame" : "text-cream"}>{value}</dd>
    </div>
  );
}

function CartRow({
  title,
  image,
  variant,
  qty,
  price,
  onQty,
  onRemove,
}: {
  title: string;
  image?: string;
  variant?: string;
  qty: number;
  price: number;
  onQty: (qty: number) => void;
  onRemove: () => void;
}) {
  const [dx, setDx] = useState(0);
  const [start, setStart] = useState<number | null>(null);
  return (
    <li className="relative overflow-hidden rounded-[20px]">
      <button type="button" onClick={onRemove} className="absolute inset-y-0 right-0 w-24 bg-fire text-sm font-bold">
        Remove
      </button>
      <div
        className="relative flex gap-3 bg-char p-3"
        style={{ transform: `translateX(${dx}px)` }}
        onPointerDown={(event) => setStart(event.clientX)}
        onPointerMove={(event) => {
          if (start == null) return;
          setDx(Math.max(-96, Math.min(0, event.clientX - start)));
        }}
        onPointerUp={() => {
          if (dx < -88) onRemove();
          else setDx(dx < -36 ? -96 : 0);
          setStart(null);
        }}
        onPointerCancel={() => {
          setDx(0);
          setStart(null);
        }}
      >
        <SauceImage src={image} alt="" width={200} className="h-20 w-20 shrink-0 rounded-2xl" />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-medium">{title}</p>
          {variant && variant !== "Default Title" && <p className="text-xs text-ash">{variant}</p>}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center rounded-xl border border-smoke">
              <button type="button" aria-label="Decrease quantity" onClick={() => onQty(qty - 1)} onPointerDown={(event) => event.stopPropagation()} className="grid h-11 w-11 place-items-center">
                −
              </button>
              <span className="w-6 text-center text-sm">{qty}</span>
              <button type="button" aria-label="Increase quantity" onClick={() => onQty(qty + 1)} onPointerDown={(event) => event.stopPropagation()} className="grid h-11 w-11 place-items-center">
                +
              </button>
            </div>
            <p className="font-semibold text-flame">{money(price)}</p>
          </div>
        </div>
      </div>
    </li>
  );
}
