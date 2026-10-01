import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const srcDir = "C:/Users/40034/.cursor/projects/e-MyProjects-hot-time-sauces/assets";
const outDir = path.resolve("src/img/generated");
await mkdir(outDir, { recursive: true });

const files = [
  "splash-bg",
  "onboarding-1",
  "onboarding-2",
  "onboarding-3",
  "auth-bg",
  "home-hero-1",
  "home-hero-2",
  "empty-cart",
  "empty-wishlist",
  "order-success",
  "flame-texture",
];

for (const name of files) {
  const input = path.join(srcDir, `${name}.jpg`);
  const output = path.join(outDir, `${name}.webp`);
  let quality = 72;
  let buf = await sharp(input).webp({ quality }).toBuffer();
  while (buf.length > 400_000 && quality > 40) {
    quality -= 8;
    buf = await sharp(input).webp({ quality }).toBuffer();
  }
  await sharp(buf).toFile(output);
  const info = await stat(output);
  console.log(`${name}.webp ${Math.round(info.size / 1024)}KB q=${quality}`);
}
