const headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "text/html",
};

const r = await fetch("https://hottimesauces.com/", { headers });
const html = await r.text();

const i = html.indexOf("The Burn, The Buzz");
console.log("--- BURN SECTION ---");
console.log(html.slice(i, i + 12000).replace(/<script[\s\S]*?<\/script>/g, ""));

console.log("\n--- FOOTER LINKS ---");
const footer = html.slice(html.indexOf("INFORMATION"));
const hrefs = [...footer.matchAll(/href="([^"]+)"[^>]*>([^<]{2,80})</g)].slice(0, 80);
for (const m of hrefs) console.log(m[2].trim(), "=>", m[1]);

console.log("\n--- SOCIAL ---");
for (const m of html.matchAll(/https?:\/\/[^"']+(facebook|instagram|youtube)[^"']*/gi)) {
  console.log(m[0]);
}
