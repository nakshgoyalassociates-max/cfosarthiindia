import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

function crc32(buf) {
  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

const table = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  table[i] = c;
}

function createPng(width, height, getPixel) {
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: 6 (RGBA)
  ihdrData[10] = 0; // Compression method
  ihdrData[11] = 0; // Filter method
  ihdrData[12] = 0; // Interlace method

  const ihdrChunk = createChunk("IHDR", ihdrData);
  const idatChunk = createChunk("IDAT", deflated);
  const iendChunk = createChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = crc32(body);

  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  typeBuf.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

// Generate brand icon pixel
function brandPixel(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Corner radius for rounded squircle (unless maskable, which is full bleed)
  const cornerRadius = w * 0.22;
  const half = w / 2;
  const qx = Math.max(0, Math.abs(dx) - (half - cornerRadius));
  const qy = Math.max(0, Math.abs(dy) - (half - cornerRadius));
  const cornerDist = Math.sqrt(qx * qx + qy * qy);

  if (!isMaskable && cornerDist > cornerRadius) {
    return [0, 0, 0, 0]; // Transparent outside rounded corner
  }

  // Deep midnight slate gradient background
  const ny = y / h;
  const bgR = Math.round(15 + ny * 15);
  const bgG = Math.round(23 + ny * 8);
  const bgB = Math.round(42 + ny * 35);

  // Safe inner scale
  const scale = w / 512;
  const sx = (x - cx) / scale;
  const sy = (y - cy) / scale;

  // Gold shield
  const shieldTop = -160;
  const shieldBottom = 80;
  const inShieldY = sy >= shieldTop && sy <= shieldBottom;
  const maxWAtY = inShieldY ? (sy < -20 ? 140 : 140 * (1 - Math.pow((sy + 20) / 100, 2))) : 0;

  if (Math.abs(sx) <= maxWAtY && inShieldY) {
    // Inside shield border or body
    const edgeDist = maxWAtY - Math.abs(sx);
    if (edgeDist <= 12 || sy - shieldTop <= 12) {
      // Gold gradient border
      return [245, 158, 11, 255]; // Amber gold #f59e0b
    }

    // Inside shield body: Bar chart bars
    // Bar 1: x in [-70, -40], y in [0, 60] (Gold)
    if (sx >= -70 && sx <= -40 && sy >= -20 && sy <= 55) {
      return [251, 191, 36, 255];
    }
    // Bar 2: x in [-20, 10], y in [-60, 60] (Indigo)
    if (sx >= -20 && sx <= 10 && sy >= -60 && sy <= 55) {
      return [99, 102, 241, 255];
    }
    // Bar 3: x in [30, 60], y in [-100, 60] (Emerald)
    if (sx >= 30 && sx <= 60 && sy >= -100 && sy <= 55) {
      return [16, 185, 129, 255];
    }

    // Shield background fill
    return [24, 32, 60, 255];
  }

  // Golden accent ring / subtle glow around shield
  if (dist > w * 0.32 && dist < w * 0.335) {
    return [245, 158, 11, 120];
  }

  // Default deep navy/slate background
  return [bgR, bgG, bgB, 255];
}

const publicDir = path.resolve("public");

const targets = [
  { file: "pwa-192x192.png", size: 192, maskable: false },
  { file: "pwa-512x512.png", size: 512, maskable: false },
  { file: "pwa-maskable-512x512.png", size: 512, maskable: true },
  { file: "apple-touch-icon.png", size: 180, maskable: false },
];

for (const t of targets) {
  const buf = createPng(t.size, t.size, (x, y, w, h) => brandPixel(x, y, w, h, t.maskable));
  fs.writeFileSync(path.join(publicDir, t.file), buf);
  console.log(`Generated ${t.file} (${t.size}x${t.size})`);
}
