import productsRaw from "../data/products.json?raw";
import collectionsRaw from "../data/collections.json?raw";
import siteRaw from "../data/site.json?raw";
import { DIETARY, labelForHandle } from "@/data/navigation";

export type HeatLevel = "mild" | "medium" | "hot" | "extra-hot" | "hottest" | "none";

export type Variant = {
  id: string;
  title: string;
  price: number;
  available: boolean;
};

export type Product = {
  id: string;
  handle: string;
  title: string;
  brand: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  onSale: boolean;
  available: boolean;
  images: string[];
  variants: Variant[];
  tags: string[];
  collections: string[];
  heatLevel: HeatLevel;
  heatScore: number;
  isBundle: boolean;
  isHotOnes: boolean;
  publishedAt?: string | null;
  featuredRank?: number;
};

type CollectionMeta = {
  id: string;
  handle: string;
  title: string;
  description: string;
  image: string;
  productsCount: number | null;
};

type CollectionsFile = {
  collections: CollectionMeta[];
  membership: Record<string, string[]>;
};

export type Testimonial = { quote: string; name: string; stars: number };
export type Article = {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  url: string;
  publishedAt: string | null;
};
export type FaqItem = { q: string; a: string };

export const products = JSON.parse(productsRaw) as Product[];
const collectionsFile = JSON.parse(collectionsRaw) as CollectionsFile;
const siteFile = JSON.parse(siteRaw) as {
  announcement?: string;
  testimonials?: Testimonial[];
  social?: { facebook: string; youtube: string; instagram: string };
  supportEmail?: string;
  pages?: Record<string, string>;
  articles?: Article[];
};

const byHandle = new Map(products.map((product) => [product.handle, product]));
const collectionMeta = new Map(collectionsFile.collections.map((c) => [c.handle, c]));
const membership = collectionsFile.membership ?? {};

const bestRank = new Map((membership["best-sellers"] ?? []).map((handle, index) => [handle, index]));

export const PRICE_MAX = Math.max(10, ...products.map((p) => Math.ceil(p.price)));
export const PRODUCT_COUNT = products.length;

export function getProduct(handle: string) {
  return byHandle.get(handle);
}

export function collectionTitle(handle: string) {
  return labelForHandle(handle) || collectionMeta.get(handle)?.title || handle;
}

function inSeason31(product: Product) {
  return /season\s*31/i.test(`${product.title} ${product.tags.join(" ")}`);
}

export function coverFor(handle: string) {
  const image = collectionMeta.get(handle)?.image;
  if (image) return image;
  return productsFor(handle).find((product) => product.images[0])?.images[0];
}

export function shelfCount(handle: string) {
  return productsFor(handle).length;
}

export function productsFor(handle: string): Product[] {
  if (handle === "on-sale") return products.filter((p) => p.onSale);
  if (handle === "hot-ones-season-31") {
    const listed = (membership[handle] ?? []).map((h) => byHandle.get(h)).filter((p): p is Product => Boolean(p));
    if (listed.length) return listed;
    return products.filter(inSeason31);
  }
  const handles = membership[handle] ?? [];
  return handles.map((h) => byHandle.get(h)).filter((p): p is Product => Boolean(p));
}

export function bestSellers(limit = 12) {
  return productsFor("best-sellers").slice(0, limit);
}

export function newestItems(limit = 12) {
  return productsFor("recently-added").slice(0, limit);
}

export function hotOnes(limit = 12) {
  return productsFor("hot-ones").slice(0, limit);
}

export function season31(limit = 8) {
  return productsFor("hot-ones-season-31").slice(0, limit);
}

export function salePicks(limit = 10) {
  const bundles = productsFor("package-deals-category").filter((p) => p.onSale);
  const rest = products.filter((p) => p.onSale && !bundles.some((b) => b.handle === p.handle));
  return [...bundles, ...rest].slice(0, limit);
}

