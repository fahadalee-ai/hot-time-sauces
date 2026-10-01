import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ORIGIN = "https://hottimesauces.com";
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "application/json,text/html",
};

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
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " "),
  ).trim();
}

async function getText(url) {
  const res = await fetch(url, { headers: HEADERS });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return text;
}

function bodyFrom(payload) {
  try {
    const data = JSON.parse(payload);
    return (
      data.page?.body_html ||
      data.policy?.body ||
      data.blog?.body_html ||
      ""
    );
  } catch {
    const main = payload.match(/<main[\s\S]*?>([\s\S]*?)<\/main>/i)?.[1] || payload;
    return main;
  }
}

function faqFrom(text) {
  const chunks = text
    .split(/\n(?=Q\s*:)/i)
    .map((c) => c.trim())
    .filter((c) => /^Q\s*:/i.test(c));
  return chunks
    .map((chunk) => {
      const [q, ...rest] = chunk.split(/\nA\s*:/i);
      return {
        q: q.replace(/^Q\s*:/i, "").trim(),
        a: rest.join(" ").replace(/\s+/g, " ").trim(),
      };
    })
    .filter((item) => item.q && item.a);
}

function testimonialsFrom(html) {
  const names = [...html.matchAll(/testimonial-content-name[^>]*>([\s\S]*?)<\/h3>/gi)].map((m) =>
    htmlToText(m[1]),
  );
  const blocks = html.split("testimonial-content-prag").slice(1);
  const quotes = blocks.map((block) => htmlToText(block.split("testimonial-rating")[0] || block));
  return quotes
    .map((quote, i) => ({ quote: quote.replace(/\s+/g, " ").trim(), name: names[i] || "Hot Time customer", stars: 5 }))
    .filter((t) => t.quote.length > 30)
    .slice(0, 8);
}

const home = await getText(`${ORIGIN}/`);
const targets = {
  about: `${ORIGIN}/pages/about-us.json`,
  faq: `${ORIGIN}/pages/faqs.json`,
  contact: `${ORIGIN}/pages/contact.json`,
  shu: `${ORIGIN}/pages/pepper-shu.json`,
  privacy: `${ORIGIN}/policies/privacy-policy.json`,
  returns: `${ORIGIN}/policies/refund-policy.json`,
  shipping: `${ORIGIN}/policies/shipping-policy.json`,
};

const pages = {};
for (const [key, url] of Object.entries(targets)) {
  const raw = await getText(url);
  const html = bodyFrom(raw);
  pages[key] = htmlToText(html);
  if (key === "shu") {
    pages.shuImages = [...html.matchAll(/src="([^"]+)"/gi)].map((m) => m[1].replace(/&amp;/g, "&"));
  }
}

let articles = [];
const blogCandidates = [
  `${ORIGIN}/blogs.json`,
  `${ORIGIN}/blogs/blog-sauces.json`,
  `${ORIGIN}/blogs/blog-sauces/articles.json`,
  `${ORIGIN}/blogs/news/articles.json`,
];
for (const url of blogCandidates) {
  try {
    const raw = await getText(url);
    const data = JSON.parse(raw);
    console.log("BLOG OK", url, Object.keys(data));
    const list = data.articles || data.blog?.articles || [];
    if (Array.isArray(list) && list.length) {
      articles = list.slice(0, 12).map((a) => ({
        id: String(a.id),
        title: a.title,
        excerpt: htmlToText(a.summary_html || a.excerpt || a.body_html || "").slice(0, 280),
        image: a.image?.src || "",
        url: `${ORIGIN}/blogs/${data.blog?.handle || "blog-sauces"}/${a.handle}`,
        publishedAt: a.published_at || null,
      }));
    }
    if (data.blogs) console.log("blogs", data.blogs.map((b) => b.handle));
  } catch (error) {
    console.log("BLOG FAIL", url, error.message);
  }
}

const pepperIdx = home.toLowerCase().indexOf("pepper of the week");
console.log("pepper of the week", pepperIdx);
if (pepperIdx >= 0) console.log(home.slice(pepperIdx - 80, pepperIdx + 200).replace(/\s+/g, " "));

const products = JSON.parse(await readFile("src/data/products.json", "utf8"));
const want = ["habanero table", "x-harvest", "harvest spectrum", "charred habanero manzano"];
for (const s of want) {
  const hit = products.find((p) => p.title.toLowerCase().includes(s));
  console.log("FIND", s, hit ? `${hit.title} $${hit.price} ${hit.compareAtPrice ?? ""}` : "missing");
}
const gift = products.find((p) => p.handle === "e-gift-cards");
console.log("GIFT VARIANTS", gift?.variants);
console.log("SHU IMAGES", pages.shuImages);
console.log("FAQ COUNT preview", faqFrom(pages.faq).length);
console.log("SHIP $65", pages.shipping.includes("65"), "$70", pages.shipping.includes("70"));
console.log("SHIP SNIP", pages.shipping.slice(0, 500));
console.log("TESTIMONIALS", testimonialsFrom(home).length);

const site = {
  generatedAt: new Date().toISOString(),
  announcement:
    "Flat Rate USPS Shipping Starts At $8.50 In The USA and FREE Shipping For Orders Starts At $70",
  testimonials: testimonialsFrom(home),
  social: {
    facebook: "https://www.facebook.com/profile.php?id=61583076870783",
    youtube: "https://www.youtube.com/@hottimesauces",
    instagram: "https://www.instagram.com/hottimesauces/",
  },
  supportEmail: "cs@hottimesauces.com",
  contactEmail: "customerservice@hottimesauces.com",
  phone: "1-877-5-HOTTIME",
  about: pages.about,
  faq: faqFrom(pages.faq),
  contact: pages.contact,
  shu: pages.shu,
  shuImages: pages.shuImages ?? [],
  privacy: pages.privacy.slice(0, 5000),
  returns: pages.returns.slice(0, 5000),
  shipping: pages.shipping.slice(0, 5000),
  articles,
  pepperOfTheWeek: null,
};

await writeFile(path.resolve("src/data/site.json"), JSON.stringify(site));
console.log("SITE_REFRESHED", site.faq.length, site.articles.length, site.testimonials.length);
