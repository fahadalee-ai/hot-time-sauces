import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const port = 9341;
const dir = new URL("./profile-ux/", import.meta.url);
await mkdir(dir, { recursive: true });
const chrome = spawn(
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  ["--headless=new", "--disable-gpu", "--no-first-run", `--remote-debugging-port=${port}`, `--user-data-dir=${fileURLToPath(dir)}`, "about:blank"],
  { stdio: "ignore" },
);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const report = [];
const check = (name, ok, detail) => {
  report.push(`${ok ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);
};

try {
  let page;
  for (let i = 0; i < 24 && !page; i++) {
    await sleep(250);
    try {
      const list = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json());
      page = list.find((entry) => entry.type === "page");
    } catch { /* starting */ }
  }
  if (!page) throw new Error("no page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve);
    ws.addEventListener("error", reject);
  });
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) pending.get(msg.id)(msg);
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const msgId = ++id;
      const timer = setTimeout(() => reject(new Error("timeout " + method)), 20000);
      pending.set(msgId, (msg) => {
        clearTimeout(timer);
        pending.delete(msgId);
        resolve(msg);
      });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  const evalJs = async (expression) => {
    const msg = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (msg.result?.exceptionDetails) throw new Error(msg.result.exceptionDetails.exception?.description || "eval");
    return msg.result?.result?.value;
  };
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  const go = async (url) => {
    await send("Page.navigate", { url });
    await sleep(900);
  };
  const waitFor = async (fn, ms = 8000) => {
    const start = Date.now();
    let last;
    while (Date.now() - start < ms) {
      last = await evalJs(fn);
      if (last) return last;
      await sleep(200);
    }
    return last;
  };

  await go("http://127.0.0.1:5173/");
  await evalJs(`localStorage.clear(); sessionStorage.clear();`);
  await go("http://127.0.0.1:5173/");
  const guest = await waitFor(`document.body && document.body.innerText.includes("Continue as Guest") ? location.pathname : ""`, 7000);
  check("guest on first screens", guest === "/onboarding", guest);

  await evalJs(`[...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Continue as Guest")?.click()`);
  const home = await waitFor(`location.pathname === "/home" ? "home" : ""`, 4000);
  check("guest lands on home", home === "home", home || (await evalJs("location.pathname")));

  await go("http://127.0.0.1:5173/");
  const backHome = await waitFor(`location.pathname === "/home" ? "home" : (location.pathname === "/onboarding" ? "onboarding" : "")`, 2500);
  check("return visit skips onboarding", backHome === "home", backHome || (await evalJs("location.pathname")));

  await go("http://127.0.0.1:5173/shop");
  await waitFor(`document.body && document.body.innerText.includes("Shop by Heat") ? "ok" : ""`);
  const headings = await evalJs(`[...document.querySelectorAll("h2")].map((n) => n.textContent.trim()).join("|")`);
  const dietaryHidden = await evalJs(`document.body.innerText.includes("Dietary") ? "visible" : "hidden"`);
  check("heat best sellers brands lead shop", /Shop by Heat/.test(headings) && headings.indexOf("Best Sellers") < headings.indexOf("Brands"), headings);
  check("dietary is behind more", dietaryHidden === "hidden", dietaryHidden);
  await evalJs(`[...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "More")?.click()`);
  await sleep(200);
  const dietaryShown = await evalJs(`document.body.innerText.includes("Dietary") && document.body.innerText.includes("Sauce Blog") ? "shown" : "missing"`);
  check("more opens the rest", dietaryShown === "shown", dietaryShown);

  const scrolled = await evalJs(`(() => {
    const scroller = document.querySelector(".phone-scroll");
    scroller.scrollTop = 640;
    return Math.round(scroller.scrollTop);
  })()`);
  await evalJs(`document.querySelector('a[href*="/p/"]')?.click()`);
  const product = await waitFor(`location.pathname.startsWith("/p/") ? location.pathname : ""`);
  check("opened a product", Boolean(product), product);
  await evalJs(`history.back()`);
  await waitFor(`location.pathname === "/shop" ? "shop" : ""`);
  await sleep(400);
  const restored = await evalJs(`Math.round(document.querySelector(".phone-scroll").scrollTop)`);
  check("back restores shop scroll", restored > 400, `left ${scrolled}, back ${restored}`);

  await evalJs(`document.querySelector('a[href*="/p/"]')?.click()`);
  await waitFor(`location.pathname.startsWith("/p/") ? "product" : ""`);
  await evalJs(`[...document.querySelectorAll("button")].find((b) => b.textContent.includes("Add to Cart"))?.click()`);
  await sleep(400);
  await go("http://127.0.0.1:5173/checkout");
  await waitFor(`document.body && document.body.innerText.includes("Checkout") ? "ok" : ""`);
  await evalJs(`[...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Continue")?.click()`);
  await sleep(300);
  const emailErr = await evalJs(`document.body.innerText.includes("Enter an email") ? "yes" : "no"`);
  check("email required", emailErr === "yes", emailErr);

  const filled = await evalJs(`(() => {
    const set = (label, value) => {
      const input = document.querySelector('input[aria-label="' + label + '"]');
      if (!input) return label;
      const proto = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
      proto.set.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      return "";
    };
    const missing = ["Full name", "Email", "Address line 1", "City", "ZIP"].map((label) => set(label, label === "Email" ? "ada@example.com" : label === "ZIP" ? "78701" : label === "City" ? "Austin" : label === "Address line 1" ? "100 Market Street" : "Ada Heat")).filter(Boolean);
    return JSON.stringify({ missing, cart: localStorage.getItem("hts.cart"), text: document.body.innerText.slice(0, 400) });
  })()`);
  console.log("checkout", filled);
  await evalJs(`[...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Continue")?.click()`);
  await sleep(250);
  await evalJs(`[...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Continue")?.click()`);
  await sleep(300);
  const pay = await evalJs(`(() => {
    const text = document.body.innerText;
    return JSON.stringify({
      honest: text.includes("Nothing is charged"),
      apple: text.includes("Apple Pay"),
      review: text.includes("Review Order"),
    });
  })()`);
  const payInfo = JSON.parse(pay);
  check("payment is a demo", payInfo.honest && payInfo.review && !payInfo.apple, pay);

  console.log(report.join("\n"));
  if (report.some((line) => line.startsWith("FAIL"))) process.exitCode = 1;
} catch (error) {
  console.log(report.join("\n"));
  console.error(error);
  process.exitCode = 1;
} finally {
  chrome.kill();
}