const FLAVOR: [string, string][] = [
  ["wing-sauces", "Wing"],
  ["bbq-sauce-and-marinades", "BBQ"],
  ["chili-oil-and-chili-crisp", "Chili Crisp"],
  ["fruit-hot-sauces", "Fruit"],
  ["taco-mexican-sauces", "Taco"],
  ["bacon-sauces", "Bacon"],
  ["hot-sauce-with-honey", "Honey"],
  ["sauces-with-garlic", "Garlic"],
  ["extract-sauces-1", "Extract"],
  ["package-deals-category", "Bundle"],
];

export function flavorTag(product: Product) {
  if (product.heatLevel !== "none") return null;
  for (const [handle, label] of FLAVOR) {
    if (product.collections.includes(handle)) return label;
  }
  return product.tags[0] || "Sauce";
}

export function heatLabel(level: HeatLevel) {
  if (level === "extra-hot") return "Extra Hot";
  if (level === "none") return "Flavor";
  return level.slice(0, 1).toUpperCase() + level.slice(1);
}

export type SortKey = "featured" | "best" | "az" | "za" | "low" | "high" | "new";

export type Filters = {
  availability: "all" | "in" | "out";
  min: number;
  max: number;
  heats: HeatLevel[];
  diets: string[];
};

export const DEFAULT_FILTERS: Filters = {
  availability: "all",
  min: 0,
  max: PRICE_MAX,
  heats: [],
  diets: [],
};

export function applyCatalog(
  list: Product[],
  opts: { sort: SortKey; filters: Filters; q?: string },
) {
  const q = opts.q?.trim().toLowerCase() ?? "";
  let out = list.filter((product) => {
    if (opts.filters.availability === "in" && !product.available) return false;
    if (opts.filters.availability === "out" && product.available) return false;
    if (product.price < opts.filters.min || product.price > opts.filters.max) return false;
    if (opts.filters.heats.length && !opts.filters.heats.includes(product.heatLevel)) return false;
    if (opts.filters.diets.length && !opts.filters.diets.every((d) => product.collections.includes(d))) return false;
    if (!q) return true;
    return (
      product.title.toLowerCase().includes(q) ||
      product.brand.toLowerCase().includes(q) ||
      product.tags.some((tag) => tag.toLowerCase().includes(q)) ||
      product.description.toLowerCase().includes(q)
    );
  });

  const sorted = [...out];
  switch (opts.sort) {
    case "az":
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "za":
      sorted.sort((a, b) => b.title.localeCompare(a.title));
      break;
    case "low":
      sorted.sort((a, b) => a.price - b.price);
      break;
    case "high":
      sorted.sort((a, b) => b.price - a.price);
      break;
    case "new":
      sorted.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
      break;
    case "best":
      sorted.sort((a, b) => (bestRank.get(a.handle) ?? 9999) - (bestRank.get(b.handle) ?? 9999));
      break;
    default:
      sorted.sort((a, b) => (a.featuredRank ?? 0) - (b.featuredRank ?? 0));
  }
  return sorted;
}

export function searchProducts(q: string, limit = 40) {
  return applyCatalog(products, { sort: "featured", filters: DEFAULT_FILTERS, q }).slice(0, limit);
}

export function suggest(q: string, limit = 8) {
  const needle = q.trim().toLowerCase();
  if (needle.length < 2) return [];
  return products
    .filter(
      (p) =>
        p.title.toLowerCase().includes(needle) || p.brand.toLowerCase().includes(needle),
    )
    .slice(0, limit);
}

const BIG = new Set([
  "gluten-free-sauces",
  "vegan-sauces",
  "vegatarian-sauces",
  "best-sellers",
  "keto-sauces",
  "non-gmo-items",
  "sauces-with-garlic",
  "sauces-with-onions",
  "paleo",
  "fruit-hot-sauces",
  "sauces-with-bell-peppers",
  "recently-added",
]);

