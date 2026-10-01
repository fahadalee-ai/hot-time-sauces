const headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "text/html,application/json",
};

const r = await fetch("https://hottimesauces.com/", { headers });
const html = await r.text();
console.log("status", r.status, "len", html.length);

const links = [...html.matchAll(/href="([^"]*\/collections\/[^"#?]+)/g)].map((m) => m[1]);
const uniq = [...new Set(links)];
console.log("COLLECTION LINKS", uniq.length);
console.log(uniq.join("\n"));

const needles = [
  "free shipping",
  "8.50",
  "$65",
  "$70",
  "cs@hottimesauces",
  "The Burn",
  "instagram",
  "youtube",
  "14-day",
  "14 day",
];
for (const t of needles) {
  const i = html.toLowerCase().indexOf(t.toLowerCase());
  console.log("\n===", t, i);
  if (i >= 0) console.log(html.slice(Math.max(0, i - 160), i + 280).replace(/\s+/g, " "));
}
