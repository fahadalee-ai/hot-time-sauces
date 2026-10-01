import { useNavigate } from "@tanstack/react-router";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import emptyCart from "@/img/generated/empty-cart.webp";
import { BackBar, EmptyState } from "@/components/Chrome";
import { FireButton } from "@/components/FireButton";
import { ProductCard } from "@/components/ProductCard";
import {
  DEFAULT_FILTERS,
  DIET_FILTERS,
  PRICE_MAX,
  applyCatalog,
  collectionTitle,
  productsByBrand,
  productsFor,
  searchProducts,
  suggest,
  type Filters,
  type HeatLevel,
  type Product,
  type SortKey,
} from "@/lib/catalog";
import { useApp } from "@/lib/store";

const PAGE = 20;
const SORTS: { id: SortKey; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "best", label: "Best Selling" },
  { id: "az", label: "A-Z" },
  { id: "za", label: "Z-A" },
  { id: "low", label: "Price: Low to High" },
  { id: "high", label: "Price: High to Low" },
  { id: "new", label: "Newest" },
];
const HEATS: HeatLevel[] = ["mild", "medium", "hot", "extra-hot", "hottest"];
const POPULAR = ["Carolina Reaper", "Ghost Pepper", "Hot Ones", "Wing Sauce"];

function useDebounced(value: string, ms = 280) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/55" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Close" className="flex-1" onClick={onClose} />
      <div className="max-h-[82%] overflow-y-auto rounded-t-[20px] border border-smoke bg-[#1c1614] px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2">
        <div className="mx-auto mb-2 h-1.5 w-9 rounded-full bg-white/25" aria-hidden />
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-3xl">{title}</h2>
          <button type="button" onClick={onClose} className="press grid h-11 min-w-11 place-items-center text-sm font-semibold text-flame">
            Done
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ProductListScreen({ handle, brand }: { handle?: string; brand?: string }) {
  const title = brand ?? (handle ? collectionTitle(handle) : "Sauces");
  const list = useMemo(() => (brand ? productsByBrand(brand) : handle ? productsFor(handle) : []), [brand, handle]);
  const [sort, setSort] = useState<SortKey>("featured");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [visible, setVisible] = useState(PAGE);
  const results = useMemo(() => applyCatalog(list, { sort, filters }), [list, sort, filters]);

  useEffect(() => setVisible(PAGE), [sort, filters, handle, brand]);

  return (
    <div>
      <BackBar title={title} />
      <div className="sticky top-14 z-20 flex items-center justify-between gap-2 border-b border-white/10 bg-ember/80 px-4 py-2 backdrop-blur-xl">
        <p className="text-xs text-ash">{results.length} sauces</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setSortOpen(true)} className="press h-11 rounded-full border border-smoke px-4 text-sm">
            Sort
          </button>
          <button type="button" onClick={() => setFilterOpen(true)} className="press flex h-11 items-center gap-1 rounded-full border border-smoke px-4 text-sm">
            <SlidersHorizontal className="h-4 w-4" /> Filter
          </button>
        </div>
      </div>
      {results.length === 0 ? (
        <EmptyState image={emptyCart} title="No heat here" body="Nothing matches these filters. Widen the search and try again." />
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4 pb-6">
          {results.slice(0, visible).map((product) => (
            <ProductCard key={product.handle} product={product} />
          ))}
        </div>
      )}
      {visible < results.length && (
        <div className="px-4 pb-6">
          <FireButton onClick={() => setVisible((count) => count + PAGE)}>Load More</FireButton>
        </div>
      )}
      {sortOpen && (
        <Sheet title="Sort" onClose={() => setSortOpen(false)}>
          {SORTS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                setSort(option.id);
                setSortOpen(false);
              }}
              className={`flex min-h-11 w-full items-center rounded-2xl px-3 text-left ${sort === option.id ? "text-flame" : ""}`}
            >
              {option.label}
            </button>
          ))}
        </Sheet>
      )}
      {filterOpen && (
        <FilterSheet
          filters={filters}
          onChange={setFilters}
          onClose={() => setFilterOpen(false)}
        />
      )}
    </div>
  );
}

