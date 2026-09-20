/**
 * Write a solid-color PNG (no deps) for PWA install icons.
 * Brand: forest green #0B6E4F on cream #F7FFF9 rounded-ish via full fill + inset mark.
 */
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "site", "icons");
mkdirSync(outDir, { recursive: true });

const svgSrc = path.join(root, "apps", "shared", "branding", "rdoc-logo.svg");
if (existsSync(svgSrc)) {
  copyFileSync(svgSrc, path.join(outDir, "rdoc-logo.svg"));
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

/** Simple branded mark: cream bg, green rounded square, cream fold hint. */
function writeIcon(size, file) {
  const bg = [0xf7, 0xff, 0xf9];
  const green = [0x0b, 0x6e, 0x4f];
  const mint = [0x7b, 0xc6, 0x8e];
  const rows = [];
  const pad = Math.floor(size * 0.12);
  const radius = Math.floor(size * 0.18);

  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 3);
    row[0] = 0; // filter none
    for (let x = 0; x < size; x++) {
      let [r, g, b] = bg;
      const ix = x - pad;
      const iy = y - pad;
      const iw = size - pad * 2;
      const ih = size - pad * 2;
      if (ix >= 0 && iy >= 0 && ix < iw && iy < ih) {
        const inCorner =
          (ix < radius && iy < radius && (ix - radius) ** 2 + (iy - radius) ** 2 > radius ** 2) ||
          (ix > iw - 1 - radius && iy < radius && (ix - (iw - 1 - radius)) ** 2 + (iy - radius) ** 2 > radius ** 2) ||
          (ix < radius && iy > ih - 1 - radius && (ix - radius) ** 2 + (iy - (ih - 1 - radius)) ** 2 > radius ** 2) ||
          (ix > iw - 1 - radius &&
            iy > ih - 1 - radius &&
            (ix - (iw - 1 - radius)) ** 2 + (iy - (ih - 1 - radius)) ** 2 > radius ** 2);
        if (!inCorner) {
          [r, g, b] = green;
          // mint "reflow" bars
          const barY1 = Math.floor(ih * 0.55);
          const barY2 = Math.floor(ih * 0.68);
          const barY3 = Math.floor(ih * 0.81);
          const barH = Math.max(2, Math.floor(size * 0.035));
          const left = Math.floor(iw * 0.22);
          if (iy >= barY1 && iy < barY1 + barH && ix >= left && ix < left + Math.floor(iw * 0.52)) {
            [r, g, b] = mint;
          } else if (iy >= barY2 && iy < barY2 + barH && ix >= left && ix < left + Math.floor(iw * 0.42)) {
            [r, g, b] = mint;
          } else if (iy >= barY3 && iy < barY3 + barH && ix >= left + Math.floor(iw * 0.1) && ix < left + Math.floor(iw * 0.55)) {
            [r, g, b] = mint;
          }
        }
      }
      const o = 1 + x * 3;
      row[o] = r;
      row[o + 1] = g;
      row[o + 2] = b;
    }
    rows.push(row);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = deflateSync(Buffer.concat(rows), { level: 9 });
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  writeFileSync(file, png);
}

writeIcon(192, path.join(outDir, "rdoc-icon-192.png"));
writeIcon(512, path.join(outDir, "rdoc-icon-512.png"));
console.log("Wrote site/icons PWA assets");
