import { Link, useNavigate } from "@tanstack/react-router";
import { Mail, RotateCcw, Search, ShieldCheck, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import logo from "@/img/logo.png";
import flame from "@/img/generated/flame-texture.webp";
import { CartButton, SectionTitle, ShippingNotice, Stars } from "@/components/Chrome";
import { ProductCard } from "@/components/ProductCard";
import { HEAT_CARDS, HOME_CHIPS, PEPPER_TILES } from "@/data/navigation";
import { FREE_SHIPPING_THRESHOLD, RETURN_DAYS, SUPPORT_EMAIL } from "@/data/config";
import { bestSellers, coverFor, hotOnes, newestItems, PRODUCT_COUNT, salePicks, season31, site } from "@/lib/catalog";
import { imageUrl, money as formatMoney } from "@/lib/format";

const HEROES = [
  { handle: "hottest-sauces", kicker: "Find your fire", title: "Shop by Heat", to: "/shop" as const },
  { handle: "hot-ones", kicker: "As seen on the show", title: "Hot Ones", to: "/c/$handle" as const },
  { handle: "package-deals-category", kicker: "Stock the shelf", title: "Package Deals", to: "/c/$handle" as const },
];

function Rail({ products }: { products: ReturnType<typeof bestSellers> }) {
  if (!products.length) {
    return <p className="px-4 text-sm text-ash">Nothing in this rack right now.</p>;
  }
  return (
    <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1">
      {products.map((product) => (
        <ProductCard key={product.handle} product={product} layout="rail" />
      ))}
    </div>
  );
}

export function HomeScreen() {
  const navigate = useNavigate();
  const [hero, setHero] = useState(0);
  const sellers = bestSellers();
  const ones = hotOnes();
  const season = season31();
  const fresh = newestItems();
  const deals = salePicks();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setHero((value) => (value + 1) % HEROES.length), 4500);
    return () => clearInterval(timer);
  }, []);

  const slide = HEROES[hero] ?? HEROES[0];

  return (
    <div className="pb-4">
      <header className="flex items-center gap-3 px-4 pb-3 pt-[max(0.8rem,env(safe-area-inset-top))]">
        <img src={logo} alt="Hot Time Sauces" className="h-12 w-12 rounded-full object-cover" />
        <button
          type="button"
          onClick={() => navigate({ to: "/search" })}
          className="press flex h-11 flex-1 items-center gap-2 rounded-2xl border border-smoke bg-char px-3 text-sm text-ash"
        >
          <Search className="h-4 w-4" />
          Search sauces
        </button>
        <CartButton />
      </header>

      <div className="mb-3">
        <ShippingNotice />
      </div>

      <div className="px-4">
        <button
          type="button"
          onClick={() => {
            if (slide.to === "/shop") navigate({ to: "/shop" });
            else navigate({ to: "/c/$handle", params: { handle: slide.handle } });
          }}
          className="relative block h-36 w-full overflow-hidden rounded-[20px] bg-black text-left"
        >
          <img
            src={imageUrl(coverFor(slide.handle), 900)}
            alt=""
            className={
              slide.handle === "package-deals-category"
                ? "absolute right-0 top-0 h-full w-[52%] object-contain"
                : "absolute inset-0 h-full w-full object-cover object-[80%_center]"
            }
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/55 to-transparent" />
          <div className="relative flex h-full max-w-[62%] flex-col justify-end p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-flame">{slide.kicker}</p>
            <p className="font-display text-5xl text-white" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}>{slide.title}</p>
          </div>
        </button>
        <div className="flex justify-center">
          {HEROES.map((item, index) => (
            <button key={item.title} type="button" aria-label={`Show ${item.title}`} aria-current={index === hero ? "true" : undefined} onClick={() => setHero(index)} className="grid h-11 w-11 place-items-center">
              <span className={`block h-2 rounded-full ${index === hero ? "nav-glow w-7" : "w-2 bg-smoke"}`} />
            </button>
          ))}
        </div>
      </div>

      <section className="mt-4">
        <SectionTitle title="Shop by Heat" />
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1">
          {HEAT_CARDS.map((card) => (
            <button
              key={card.handle}
              type="button"
              onClick={() => navigate({ to: "/c/$handle", params: { handle: card.handle } })}
              className="press relative h-[76px] w-[156px] shrink-0 overflow-hidden rounded-2xl border border-smoke bg-black text-left"
            >
              <img src={imageUrl(coverFor(card.handle), 420)} alt="" className="absolute right-0 top-0 h-full w-[58%] object-cover object-right" />
              <span className="relative z-10 flex h-full w-[48%] items-end p-2.5 font-display text-[1.55rem] leading-none text-white">{card.label}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto px-4">
        {HOME_CHIPS.map((chip) => (
          <button
            key={chip.handle}
            type="button"
            onClick={() => navigate({ to: "/c/$handle", params: { handle: chip.handle } })}
            className="capsule press shrink-0 border border-smoke bg-char text-cream"
          >
            {chip.label}
          </button>
        ))}
      </div>

      <img src={flame} alt="" className="mt-5 h-10 w-full object-cover opacity-80" />

      <section className="mt-2">
        <SectionTitle
          title="Best Sellers"
          action={
            <Link to="/c/$handle" params={{ handle: "best-sellers" }} className="inline-flex h-11 items-center px-2 text-sm font-semibold text-flame">
              See all
            </Link>
          }
        />
        <Rail products={sellers} />
      </section>

      <section className="mt-6">
        <SectionTitle title="As Seen On Hot Ones" />
        <button
          type="button"
          onClick={() => navigate({ to: "/c/$handle", params: { handle: "hot-ones-season-31" } })}
          className="mx-4 mb-3 block w-[calc(100%-2rem)] rounded-[20px] bg-gradient-to-r from-fire to-flame p-4 text-left text-white"
        >
          <p className="text-xs font-bold uppercase tracking-[0.14em]">Season 31</p>
          <p className="font-display text-4xl">The Last Dab is back</p>
          <p className="text-sm text-white/90">{season.length ? `${season.length} sauce${season.length === 1 ? "" : "s"} from this season` : "Shop the lineup"}</p>
        </button>
        <Rail products={ones} />
      </section>

      <section className="mt-6">
        <SectionTitle
          title="Newest Items"
          action={
            <Link to="/c/$handle" params={{ handle: "recently-added" }} className="inline-flex h-11 items-center px-2 text-sm font-semibold text-flame">
              See all
            </Link>
          }
        />
        <Rail products={fresh} />
      </section>

      <section className="mt-6">
        <SectionTitle title="Shop by Pepper" />
        <div className="grid grid-cols-2 gap-3 px-4">
          {PEPPER_TILES.map((tile, index) => (
            <button
              key={tile.handle}
              type="button"
              onClick={() => navigate({ to: "/c/$handle", params: { handle: tile.handle } })}
              className="press h-20 rounded-[20px] border border-smoke px-3 text-left"
              style={{ background: `linear-gradient(135deg, rgba(225,38,28,${0.15 + index * 0.08}), #1A1412 70%)` }}
            >
              <span className="font-display text-2xl">{tile.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <SectionTitle
          title="Package Deals"
          action={
            <button type="button" className="inline-flex h-11 items-center px-2 text-sm font-semibold text-flame" onClick={() => navigate({ to: "/c/$handle", params: { handle: "on-sale" } })}>
              All sale
            </button>
          }
        />
        <div className="no-scrollbar flex gap-3 overflow-x-auto px-4">
          {deals.map((product) => (
            <Link key={product.handle} to="/p/$handle" params={{ handle: product.handle }} className="sauce-card w-44 shrink-0 p-3">
              <span className="sale-pill">SALE</span>
              <p className="mt-2 line-clamp-2 text-sm font-medium">{product.title}</p>
              <p className="mt-2 text-sm font-semibold text-flame">{formatMoney(product.price)}</p>
              {product.compareAtPrice != null && (
                <p className="text-xs text-ash">
                  <span className="line-through">{formatMoney(product.compareAtPrice)}</span>
                  <span className="ml-1 font-semibold text-fire">Save {formatMoney(product.compareAtPrice - product.price)}</span>
                </p>
              )}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <SectionTitle title="The Burn, The Buzz" />
        <p className="px-4 pb-3 text-sm text-ash">Our customers bring the heat just like our sauces.</p>
        <div className="no-scrollbar flex gap-3 overflow-x-auto px-4">
          {site.testimonials.map((review) => (
            <figure key={review.name} className="sauce-card w-72 shrink-0 p-4">
              <Stars value={review.stars} />
              <blockquote className="mt-2 text-sm leading-relaxed text-cream">“{review.quote}”</blockquote>
              <figcaption className="mt-3 text-xs font-semibold text-flame">{review.name}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="mx-4 mt-6 grid grid-cols-2 gap-2">
        {[
          { icon: Truck, title: "Free Shipping", body: `On standard orders over $${FREE_SHIPPING_THRESHOLD}` },
          { icon: RotateCcw, title: `${RETURN_DAYS}-Day Returns`, body: "Unopened bottles, seal intact" },
          { icon: ShieldCheck, title: "Secure Payments", body: "All major credit cards" },
          { icon: Mail, title: "Support", body: SUPPORT_EMAIL },
        ].map((item) => (
          <div key={item.title} className="rounded-[20px] border border-smoke bg-char p-3">
            <item.icon className="h-5 w-5 text-flame" />
            <p className="mt-2 text-sm font-semibold">{item.title}</p>
            <p className="text-xs text-ash">{item.body}</p>
          </div>
        ))}
      </section>
      <p className="px-4 pt-4 text-center text-xs text-ash">{PRODUCT_COUNT} sauces ready to burn.</p>
    </div>
  );
}
