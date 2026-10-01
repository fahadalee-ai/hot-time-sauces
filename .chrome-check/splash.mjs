import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const port = 9342;
const dir = new URL("./profile-splash/", import.meta.url);
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
  await send("Page.navigate", { url: "http://127.0.0.1:5173/" });
  await sleep(600);
  await evalJs(`localStorage.setItem("hts.onboarded","1"); localStorage.setItem("hts.guest","1");`);
  await send("Page.navigate", { url: "http://127.0.0.1:5173/" });
  await sleep(800);
  const during = await evalJs(`JSON.stringify({ path: location.pathname, title: document.title, text: document.body ? document.body.innerText.slice(0, 300) : null })`);
  console.log("during", during);
  await sleep(4000);
  const after = await evalJs(`JSON.stringify({ path: location.pathname, title: document.title, text: document.body ? document.body.innerText.slice(0, 300) : null })`);
  console.log("after", after);
} finally {
  chrome.kill();
}
