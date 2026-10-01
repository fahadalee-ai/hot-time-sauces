/**
 * Pull the public Hot Time Sauces Shopify catalog into src/data.
 * Node 18+. Uses products.json / collections.json, and falls back to HTML
 * collection and product pages if those endpoints are blocked.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "src", "data");
const ORIGIN = "https://hottimesauces.com";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "application/json,text/html;q=0.9",
};

/** Collection handles read from the live site navigation (do not guess). */
const CATEGORY_HANDLES = [
  "hot-ones",
  "hot-ones-season-31",
  "recently-added",
  "mild-sauces",
  "medium-sauces",
  "hot-sauces",
  "extra-hot-sauces",
  "hottest-sauces",
  "extract-sauces-1",
  "bbq-sauce-and-marinades",
  "wing-sauces",
  "clearance-items",
  "ancho-peppers",
  "sauces-with-bell-peppers",
  "hatch",
  "jalapeno-pepper",
  "poblano-pepper",
  "aji-amarillo",
  "cayenne-pepper-sauces",
  "chile-de-arbol",
  "chipotle-peppers",
  "serrano-pepper",
  "thai-chile",
  "ghost-pepper-sauces",
  "datil-peppers",
  "habanero-pepper",
  "peri-peri",
  "scotch-bonnet",
  "sauces-with-7-pot",
  "apollo-pepper",
  "carolina-reaper",
  "dragons-breath-pepper",
  "pepper-x",
  "aji-rocoto-pepper",
  "scorpion-pepper",
  "sauces-with-blackberries",
  "raspberries",
  "blueberries",
  "cherries",
  "strawberry",
  "apples",
  "sauces-with-pears",
  "carrots",
  "sauces-with-tomato",
  "mango",
  "pineapple",
  "sauces-with-papaya",
  "taco-mexican-sauces",
  "bacon-sauces",
  "hot-sauce-with-honey",
  "sauces-with-garlic",
  "sauces-with-onions",
  "chili-oil-and-chili-crisp",
  "gluten-free-sauces",
  "keto-sauces",
  "paleo",
  "vegan-sauces",
  "vegatarian-sauces",
  "organic-sauces",
  "non-gmo-items",
  "package-deals-category",
  "best-sellers",
  "fruit-hot-sauces",
];

const HEAT = {
  "mild-sauces": ["mild", 1],
  "medium-sauces": ["medium", 2],
  "hot-sauces": ["hot", 3],
  "extra-hot-sauces": ["extra-hot", 4],
  "hottest-sauces": ["hottest", 5],
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchText(url) {
  let last = "";
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url, { headers: HEADERS });
    const text = await res.text();
    last = text.slice(0, 180);
    if (text.includes("local_rate_limited") || res.status === 429 || res.status === 503) {
      await sleep(700 * (attempt + 1));
      continue;
    }
    if (!res.ok) {
      const err = new Error(`${res.status} ${url}`);
      err.status = res.status;
      err.body = last;
      throw err;
    }
    return text;
  }
  throw new Error(`rate limited ${url} :: ${last}`);
}

async function fetchJson(url) {
  const text = await fetchText(url);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`invalid json ${url}`);
  }
}

function decode(html) {
  return html
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;|&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function htmlToText(html) {
  if (!html) return "";
  return decode(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h\d|tr)>/gi, "\n")
      .replace(/<li[^>]*>/gi, "• ")
      .replace(/<[^>]+>/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " "),
  )
    .trim()
    .slice(0, 6000);
}

function absUrl(src) {
  if (!src) return "";
  if (src.startsWith("//")) return `https:${src}`;
  if (src.startsWith("/")) return `${ORIGIN}${src}`;
  return src;
}

function asTags(tags) {
  if (Array.isArray(tags)) return tags.map(String);
  if (typeof tags === "string") return tags.split(",").map((t) => t.trim()).filter(Boolean);
  return [];
}

