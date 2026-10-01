import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const port = 9342;
const dir = new URL("./profile-hit/", import.meta.url);
await mkdir(dir, { recursive: true });
const chrome = spawn(
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  ["--headless=new", "--disable-gpu", "--no-first-run", `--remote-debugging-port=${port}`, `--user-data-dir=${fileURLToPath(dir)}`, "about:blank"],
  { stdio: "ignore" },
);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
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
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send("Page.navigate", { url: "http://127.0.0.1:5173/checkout" });
  await sleep(1200);
  await evalJs(`localStorage.setItem('hts.cart', JSON.stringify([{id:'c1',handle:'puckerbutt-gator-hot-sauce',variantId:'50544028745793',qty:1}])); sessionStorage.removeItem('hts.checkout');`);
  await send("Page.reload");
  for (let i = 0; i < 20; i++) {
    await sleep(300);
    const text = await evalJs("document.body.innerText");
    if (String(text).includes("Continue")) break;
  }
  for (let n = 0; n < 3; n++) {
    const stepNow = await evalJs(`document.querySelector('[aria-current="step"]')?.innerText || ''`);
    if (stepNow === "Payment") break;
    const hit = await evalJs(`(() => { const button = [...document.querySelectorAll('button')].find((b) => b.innerText.trim() === 'Continue'); if (!button) return 'none'; button.scrollIntoView({block:'center'}); button.click(); return 'clicked '+button.innerText.trim(); })()`);
    await sleep(500);
    const saved = await evalJs(`(sessionStorage.getItem('hts.checkout')||'').slice(0,80)`);
    console.log("STEP", n, stepNow, hit, saved);
  }
  const metrics = await evalJs(`(() => {
    const back = document.querySelector('[aria-label="Back"]');
    const brands = [...document.querySelectorAll('[aria-label="Cards accepted"] li')].map(el => {
      const r = el.getBoundingClientRect();
      return el.innerText + ' ' + Math.round(r.width) + 'x' + Math.round(r.height);
    });
    const br = back.getBoundingClientRect();
    const before = document.querySelector('[aria-current="step"]')?.innerText || '';
    return JSON.stringify({ back: Math.round(br.width) + 'x' + Math.round(br.height), before, brands, top: Math.round(br.top) });
  })()`);
  await evalJs(`document.querySelector('[aria-label="Cards accepted"]')?.scrollIntoView({block:'center'})`);
  await sleep(200);
  const shot = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: 390, height: 720, scale: 1 } });
  await writeFile(new URL("./brands.png", import.meta.url), Buffer.from(shot.result.data, "base64"));
  await evalJs(`document.querySelector('[aria-label="Back"]').click()`);
  await sleep(300);
  const after = await evalJs(`document.querySelector('[aria-current="step"]')?.innerText || ''`);
  console.log(metrics);
  console.log("AFTER", after);
  ws.close();
} finally {
  chrome.kill();
}
