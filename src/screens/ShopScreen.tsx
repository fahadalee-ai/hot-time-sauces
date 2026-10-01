import { useNavigate } from "@tanstack/react-router";
import { BookOpen, Flame, Gift, Heart, Info, Search, Thermometer } from "lucide-react";
import { useMemo, useState } from "react";
import { CartButton, SectionTitle, ShippingNotice } from "@/components/Chrome";
import { HeatMeter } from "@/components/HeatMeter";
import { ProductCard } from "@/components/ProductCard";
import { SauceImage } from "@/components/SauceImage";
import { DIETARY, FRUIT, HEAT_CARDS, PEPPER_TILES, STYLES, type NavItem } from "@/data/navigation";
import {
  bestSellers,
  brandList,
  coverFor,
  productsByBrand,
  salePicks,
  searchProducts,
  shelfCount,
} from "@/lib/catalog";

const AISLES: NavItem[] = [
  { label: "Hot Ones", handle: "hot-ones" },
  { label: "Season 31", handle: "hot-ones-season-31" },
  { label: "Wing Sauces", handle: "wing-sauces" },
  { label: "BBQ", handle: "bbq-sauce-and-marinades" },
  { label: "Chili Oils", handle: "chili-oil-and-chili-crisp" },
  { label: "Extracts", handle: "extract-sauces-1" },
  { label: "Newest", handle: "recently-added" },
  { label: "Clearance", handle: "clearance-items" },
  { label: "Bundles", handle: "package-deals-category" },
  { label: "On Sale", handle: "on-sale" },
];

function AisleCard({ item, onOpen }: { item: NavItem; onOpen: (item: NavItem) => void }) {
  const count = shelfCount(item.handle);
  return (
    <button type="button" onClick={() => onOpen(item)} className="sauce-card press overflow-hidden text-left">
      <SauceImage src={coverFor(item.handle)} alt="" className="aspect-[4/3]" />
      <div className="px-3 py-2.5">
        <p className="font-display text-[1.65rem] leading-none text-cream">{item.label}</p>
        <p className="mt-1 text-[13px] font-medium text-ash">{count} {count === 1 ? "sauce" : "sauces"}</p>
      </div>
    </button>
  );
}