function num(value) {
  if (value == null || value === "") return null;
  const n = Number.parseFloat(String(value));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

function normalizeProduct(raw, featuredRank) {
  const variants = (raw.variants ?? []).map((v) => ({
    id: String(v.id),
    title: v.title || "Default Title",
    price: num(v.price) ?? 0,
    available: Boolean(v.available),
  }));
  const primary = variants[0] ?? { price: 0, available: false };
  const compare = num(raw.variants?.[0]?.compare_at_price);
  const price = primary.price ?? 0;
  const compareAtPrice = compare != null && compare > price ? compare : null;
  const images = (raw.images ?? [])
    .map((img) => absUrl(typeof img === "string" ? img : img.src))
    .filter(Boolean);
  return {
    id: String(raw.id),
    handle: raw.handle,
    title: decode(String(raw.title ?? "")).trim(),
    brand: raw.vendor || "",
    description: htmlToText(raw.body_html || raw.description || ""),
    price,
    compareAtPrice,
    onSale: compareAtPrice != null,
    available: variants.some((v) => v.available),
    images,
    variants,
    tags: asTags(raw.tags),
    collections: [],
    heatLevel: "none",
    heatScore: 0,
    isBundle: false,
    isHotOnes: false,
    publishedAt: raw.published_at || raw.created_at || null,
    featuredRank,
  };
}

function applyCollections(product, handles) {
  const unique = [...new Set(handles)];
  product.collections = unique;
  let best = null;
  for (const handle of unique) {
    const heat = HEAT[handle];
    if (heat && (!best || heat[1] > best[1])) best = heat;
  }
  if (best) {
    product.heatLevel = best[0];
    product.heatScore = best[1];
  } else {
    product.heatLevel = "none";
    product.heatScore = 0;
  }
  product.isHotOnes = unique.includes("hot-ones");
  product.isBundle =
    unique.includes("package-deals-category") ||
    /\b(3[\s-]?packs?|trios?)\b/i.test(product.title);
}

async function fetchAllProducts() {
  const products = [];
  const seen = new Set();
  try {
    for (let page = 1; page < 20; page++) {
      const data = await fetchJson(`${ORIGIN}/products.json?limit=250&page=${page}`);
      const batch = data.products ?? [];
      console.log(`products page ${page}: ${batch.length}`);
      if (!batch.length) break;
      for (const raw of batch) {
        if (!raw.handle || seen.has(raw.handle)) continue;
        seen.add(raw.handle);
        products.push(normalizeProduct(raw, products.length));
      }
      if (batch.length < 250) break;
      await sleep(200);
    }
    return products;
  } catch (error) {
    console.warn("products.json failed, falling back to HTML:", error.message);
    return fetchProductsFromHtml();
  }
}

function parseProductHtml(html, handle) {
  const title =
    html.match(/<meta property="og:title" content="([^"]*)"/i)?.[1] ||
    html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ||
    handle;
  const priceMeta = html.match(/<meta property="og:price:amount" content="([^"]+)"/i)?.[1];
  const image = html.match(/<meta property="og:image" content="([^"]+)"/i)?.[1];
  const desc = html.match(/<meta property="og:description" content="([^"]*)"/i)?.[1] || "";
  const compare = html.match(/compare[_-]?at[^$]*\$(\d+(?:\.\d+)?)/i)?.[1];
  const available = !/sold out/i.test(html.slice(0, 80000));
  return normalizeProduct(
    {
      id: handle,
      handle,
      title: decode(title.replace(/<[^>]+>/g, "")),
      body_html: desc,
      vendor: "",
      variants: [
        {
          id: handle,
          title: "Default Title",
          price: priceMeta || "0",
          compare_at_price: compare || null,
          available,
        },
      ],
      images: image ? [{ src: image }] : [],
      tags: [],
    },
    0,
  );
}

