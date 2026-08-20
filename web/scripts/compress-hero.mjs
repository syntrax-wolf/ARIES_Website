import sharp from "sharp";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../public/images/landing");

async function conv(src, dest, width, quality) {
  const info = await sharp(path.join(dir, src))
    .resize({ width, withoutEnlargement: true })
    .webp({ quality, effort: 6 })
    .toFile(path.join(dir, dest));
  const before = fs.statSync(path.join(dir, src)).size;
  console.log(`${src} ${before} -> ${dest} ${info.size} (${info.width}x${info.height})`);
}

await conv("hero-sky.png", "hero-sky.webp", 1920, 82);
await conv("hero-stag.png", "hero-stag.webp", 1920, 82);