export function relatedProducts(product: Product, limit = 8) {
  return products
    .filter((other) => other.handle !== product.handle)
    .map((other) => {
      let score = 0;
      if (other.brand && other.brand === product.brand) score += 4;
      if (other.heatLevel === product.heatLevel && product.heatLevel !== "none") score += 2;
      for (const handle of product.collections) {
        if (!BIG.has(handle) && other.collections.includes(handle)) score += 2;
      }
      return { other, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.other);
}

export function sameHeat(product: Product, limit = 8) {
  if (product.heatLevel === "none") return [];
  return products
    .filter((other) => other.handle !== product.handle && other.heatLevel === product.heatLevel)
    .slice(0, limit);
}

export function productsByBrand(brand: string) {
  return products.filter((p) => p.brand === brand);
}

export function brandList() {
  const counts = new Map<string, number>();
  for (const product of products) {
    const name = product.brand || "Hot Time Sauces";
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function giftCards() {
  return products.filter((p) => /gift card/i.test(p.title) || p.handle.includes("gift"));
}

export function defaultVariant(product: Product) {
  return product.variants.find((v) => v.available) ?? product.variants[0];
}

export const DIET_FILTERS = DIETARY;

function unescapeHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h\d|tr|blockquote)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function extractHtml(blob: string) {
  const trimmed = blob.trim();
  if (!trimmed.startsWith("{")) return trimmed;
  try {
    const data = JSON.parse(trimmed) as { page?: { body_html?: string }; policy?: { body?: string } };
    return data.page?.body_html || data.policy?.body || trimmed;
  } catch {
    const key = trimmed.includes('"body_html"') ? '"body_html":"' : '"body":"';
    const start = trimmed.indexOf(key);
    if (start < 0) return trimmed;
    let out = "";
    for (let i = start + key.length; i < trimmed.length; i += 1) {
      const char = trimmed[i];
      if (char === "\\") {
        const next = trimmed[i + 1];
        if (next === "u") {
          out += String.fromCharCode(Number.parseInt(trimmed.slice(i + 2, i + 6), 16));
          i += 5;
        } else if (next === "n") {
          out += "\n";
          i += 1;
        } else if (next === '"') {
          out += '"';
          i += 1;
        } else if (next) {
          out += next === "/" ? "/" : next;
          i += 1;
        }
      } else if (char === '"') {
        break;
      } else {
        out += char;
      }
    }
    return out;
  }
}

function pageText(key: string) {
  const raw = siteFile.pages?.[key] ?? "";
  return unescapeHtml(extractHtml(raw));
}

function faqItems(): FaqItem[] {
  const text = pageText("faq");
  return text
    .split(/\n(?=Q\s*:)/i)
    .map((chunk) => chunk.trim())
    .filter((chunk) => /^Q\s*:/i.test(chunk))
    .map((chunk) => {
      const [q, ...rest] = chunk.split(/\nA\s*:/i);
      return {
        q: (q ?? "").replace(/^Q\s*:/i, "").trim(),
        a: rest.join(" ").replace(/\s+/g, " ").trim(),
      };
    })
    .filter((item) => item.q && item.a.length > 20);
}

const extraTestimonials: Testimonial[] = [
  {
    quote:
      "I love HOT HOT sauces. It's the burn that I love. I am strange, I know, but I just love the pain, and the Blair's Ultra Death hot sauce is PAIN!",
    name: "Mark Brisco",
    stars: 5,
  },
];

const shuHtml = extractHtml(siteFile.pages?.shu ?? "");
const shuImages = [...shuHtml.matchAll(/src="([^"]+)"/gi)].map((match) =>
  match[1].replace(/&amp;/g, "&"),
);

export const site = {
  announcement:
    siteFile.announcement ||
    "Flat Rate USPS Shipping Starts At $8.50 In The USA and FREE Shipping For Orders Starts At $70",
  testimonials: [...(siteFile.testimonials ?? []), ...extraTestimonials].filter(
    (item, index, list) => list.findIndex((other) => other.name === item.name) === index,
  ),
  social: siteFile.social ?? {
    facebook: "https://www.facebook.com/profile.php?id=61583076870783",
    youtube: "https://www.youtube.com/@hottimesauces",
    instagram: "https://www.instagram.com/hottimesauces/",
  },
  about: pageText("about"),
  faq: faqItems(),
  contact: pageText("contact"),
  shuImages,
  privacy: pageText("privacy"),
  returns: pageText("returns"),
  shipping: pageText("shipping"),
  articles: siteFile.articles ?? [],
};