async function fetchProductsFromHtml() {
  const products = [];
  const seen = new Set();
  for (let page = 1; page < 40; page++) {
    const html = await fetchText(`${ORIGIN}/collections/all?page=${page}`);
    const handles = [
      ...html.matchAll(/\/products\/([a-z0-9][a-z0-9-]*)/gi),
    ].map((m) => m[1].toLowerCase());
    const fresh = [...new Set(handles)].filter((h) => !seen.has(h) && h !== "e-gift-cards");
    console.log(`html collection page ${page}: ${fresh.length} handles`);
    if (!fresh.length) break;
    for (const handle of fresh) {
      seen.add(handle);
      try {
        const pageHtml = await fetchText(`${ORIGIN}/products/${handle}`);
        const product = parseProductHtml(pageHtml, handle);
        product.featuredRank = products.length;
        products.push(product);
        await sleep(120);
      } catch (error) {
        console.warn("skip", handle, error.message);
      }
    }
    if (fresh.length < 8) break;
  }
  return products;
}

async function fetchCollections() {
  const collections = [];
  for (let page = 1; page < 10; page++) {
    const data = await fetchJson(`${ORIGIN}/collections.json?limit=250&page=${page}`);
    const batch = data.collections ?? [];
    console.log(`collections page ${page}: ${batch.length}`);
    for (const c of batch) {
      collections.push({
        id: String(c.id),
        handle: c.handle,
        title: decode(String(c.title ?? "")),
        description: htmlToText(c.description || c.body_html || ""),
        image: absUrl(c.image?.src || ""),
        productsCount: c.products_count ?? null,
      });
    }
    if (batch.length < 250) break;
    await sleep(200);
  }
  return collections;
}

async function fetchMembership(handle) {
  const handles = [];
  const seen = new Set();
  try {
    for (let page = 1; page < 12; page++) {
      const data = await fetchJson(
        `${ORIGIN}/collections/${handle}/products.json?limit=250&page=${page}`,
      );
      const batch = data.products ?? [];
      if (!batch.length) break;
      for (const p of batch) {
        if (p.handle && !seen.has(p.handle)) {
          seen.add(p.handle);
          handles.push(p.handle);
        }
      }
      if (batch.length < 250) break;
      await sleep(150);
    }
  } catch (error) {
    console.warn(`membership json failed for ${handle}:`, error.message);
    try {
      const html = await fetchText(`${ORIGIN}/collections/${handle}`);
      for (const m of html.matchAll(/\/products\/([a-z0-9][a-z0-9-]*)/gi)) {
        const h = m[1].toLowerCase();
        if (!seen.has(h)) {
          seen.add(h);
          handles.push(h);
        }
      }
    } catch (htmlError) {
      console.warn(`membership html failed for ${handle}:`, htmlError.message);
    }
  }
  return handles;
}

function extractTestimonials(html) {
  const chunks = [...html.matchAll(/testimonial-content-prag[\s\S]*?<div>([\s\S]*?)<\/div>[\s\S]*?testimonial-content-name[^>]*>([\s\S]*?)<\/h3>/gi)];
  const alt = [...html.matchAll(/testimonial-content-prag[\s\S]*?<\/h3><div>([\s\S]*?)<\/div>/gi)];
  const names = [...html.matchAll(/testimonial-content-name[^>]*>([\s\S]*?)<\/h3>/gi)].map((m) =>
    htmlToText(m[1]),
  );
  const quotes = (chunks.length ? chunks.map((m) => m[1]) : alt.map((m) => m[1])).map((q) =>
    htmlToText(q),
  );
  return quotes
    .map((quote, i) => ({ quote, name: names[i] || "Hot Time customer", stars: 5 }))
    .filter((t) => t.quote.length > 20)
    .slice(0, 8);
}