function ThumbRail({ title, items, onOpen }: { title: string; items: NavItem[]; onOpen: (item: NavItem) => void }) {
  return (
    <section className="mt-7">
      <SectionTitle title={title} />
      <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1">
        {items.map((item) => (
          <button key={item.handle} type="button" onClick={() => onOpen(item)} className="w-[104px] shrink-0 text-left">
            <SauceImage src={coverFor(item.handle)} alt="" className="aspect-square rounded-[20px] border border-smoke" />
            <p className="mt-2 line-clamp-2 font-display text-xl leading-none text-cream">{item.label}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

export function ShopScreen() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const openCollection = (item: NavItem) => navigate({ to: "/c/$handle", params: { handle: item.handle } });
  const featured = bestSellers(1)[0];
  const shelf = bestSellers(4);
  const deals = salePicks(6);
  const brands = useMemo(
    () => [...brandList()].sort((a, b) => b.count - a.count).slice(0, 10),
    [],
  );

  const categoryHits = useMemo(() => {
    if (!needle) return [];
    return [...HEAT_CARDS, ...AISLES, ...PEPPER_TILES, ...FRUIT, ...STYLES, ...DIETARY].filter(
      (item, index, list) =>
        item.label.toLowerCase().includes(needle) && list.findIndex((other) => other.handle === item.handle) === index,
    );
  }, [needle]);
  const productHits = needle.length >= 2 ? searchProducts(needle, 12) : [];

  return (
    <div className="pb-6">
      <header className="px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          <h1 className="font-display flex-1 text-4xl">Shop</h1>
          <CartButton />
        </div>
        <label className="mt-3 flex h-12 items-center gap-2 rounded-2xl border border-smoke bg-char px-3">
          <Search className="h-4 w-4 text-ash" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search sauces, peppers, brands"
            aria-label="Search the shop"
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>
      </header>

      {needle ? (
        <div>
          {categoryHits.length > 0 && (
            <section>
              <SectionTitle title="Aisles" />
              <div className="grid grid-cols-2 gap-3 px-4">
                {categoryHits.map((item) => (
                  <AisleCard key={item.handle} item={item} onOpen={openCollection} />
                ))}
              </div>
            </section>
          )}
          <section className="mt-6">
            <SectionTitle title="Sauces" />
            {productHits.length ? (
              <div className="grid grid-cols-2 gap-3 px-4">
                {productHits.map((product) => (
                  <ProductCard key={product.handle} product={product} />
                ))}
              </div>
            ) : (
              <p className="px-4 text-sm text-ash">No bottles match that. Try a pepper, a brand, or a heat level.</p>
            )}
          </section>
        </div>
      ) : (
        <>
          <ShippingNotice />

          {featured && (
            <button
              type="button"
              onClick={() => navigate({ to: "/p/$handle", params: { handle: featured.handle } })}
              className="sauce-card press mx-4 mt-4 flex w-[calc(100%-2rem)] items-center gap-3 p-3 text-left"
            >
              <SauceImage src={featured.images[0]} alt="" className="h-28 w-24 shrink-0 rounded-2xl" />
              <span className="min-w-0">
                <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-flame">On the shelf</span>
                <span className="mt-1 block font-display text-4xl text-cream">Start with a best seller</span>
                <span className="mt-1 block line-clamp-2 text-sm text-ash">{featured.title}</span>
              </span>
            </button>
          )}

          <section className="mt-7">
            <SectionTitle title="Shop by Heat" />
            <div className="grid grid-cols-2 gap-3 px-4">
              {HEAT_CARDS.map((card) => (
                <button
                  key={card.handle}
                  type="button"
                  onClick={() => openCollection(card)}
                  className={`sauce-card press overflow-hidden text-left ${card.score === 5 ? "col-span-2" : ""}`}
                >
                  <div className={card.score === 5 ? "grid grid-cols-[112px_1fr]" : ""}>
                    <SauceImage src={coverFor(card.handle)} alt="" className={card.score === 5 ? "h-full min-h-28" : "aspect-square"} />
                    <div className="p-3">
                      <p className="font-display text-3xl text-cream">{card.label}</p>
                      <HeatMeter score={card.score} />
                      <p className="mt-1 text-[13px] text-ash">{shelfCount(card.handle)} sauces</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="mt-7">
            <SectionTitle title="Aisles" />
            <div className="grid grid-cols-2 gap-3 px-4">
              {AISLES.map((item) => (
                <AisleCard key={item.handle} item={item} onOpen={openCollection} />
              ))}
            </div>
          </section>

          <section className="mt-7">
            <SectionTitle
              title="Best Sellers"
              action={
                <button type="button" className="inline-flex h-11 items-center px-2 text-sm font-semibold text-flame" onClick={() => navigate({ to: "/c/$handle", params: { handle: "best-sellers" } })}>
                  See all
                </button>
              }
            />
            <div className="grid grid-cols-2 gap-3 px-4">
              {shelf.map((product) => (
                <ProductCard key={product.handle} product={product} />
              ))}
            </div>
          </section>

          <section className="mt-7">
            <SectionTitle
              title="On Sale"
              action={
                <button type="button" className="inline-flex h-11 items-center px-2 text-sm font-semibold text-flame" onClick={() => navigate({ to: "/c/$handle", params: { handle: "on-sale" } })}>
                  All sale
                </button>
              }
            />
            <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1">
              {deals.map((product) => (
                <ProductCard key={product.handle} product={product} layout="rail" />
              ))}
            </div>
          </section>

          <ThumbRail title="Shop by Pepper" items={PEPPER_TILES} onOpen={openCollection} />
          <ThumbRail title="Fruit Infused" items={FRUIT} onOpen={openCollection} />
          <ThumbRail title="Sauce Styles" items={STYLES} onOpen={openCollection} />

          <section className="mt-7">
            <SectionTitle title="Dietary" />
            <div className="grid grid-cols-2 gap-3 px-4">
              {DIETARY.map((item) => (
                <button key={item.handle} type="button" onClick={() => openCollection(item)} className="sauce-card press flex items-center gap-3 p-2 text-left">
                  <SauceImage src={coverFor(item.handle)} alt="" className="h-16 w-16 shrink-0 rounded-2xl" />
                  <span>
                    <span className="block font-display text-2xl leading-none text-cream">{item.label}</span>
                    <span className="mt-1 block text-[13px] text-ash">{shelfCount(item.handle)} sauces</span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="mt-7">
            <SectionTitle
              title="Brands"
              action={
                <button type="button" className="inline-flex h-11 items-center px-2 text-sm font-semibold text-flame" onClick={() => navigate({ to: "/brands" })}>
                  All brands
                </button>
              }
            />
            <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1">
              {brands.map((brand) => {
                const cover = productsByBrand(brand.name).find((product) => product.images[0])?.images[0];
                return (
                  <button
                    key={brand.name}
                    type="button"
                    onClick={() => navigate({ to: "/brand/$name", params: { name: encodeURIComponent(brand.name) } })}
                    className="sauce-card press w-36 shrink-0 overflow-hidden text-left"
                  >
                    <SauceImage src={cover} alt="" className="aspect-square" />
                    <span className="block px-3 py-2">
                      <span className="line-clamp-2 text-sm font-semibold text-cream">{brand.name}</span>
                      <span className="text-[13px] text-ash">{brand.count} sauces</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mt-7 grid grid-cols-2 gap-3 px-4">
            {[
              { label: "Gift Cards", icon: Gift, to: "/gifts" as const },
              { label: "Wishlist", icon: Heart, to: "/wishlist" as const },
              { label: "SHU Guide", icon: Thermometer, to: "/shu" as const },
              { label: "Pepper Week", icon: Flame, to: "/pepper-week" as const },
              { label: "Sauce Blog", icon: BookOpen, to: "/blog" as const },
              { label: "About", icon: Info, to: "/about" as const },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => navigate({ to: item.to })}
                className="sauce-card press flex h-16 items-center gap-3 px-3 text-left"
              >
                <item.icon className="h-5 w-5 text-flame" />
                <span className="font-display text-2xl text-cream">{item.label}</span>
              </button>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
