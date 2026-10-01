import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const port = 9337;
const dir = new URL("./profile/", import.meta.url);
await mkdir(dir, { recursive: true });
const chrome = spawn("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", ["--headless=new", "--disable-gpu", "--no-first-run", `--remote-debugging-port=${port}`, `--user-data-dir=${fileURLToPath(dir)}`, "about:blank"], { stdio: "ignore" });
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
  await new Promise((resolve, reject) => { ws.addEventListener("open", resolve); ws.addEventListener("error", reject); });
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (event) => { const msg = JSON.parse(event.data); if (msg.id && pending.has(msg.id)) pending.get(msg.id)(msg); });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const msgId = ++id;
    const timer = setTimeout(() => reject(new Error("timeout " + method)), 20000);
    pending.set(msgId, (msg) => { clearTimeout(timer); pending.delete(msgId); resolve(msg); });
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });
  const evalJs = async (expression) => {
    const msg = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (msg.result?.exceptionDetails) throw new Error(msg.result.exceptionDetails.exception?.description || "eval");
    return msg.result?.result?.value;
  };
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  const shot = async (name) => {
    const result = await send("Page.captureScreenshot", { format: "png" });
    await writeFile(new URL(`./${name}.png`, import.meta.url), Buffer.from(result.result.data, "base64"));
  };
  const wait = async (needle) => {
    for (let i = 0; i < 25; i++) {
      await sleep(400);
      const text = await evalJs("document.body.innerText.slice(0, 300)");
      if (String(text).includes(needle)) return;
    }
  };
  await send("Page.navigate", { url: "http://127.0.0.1:5173/home" });
  await wait("Shop by Heat");
  await shot("home");
  await evalJs(`[...document.querySelectorAll('a')].find((a) => a.getAttribute('href')?.includes('/p/'))?.click()`);
  await sleep(1200);
  const product = await evalJs("location.pathname + ' | ' + (document.querySelector('h1')?.innerText || '')");
  await shot("product");
  await send("Page.navigate", { url: "http://127.0.0.1:5173/account" });
  await wait("Log out");
  await evalJs(`[...document.querySelectorAll('button')].find((b) => /log out/i.test(b.innerText))?.click()`);
  await sleep(400);
  const sheet = await evalJs("document.body.innerText.includes('Log out?')");
  await shot("logout");
  console.log("PRODUCT", product);
  console.log("SHEET", sheet);
  ws.close();
} finally { chrome.kill(); }
