// KORVATH DEEP — a travel poster for a city at the bottom of the sea.
// Painted from scratch in one file: gradient water, god rays, a spiral shell
// tower with lit windows, domes, jellyfish and a rising field of bubbles.
import { writeFileSync, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";

const CW = 768;
const CH = 1024;
const img = new Uint8Array(CW * CH * 3);

let rs = 424243;
function rand() {
  rs = (Math.imul(rs, 1103515245) + 12345) & 0x7fffffff;
  return rs / 0x7fffffff;
}
function rgb(h) {
  return [parseInt(h.substring(1, 3), 16), parseInt(h.substring(3, 5), 16), parseInt(h.substring(5, 7), 16)];
}
function blend(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
function dot(x, y, c, a) {
  x |= 0; y |= 0;
  if (x < 0 || y < 0 || x >= CW || y >= CH) return;
  const i = (y * CW + x) * 3;
  img[i] = img[i] * (1 - a) + c[0] * a;
  img[i + 1] = img[i + 1] * (1 - a) + c[1] * a;
  img[i + 2] = img[i + 2] * (1 - a) + c[2] * a;
}
function water() {
  const stops = [
    [0, rgb("#7fd4c9")], [140, rgb("#3d9db8")], [380, rgb("#1668a0")],
    [640, rgb("#0a3d6e")], [860, rgb("#062544")], [1024, rgb("#041a33")],
  ];
  for (let y = 0; y < CH; y++) {
    let s = 0;
    while (s < stops.length - 2 && y > stops[s + 1][0]) s++;
    const c = blend(stops[s][1], stops[s + 1][1], Math.min(1, Math.max(0, (y - stops[s][0]) / (stops[s + 1][0] - stops[s][0]))));
    for (let x = 0; x < CW; x++) {
      const i = (y * CW + x) * 3;
      img[i] = c[0]; img[i + 1] = c[1]; img[i + 2] = c[2];
    }
  }
}
function blob(cx, cy, r, c, a) {
  for (let y = Math.floor(cy - r); y < cy + r; y++) {
    const w = Math.sqrt(Math.max(0, r * r - (y - cy) * (y - cy)));
    for (let x = Math.floor(cx - w); x < cx + w; x++) dot(x, y, c, a);
  }
}
function oval(cx, cy, rx, ry, c, a) {
  for (let y = Math.floor(cy - ry); y < cy + ry; y++) {
    const t = (y - cy) / ry;
    const w = rx * Math.sqrt(Math.max(0, 1 - t * t));
    for (let x = Math.floor(cx - w); x < cx + w; x++) dot(x, y, c, a);
  }
}
function halo(cx, cy, rx, ry, c, a) {
  for (let k = 6; k >= 1; k--) oval(cx, cy, (rx * k) / 6, (ry * k) / 6, c, a / 3.2);
}
function shape(pts, c, a) {
  let lo = Infinity, hi = -Infinity;
  for (const p of pts) { lo = Math.min(lo, p[1]); hi = Math.max(hi, p[1]); }
  for (let y = Math.floor(lo); y <= hi; y++) {
    const cuts = [];
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = pts[(i + 1) % pts.length];
      if ((p[1] <= y && q[1] > y) || (q[1] <= y && p[1] > y)) cuts.push(p[0] + ((y - p[1]) / (q[1] - p[1])) * (q[0] - p[0]));
    }
    cuts.sort((m, n) => m - n);
    for (let i = 0; i + 1 < cuts.length; i += 2)
      for (let x = Math.floor(cuts[i]); x <= cuts[i + 1]; x++) dot(x, y, c, a);
  }
}
function stroke(x0, y0, x1, y1, w, c, a) {
  const d = Math.hypot(x1 - x0, y1 - y0);
  const n = Math.max(1, Math.ceil(d / (w * 0.3)));
  for (let i = 0; i <= n; i++) blob(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, w / 2, c, a);
}
function box(x, y, w, h, c, a) {
  for (let j = y | 0; j < y + h; j++) for (let i = x | 0; i < x + w; i++) dot(i, j, c, a);
}

// Hand-drawn stroke letters, 4 by 6 grid, same painterly idea, own hand.
const GLYPHS = {
  A: [[[0, 6], [2, 0], [4, 6]], [[1.1, 4.1], [2.9, 4.1]]],
  B: [[[0, 0], [0, 6]], [[0, 0], [2.6, 0], [3.7, 1], [2.6, 2.1], [0, 2.1]], [[0, 2.1], [2.9, 2.1], [3.9, 3.6], [2.9, 6], [0, 6]]],
  C: [[[4, 1.4], [2.7, 0.1], [0.9, 0.7], [0, 3], [0.9, 5.3], [2.7, 5.9], [4, 4.6]]],
  D: [[[0, 0], [0, 6]], [[0, 0], [2.4, 0], [4, 1.9], [4, 4.1], [2.4, 6], [0, 6]]],
  E: [[[4, 0], [0, 0], [0, 6], [4, 6]], [[0, 3], [3.1, 3]]],
  F: [[[4, 0], [0, 0], [0, 6]], [[0, 3], [3.1, 3]]],
  G: [[[4, 1.4], [2.7, 0.1], [0.9, 0.7], [0, 3], [0.9, 5.3], [2.7, 5.9], [4, 5.9], [4, 3.7], [2.5, 3.7]]],
  H: [[[0, 0], [0, 6]], [[4, 0], [4, 6]], [[0, 3], [4, 3]]],
  I: [[[2, 0], [2, 6]], [[0.6, 0], [3.4, 0]], [[0.6, 6], [3.4, 6]]],
  J: [[[4, 0], [4, 4.5], [3.1, 5.8], [1.3, 6], [0.3, 4.9]]],
  K: [[[0, 0], [0, 6]], [[4, 0], [0.7, 3.1]], [[1.3, 2.5], [4, 6]]],
  L: [[[0, 0], [0, 6], [4, 6]]],
  M: [[[0, 6], [0, 0], [2, 3.4], [4, 0], [4, 6]]],
  N: [[[0, 6], [0, 0], [4, 6], [4, 0]]],
  O: [[[2, 0], [3.6, 0.7], [4, 3], [3.6, 5.3], [2, 6], [0.4, 5.3], [0, 3], [0.4, 0.7], [2, 0]]],
  P: [[[0, 6], [0, 0], [3, 0], [4, 1.1], [3, 2.5], [0, 2.5]]],
  Q: [[[2, 0], [3.6, 0.7], [4, 3], [3.6, 5.3], [2, 6], [0.4, 5.3], [0, 3], [0.4, 0.7], [2, 0]], [[2.7, 4.3], [4.3, 6.3]]],
  R: [[[0, 6], [0, 0], [3, 0], [4, 1.1], [3, 2.5], [0, 2.5]], [[2.1, 2.5], [4, 6]]],
  S: [[[4, 0.9], [2.7, 0], [0.9, 0.6], [0.5, 1.9], [2, 2.9], [3.4, 3.7], [3.6, 5], [2.4, 6], [0.3, 5.3]]],
  T: [[[0, 0], [4, 0]], [[2, 0], [2, 6]]],
  U: [[[0, 0], [0, 4.3], [0.8, 5.6], [2, 6], [3.2, 5.6], [4, 4.3], [4, 0]]],
  V: [[[0, 0], [2, 6], [4, 0]]],
  W: [[[0, 0], [0.8, 6], [2, 2.7], [3.2, 6], [4, 0]]],
  X: [[[0, 0], [4, 6]], [[4, 0], [0, 6]]],
  Y: [[[0, 0], [2, 2.8], [4, 0]], [[2, 2.8], [2, 6]]],
  Z: [[[0, 0], [4, 0], [0, 6], [4, 6]]],
  " ": [],
};
function lettering(text, cx, y, size, c, a, track) {
  const s = size / 6;
  const total = text.length * 5 * s + (text.length - 1) * track * s;
  let x = cx - total / 2;
  const w = Math.max(2.4, size * 0.17);
  for (const ch of text.toUpperCase()) {
    for (const st of GLYPHS[ch] || [])
      for (let i = 0; i + 1 < st.length; i++)
        stroke(x + st[i][0] * s, y + st[i][1] * s, x + st[i + 1][0] * s, y + st[i + 1][1] * s, w, c, a);
    x += 5 * s + track * s;
  }
}

// ---- The scene: light falling into the trench, the shell city below ----
water();

// Bright surface band and the shafts of light that lean through it.
for (let x = 0; x < CW; x += 6) {
  const shimmer = 0.5 + 0.5 * Math.sin(x * 0.11) * Math.sin(x * 0.031 + 2);
  for (let y = 0; y < 26; y++) dot(x + rand() * 4, y, rgb("#eafffa"), 0.25 * shimmer);
}
const rayC = rgb("#bfeef2");
for (const [rx, rw, lean] of [[120, 54, 60], [300, 30, 44], [470, 70, 74], [640, 36, 52]]) {
  shape([[rx, 0], [rx + rw, 0], [rx + rw + lean, 700], [rx + lean, 700]], rayC, 0.07);
  shape([[rx + 8, 0], [rx + rw - 10, 0], [rx + rw - 10 + lean, 700], [rx + 8 + lean, 700]], rayC, 0.06);
}

// Far trench walls, soft silhouettes at the edges.
shape([[0, 420], [120, 520], [90, 1024], [0, 1024]], rgb("#07293f"), 0.85);
shape([[768, 380], [640, 500], [676, 1024], [768, 1024]], rgb("#07293f"), 0.85);

// The great spiral shell tower: stacked, shrinking arcs of shell with a
// glowing seam, ringed by windows like portholes of a ship that stayed.
const TCX = 392, TTOP = 268, TBASE = 872;
halo(TCX, 560, 250, 330, rgb("#2e7ea6"), 0.30);
for (let i = 0; i < 15; i++) {
  const t = i / 15;
  const y = TTOP + (TBASE - TTOP) * t;
  const wdt = 30 + 168 * Math.pow(t, 0.8);
  const shellC = blend(rgb("#e8d9b0"), rgb("#b98a5e"), t);
  oval(TCX, y, wdt, 26 - t * 6, shellC, 1);
  oval(TCX, y - 4, wdt * 0.94, 20 - t * 5, blend(shellC, rgb("#fff3d0"), 0.35), 0.8);
  // Porthole windows ride each whorl, lit amber.
  const n = Math.max(1, Math.round(wdt / 34));
  for (let j = 0; j < n; j++) {
    const wx = TCX - wdt * 0.78 + (j + 0.5) * ((wdt * 1.56) / n);
    if (rand() > 0.22) blob(wx, y + 2, 4.6, rgb("#ffca66"), 0.95);
  }
}
// The spire tip and its beacon.
shape([[TCX - 16, TTOP + 8], [TCX + 16, TTOP + 8], [TCX, TTOP - 58]], rgb("#e8d9b0"), 1);
halo(TCX, TTOP - 62, 26, 26, rgb("#ffd98a"), 0.8);
blob(TCX, TTOP - 62, 7, rgb("#fff3d0"), 1);

// Dome houses clustered at the tower's foot, each with a lit door.
function dome(cx, cy, r) {
  oval(cx, cy, r, r * 0.82, rgb("#d9c491"), 1);
  oval(cx, cy - r * 0.1, r * 0.9, r * 0.7, rgb("#e8d9b0"), 0.7);
  box(cx - 5, cy + r * 0.28, 10, r * 0.42, rgb("#ffca66"), 0.95);
  blob(cx, cy - r * 0.34, 3.4, rgb("#fff3d0"), 0.9);
}
dome(168, 838, 62);
dome(268, 876, 44);
dome(560, 852, 54);
dome(648, 884, 38);
dome(96, 884, 34);

// Coral and rock along the seabed.
shape([[0, 930], [140, 896], [330, 922], [520, 898], [768, 928], [768, 1024], [0, 1024]], rgb("#0a2e47"), 1);
for (let i = 0; i < 26; i++) {
  const x = rand() * CW;
  const y = 916 + rand() * 60;
  const h = 14 + rand() * 30;
  const cc = [rgb("#e2703a"), rgb("#d95763"), rgb("#e8a56b")][i % 3];
  stroke(x, y + h, x + (rand() - 0.5) * 14, y, 4, cc, 0.9);
  blob(x + (rand() - 0.5) * 14, y, 3.6, cc, 0.95);
  stroke(x, y + h, x + 10 + rand() * 8, y + h * 0.4, 3.4, cc, 0.8);
}

// Jellyfish drifting up the left shaft of light, bells and trailing threads.
function jelly(cx, cy, r, c) {
  halo(cx, cy, r * 1.5, r * 1.3, c, 0.35);
  oval(cx, cy, r, r * 0.78, c, 0.75);
  for (let i = -2; i <= 2; i++) {
    const tx = cx + i * r * 0.3;
    let py = cy + r * 0.6;
    for (let k = 0; k < 5; k++) {
      const nx = tx + Math.sin(k * 1.3 + i) * 5;
      const ny = py + r * 0.34;
      stroke(tx, py, nx, ny, 2.2, c, 0.55);
      py = ny;
    }
  }
}
jelly(140, 300, 34, rgb("#f2a7c3"));
jelly(226, 420, 22, rgb("#a7d8f2"));
jelly(96, 520, 16, rgb("#f2d8a7"));

// A school of small fish crossing the middle distance.
for (let i = 0; i < 12; i++) {
  const fx = 470 + rand() * 240;
  const fy = 380 + rand() * 150;
  const s = 6 + rand() * 5;
  shape([[fx - s, fy], [fx + s, fy - s * 0.42], [fx + s, fy + s * 0.42]], rgb("#0b3355"), 0.8);
  shape([[fx - s, fy], [fx - s * 1.7, fy - s * 0.5], [fx - s * 1.7, fy + s * 0.5]], rgb("#0b3355"), 0.8);
}

// Bubbles rising everywhere, denser near the city.
for (let i = 0; i < 130; i++) {
  const bx = rand() * CW;
  const by = 120 + rand() * 800;
  const r = 1.6 + rand() * 4.4;
  blob(bx, by, r, rgb("#dff6ff"), 0.30);
  blob(bx - r * 0.3, by - r * 0.3, r * 0.4, rgb("#ffffff"), 0.5);
}

// The name rests on the dark water at the bottom, pale as moonlight on a swell.
lettering("KORVATH", CW / 2 + 3, 903, 72, rgb("#02101f"), 0.6, 0.5);
lettering("KORVATH", CW / 2, 900, 72, rgb("#d9f4f0"), 1, 0.5);
lettering("DEEP", CW / 2, 984, 30, rgb("#8fd0d8"), 0.95, 1.6);

// ---- PNG out: Paeth-filtered rows this time, same zlib heart ----
const TABLE = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  TABLE[n] = c >>> 0;
}
function crc(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function part(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const sum = Buffer.alloc(4);
  sum.writeUInt32BE(crc(body));
  return Buffer.concat([len, body, sum]);
}
function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}
function png() {
  const stride = CW * 3;
  const raw = Buffer.alloc((stride + 1) * CH);
  for (let y = 0; y < CH; y++) {
    const row = y * (stride + 1);
    raw[row] = 4; // Paeth
    for (let i = 0; i < stride; i++) {
      const cur = img[y * stride + i];
      const a = i >= 3 ? img[y * stride + i - 3] : 0;
      const b = y > 0 ? img[(y - 1) * stride + i] : 0;
      const c = y > 0 && i >= 3 ? img[(y - 1) * stride + i - 3] : 0;
      raw[row + 1 + i] = (cur - paeth(a, b, c)) & 0xff;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(CW, 0);
  ihdr.writeUInt32BE(CH, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    part("IHDR", ihdr),
    part("IDAT", deflateSync(raw, { level: 9 })),
    part("IEND", Buffer.alloc(0)),
  ]);
}
const dest = process.env.ENTRY_OUT || "/output/entry.png";
try { mkdirSync(dest.slice(0, dest.lastIndexOf("/")), { recursive: true }); } catch { /* provided */ }
writeFileSync(dest, png());
console.log("KORVATH DEEP poster written to", dest);