async function fetchPages(homeHtml) {
  const pages = {};
  const targets = {
    about: "/pages/about-us",
    faq: "/pages/faqs",
    contact: "/pages/contact",
    shu: "/pages/pepper-shu",
    privacy: "/policies/privacy-policy",
    returns: "/policies/refund-policy",
    shipping: "/policies/shipping-policy",
  };
  for (const [key, pathname] of Object.entries(targets)) {
    try {
      const html = await fetchText(`${ORIGIN}${pathname}`);
      const main =
        html.match(/<main[\s\S]*?>([\s\S]*?)<\/main>/i)?.[1] ||
        html.match(/<article[\s\S]*?>([\s\S]*?)<\/article>/i)?.[1] ||
        html;
      pages[key] = htmlToText(main).slice(0, 8000);
      if (key === "shu") {
        pages.shuImages = [...html.matchAll(/<img[^>]+src="([^"]+)"/gi)]
          .map((m) => absUrl(m[1]))
          .filter((src) => /cdn\.shopify|cdn\/shop/i.test(src))
          .slice(0, 12);
      }
      await sleep(150);
    } catch (error) {
      console.warn("page", key, error.message);
      pages[key] = "";
    }
  }

  let articles = [];
  try {
    const blog = await fetchJson(`${ORIGIN}/blogs/blog-sauces/articles.json?limit=12`);
    articles = (blog.articles ?? []).map((a) => ({
      id: String(a.id),
      title: decode(a.title || ""),
      excerpt: htmlToText(a.summary_html || a.excerpt || a.body_html || "").slice(0, 280),
      image: absUrl(a.image?.src || ""),
      url: `${ORIGIN}/blogs/blog-sauces/${a.handle}`,
      publishedAt: a.published_at || null,
    }));
  } catch (error) {
    console.warn("blog", error.message);
  }

  const announcement =
    homeHtml.match(/announcement-bar__message[\s\S]*?<span>([\s\S]*?)<\/span>/i)?.[1] || "";

  return {
    generatedAt: new Date().toISOString(),
    announcement: htmlToText(announcement),
    freeShippingThreshold: 70,
    flatShipping: 8.5,
    returnDays: 14,
    supportEmail: "cs@hottimesauces.com",
    social: {
      facebook: "https://www.facebook.com/profile.php?id=61583076870783",
      youtube: "https://www.youtube.com/@hottimesauces",
      instagram: "https://www.instagram.com/hottimesauces/",
    },
    testimonials: extractTestimonials(homeHtml),
    pages,
    articles,
  };
}

async function main() {
  await mkdir(DATA, { recursive: true });
  const homeHtml = await fetchText(`${ORIGIN}/`);
  const products = await fetchAllProducts();
  const collections = await fetchCollections();
  const membership = {};
  for (const handle of CATEGORY_HANDLES) {
    const handles = await fetchMembership(handle);
    membership[handle] = handles;
    console.log(`membership ${handle}: ${handles.length}`);
    await sleep(120);
  }

  const byHandle = new Map(products.map((p) => [p.handle, p]));
  for (const [collection, handles] of Object.entries(membership)) {
    for (const handle of handles) {
      const product = byHandle.get(handle);
      if (!product) continue;
      product.collections.push(collection);
    }
  }
  for (const product of products) applyCollections(product, product.collections);

  const site = await fetchPages(homeHtml);
  const payloadCollections = {
    generatedAt: new Date().toISOString(),
    collections,
    membership,
  };

  await writeFile(path.join(DATA, "products.json"), JSON.stringify(products));
  await writeFile(path.join(DATA, "collections.json"), JSON.stringify(payloadCollections));
  await writeFile(path.join(DATA, "site.json"), JSON.stringify(site));

  const onSale = products.filter((p) => p.onSale).length;
  const soldOut = products.filter((p) => !p.available).length;
  console.log(
    `CATALOG_DONE products=${products.length} collections=${collections.length} onSale=${onSale} soldOut=${soldOut} testimonials=${site.testimonials.length}`,
  );
  for (const title of [
    "Mark's: Fermented Kimchi Hot Sauce",
    "Puckerbutt Gator Hot Sauce",
    "Hot Ones: The Last Dab Thermageddon Hot Sauce (Season 31)",
  ]) {
    const hit = products.find((p) => p.title === title) || products.find((p) => p.title.includes(title.slice(0, 18)));
    if (hit) console.log("SEED", hit.title, hit.price, hit.compareAtPrice, hit.heatLevel, hit.images[0]?.slice(0, 80));
    else console.log("SEED MISSING", title);
  }
}

main().catch((error) => {
  console.error("CATALOG_FAIL", error);
  process.exit(1);
});
