/* dev/farmhand/recolor.mjs — dress the plain crew bodies as farm hands: the default (skin "blank", sprite set
   approved_android) and the four Blank colour variants.

   The station bodies are mannequins. Each frame is recoloured from dev/farmhand/<set>/ (the untouched originals, so
   this can be rerun) into frontend/assets/sprites/<set>/: a bare head, a work shirt (its colour follows the variant's
   name), a belt, trousers, leather gloves and brown boots. The mannequin's own shading is kept: its brightness picks
   the shade on each colour ramp. Regions come from the frame's height, the neck (the narrowest row under the
   head) and, beside the hips, the hands (whatever lies outside the legs' span lower down).

   Regenerate, never hand-edit:   node dev/farmhand/recolor.mjs   (then npm run sync:website) */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const sharp = createRequire(import.meta.url)('sharp');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = path.join(ROOT, 'dev', 'farmhand');
const OUT = path.join(ROOT, 'frontend', 'assets', 'sprites');

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
// dark, mid, light
const RAMP = {
  skin:  ['#6b3d24', '#c98a5a', '#f2c49b'],
  boots: ['#2a1a10', '#5a3a22', '#8a6040'],
};
const SHIRT = { red: ['#4e1414', '#a3302a', '#e0705a'], mustard: ['#5a3f0c', '#c08a1e', '#f0c860'], chambray: ['#1e3550', '#5a86b8', '#a8c8e8'],
  green: ['#1e3a1e', '#4a8040', '#9ccc80'], deepred: ['#3e0e10', '#8a1f24', '#cc5048'] };
const TROUSERS = { denim: ['#1c2c4e', '#3e5f9a', '#86a7d6'], work: ['#3a2a18', '#7a5a34', '#b8925c'] };
// each body: its shirt and trousers
const SETS = {
  approved_android:     { shirt: 'red', trousers: 'denim' },
  approved_blank_amber: { shirt: 'mustard', trousers: 'denim' },
  approved_blank_blue:  { shirt: 'chambray', trousers: 'work' },
  approved_blank_green: { shirt: 'green', trousers: 'denim' },
  approved_blank_red:   { shirt: 'deepred', trousers: 'work' },
};
for (const k of Object.keys(RAMP)) RAMP[k] = RAMP[k].map(hex);
const OUTLINE = hex('#1a120c'), BELT = hex('#3a2414');

// where the trousers start and the boots begin, as a fraction of the figure's height (seated poses fold the legs)
const HIP = { sit: 0.6, type: 0.62 }, BOOT = { sit: 0.9, type: 0.86 };

function shade(ramp, l) {                       // l in 0..1 over the mannequin's lit range
  const t = Math.min(1, Math.max(0, l)) * 2, i = t < 1 ? 0 : 1, f = t - i;
  return ramp[i].map((c, k) => Math.round(c + (ramp[i + 1][k] - c) * f));
}

async function recolor(set, file) {
  const look = { ...RAMP, shirt: SHIRT[SETS[set].shirt].map(hex), trousers: TROUSERS[SETS[set].trousers].map(hex) };
  const { data, info } = await sharp(path.join(SRC, set, file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, at = (x, y) => (y * W + x) * 4, solid = (x, y) => data[at(x, y) + 3] > 0;
  const anim = file.split('_')[0];
  const rows = [];
  for (let y = 0; y < H; y++) {
    const runs = []; let start = -1;
    for (let x = 0; x <= W; x++) {
      const s = x < W && solid(x, y);
      if (s && start < 0) start = x;
      if (!s && start >= 0) { runs.push([start, x - 1]); start = -1; }
    }
    rows.push(runs);
  }
  const ys = rows.map((r, y) => r.length ? y : -1).filter(y => y >= 0);
  if (!ys.length) return;
  const top = ys[0], bottom = ys[ys.length - 1], tall = bottom - top + 1;
  const width = y => rows[y].length ? rows[y][rows[y].length - 1][1] - rows[y][0][0] + 1 : 0;
  // the neck: narrowest row between a tenth and a third of the way down
  let neck = top + Math.round(tall * 0.22), best = 1e9;
  for (let y = top + Math.round(tall * 0.1); y <= top + Math.round(tall * 0.34); y++) if (width(y) && width(y) < best) { best = width(y); neck = y; }
  const hip = top + Math.round(tall * (HIP[anim] || 0.56)), boot = top + Math.round(tall * (BOOT[anim] || 0.92));

  // the legs' span low down: anything beside it near the hips is a hand (in leather gloves)
  const low = rows[top + Math.round(tall * 0.78)] || [], legL = low.length ? low[0][0] - 1 : 0, legR = low.length ? low[low.length - 1][1] + 1 : W;
  const handTop = hip - Math.round(tall * 0.05), handLow = hip + Math.round(tall * 0.12);
  const part = (x, y) => {
    if (y <= neck) return 'skin';
    if (y >= boot) return 'boots';
    if (!HIP[anim] && y >= handTop && y <= handLow && (x < legL || x > legR)) return 'boots';   // seated hands rest in the lap
    if (y === hip) return 'belt';
    return y < hip ? 'shirt' : 'trousers';
  };
  const out = Buffer.from(data);
  for (let y = top; y <= bottom; y++) for (let x = 0; x < W; x++) {
    const i = at(x, y);
    if (!data[i + 3]) continue;
    const L = Math.max(data[i], data[i + 1], data[i + 2]), p = part(x, y);   // brightest channel: the variants are tinted
    const rgb = L < 24 ? OUTLINE : p === 'belt' ? BELT : shade(look[p], (L - 24) / (230 - 24));
    out[i] = rgb[0]; out[i + 1] = rgb[1]; out[i + 2] = rgb[2];
  }
  await sharp(out, { raw: info }).png().toFile(path.join(OUT, set, file));
}

for (const set of Object.keys(SETS)) {
  const files = fs.readdirSync(path.join(SRC, set)).filter(f => f.endsWith('.png'));
  for (const f of files) await recolor(set, f);
  console.log('dressed ' + files.length + ' frames into ' + path.relative(ROOT, path.join(OUT, set)));
}