function FilterSheet({ filters, onChange, onClose }: { filters: Filters; onChange: (filters: Filters) => void; onClose: () => void }) {
  return (
    <Sheet title="Filter" onClose={onClose}>
      <p className="text-xs uppercase tracking-wide text-ash">Availability</p>
      <div className="mt-2 flex gap-2">
        {(["all", "in", "out"] as const).map((value) => (
          <button key={value} type="button" onClick={() => onChange({ ...filters, availability: value })} className={`h-11 flex-1 rounded-2xl border text-sm ${filters.availability === value ? "border-flame text-flame" : "border-smoke"}`}>
            {value === "all" ? "All" : value === "in" ? "In stock" : "Sold out"}
          </button>
        ))}
      </div>
      <p className="mt-4 text-xs uppercase tracking-wide text-ash">
        Price ${filters.min} – ${filters.max}
      </p>
      <input aria-label="Minimum price" type="range" min={0} max={PRICE_MAX} value={filters.min} onChange={(event) => onChange({ ...filters, min: Math.min(Number(event.target.value), filters.max) })} className="mt-2 w-full accent-[#ff8900]" />
      <input aria-label="Maximum price" type="range" min={0} max={PRICE_MAX} value={filters.max} onChange={(event) => onChange({ ...filters, max: Math.max(Number(event.target.value), filters.min) })} className="w-full accent-[#e1261c]" />
      <p className="mt-4 text-xs uppercase tracking-wide text-ash">Heat</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {HEATS.map((heat) => {
          const on = filters.heats.includes(heat);
          return (
            <button key={heat} type="button" onClick={() => onChange({ ...filters, heats: on ? filters.heats.filter((item) => item !== heat) : [...filters.heats, heat] })} className={`h-11 rounded-full border px-3 text-sm capitalize ${on ? "border-flame text-flame" : "border-smoke"}`}>
              {heat.replace("-", " ")}
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-xs uppercase tracking-wide text-ash">Diet</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {DIET_FILTERS.map((diet) => {
          const on = filters.diets.includes(diet.handle);
          return (
            <button key={diet.handle} type="button" onClick={() => onChange({ ...filters, diets: on ? filters.diets.filter((item) => item !== diet.handle) : [...filters.diets, diet.handle] })} className={`h-11 rounded-full border px-3 text-sm ${on ? "border-flame text-flame" : "border-smoke"}`}>
              {diet.label}
            </button>
          );
        })}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => onChange(DEFAULT_FILTERS)} className="h-[52px] rounded-2xl border border-smoke font-semibold">
          Reset
        </button>
        <FireButton onClick={onClose}>Show results</FireButton>
      </div>
    </Sheet>
  );
}

export function SearchScreen() {
  const navigate = useNavigate();
  const { recentSearches, rememberSearch, clearSearches } = useApp();
  const [q, setQ] = useState("");
  const debounced = useDebounced(q);
  const ideas = suggest(debounced);
  const results = debounced.trim().length >= 2 ? searchProducts(debounced) : [];

  return (
    <div>
      <BackBar title="Search" />
      <label className="mx-4 flex h-11 items-center gap-2 rounded-xl border border-smoke bg-char px-3">
        <Search className="h-4 w-4 text-ash" />
        <input
          autoFocus
          type="search"
          enterKeyHint="search"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Sauces, peppers, brands"
          aria-label="Search sauces"
          className="w-full bg-transparent text-base outline-none"
        />
        {q && (
          <button type="button" aria-label="Clear search" onClick={() => setQ("")} className="press grid h-11 w-11 place-items-center text-ash">
            <X className="h-4 w-4" />
          </button>
        )}
      </label>
      {debounced.trim().length < 2 ? (
        <div className="px-4 py-4">
          <p className="text-xs uppercase tracking-wide text-ash">Popular</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {POPULAR.map((term) => (
              <button key={term} type="button" onClick={() => setQ(term)} className="press h-11 rounded-full border border-smoke px-3 text-sm">
                {term}
              </button>
            ))}
          </div>
          {recentSearches.length > 0 && (
            <>
              <div className="mt-5 flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-ash">Recent</p>
                <button type="button" onClick={clearSearches} className="text-xs text-flame">
                  Clear
                </button>
              </div>
              {recentSearches.map((term) => (
                <button key={term} type="button" onClick={() => setQ(term)} className="flex min-h-11 w-full items-center text-left text-sm">
                  {term}
                </button>
              ))}
            </>
          )}
        </div>
      ) : results.length === 0 ? (
        <EmptyState image={emptyCart} title="No match" body="Try a pepper, a brand, or a sauce style." />
      ) : (
        <div className="px-4 py-4">
          <ul className="mb-4">
            {ideas.map((product) => (
              <li key={product.handle}>
                <button
                  type="button"
                  onClick={() => {
                    rememberSearch(q);
                    navigate({ to: "/p/$handle", params: { handle: product.handle } });
                  }}
                  className="flex min-h-11 w-full items-center gap-2 text-left text-sm"
                >
                  <span className="line-clamp-1">{product.title}</span>
                  <span className="shrink-0 text-xs text-ash">{product.brand}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="grid grid-cols-2 gap-3" onClick={() => rememberSearch(q)}>
            {results.map((product) => (
              <ProductCard key={product.handle} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function BrandProducts({ name }: { name: string }) {
  const brand = decodeURIComponent(name);
  return <ProductListScreen brand={brand} />;
}
