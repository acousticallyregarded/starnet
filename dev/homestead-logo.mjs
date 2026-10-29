/* dev/homestead-logo.mjs — the HOMESTEAD wordmark, built from a pixel-letter grid.

   Writes frontend/assets/brand/homestead-wordmark.svg: ONE fill, so the chrome can use it as a CSS mask
   and tint it with the theme (see .logo-img in css/style.css). With --png it also renders the title
   screen's big mark, frontend/assets/brand/homestead-logo.png, through the bundled Chromium: the same
   letters in amber, filled with plowed furrows the way the old STARNET mark was filled with digits.

   Regenerate, never hand-edit:   node dev/homestead-logo.mjs [--png] */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'frontend', 'assets', 'brand');

// 6 x 7 cells per letter, '#' = filled
const GLYPHS = {
  H: ['#....#', '#....#', '#....#', '######', '#....#', '#....#', '#....#'],
  O: ['.####.', '##..##', '#....#', '#....#', '#....#', '##..##', '.####.'],
  M: ['#....#', '##..##', '#.##.#', '#.##.#', '#....#', '#....#', '#....#'],
  E: ['######', '#.....', '#.....', '#####.', '#.....', '#.....', '######'],
  S: ['.#####', '#.....', '#.....', '.####.', '.....#', '.....#', '#####.'],
  T: ['######', '..##..', '..##..', '..##..', '..##..', '..##..', '..##..'],
  A: ['..##..', '.####.', '##..##', '#....#', '######', '#....#', '#....#'],
  D: ['#####.', '#...##', '#....#', '#....#', '#....#', '#...##', '#####.'],
};
const WORD = 'HOMESTEAD';
const C = 20;                 // px per cell
const GAP = 1;                // cells between letters
const SLANT = 0.24;           // italic shear (dx per dy), the old mark leaned the same way
const H = 7 * C;
const W = (WORD.length * (6 + GAP) - GAP) * C;
const PAD = 4;
const VBW = Math.ceil(W + H * SLANT + PAD * 2), VBH = H + PAD * 2;

// one path: every filled cell as a sheared quad, so the mark is a single shape a mask can use
function cells() {
  const out = [];
  [...WORD].forEach((ch, i) => {
    const g = GLYPHS[ch], x0 = i * (6 + GAP) * C;
    g.forEach((row, y) => [...row].forEach((c, x) => { if (c === '#') out.push([x0 + x * C, y * C]); }));
  });
  return out;
}
const shear = (x, y) => [+(PAD + x + (H - y) * SLANT).toFixed(2), +(PAD + y).toFixed(2)];
function pathD(grow) {
  return cells().map(([x, y]) => {
    const a = shear(x - grow, y - grow), b = shear(x + C + grow, y - grow), c = shear(x + C + grow, y + C + grow), d = shear(x - grow, y + C + grow);
    return `M${a}L${b}L${c}L${d}Z`;
  }).join('');
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VBW} ${VBH}" role="img" aria-label="HOMESTEAD">
<title>HOMESTEAD</title>
<!-- Built by dev/homestead-logo.mjs from a 6x7 pixel-letter grid. Regenerate, never hand-edit. -->
<path fill="currentColor" d="${pathD(0.6)}"/>
</svg>
`;
fs.writeFileSync(path.join(OUT, 'homestead-wordmark.svg'), svg);
console.log('homestead-wordmark.svg  viewBox ' + VBW + ' x ' + VBH);

if (process.argv.includes('--png')) {
  const { chromium } = createRequire(import.meta.url)('playwright');   // a dev dependency, or NODE_PATH to a global one
  const S = 2;                                      // render scale
  const ext = 10;                                   // the dark extrusion under the letters, px
  const html = `<!doctype html><html><body style="margin:0;background:transparent">
<svg xmlns="http://www.w3.org/2000/svg" width="${VBW * S}" height="${(VBH + ext) * S}" viewBox="0 0 ${VBW} ${VBH + ext}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffd27a"/><stop offset="0.45" stop-color="#ffa53a"/><stop offset="1" stop-color="#e8641c"/>
    </linearGradient>
    <pattern id="rows" width="6" height="6" patternUnits="userSpaceOnUse">
      <rect width="6" height="6" fill="url(#g)"/><rect y="4" width="6" height="1.4" fill="#9c3d10" opacity="0.55"/>
    </pattern>
    <clipPath id="clip"><path d="${pathD(0.6)}"/></clipPath>
  </defs>
  <g transform="translate(0 ${ext})"><path d="${pathD(1.4)}" fill="#4a1c08"/></g>
  <g transform="translate(0 ${ext / 2})"><path d="${pathD(1.2)}" fill="#7a3210"/></g>
  <g clip-path="url(#clip)"><rect width="${VBW}" height="${VBH}" fill="url(#g)"/><rect width="${VBW}" height="${VBH}" fill="url(#rows)"/></g>
</svg></body></html>`;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: VBW * S, height: (VBH + ext) * S } });
  await p.setContent(html);
  await p.locator('svg').screenshot({ path: path.join(OUT, 'homestead-logo.png'), omitBackground: true });
  await b.close();
  console.log('homestead-logo.png      ' + VBW * S + ' x ' + (VBH + ext) * S);
}
