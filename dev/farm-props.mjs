/* dev/farm-props.mjs — redraw station props as farm props with the OpenAI image API.

   Each prop is redrawn FROM ITS CURRENT ART (images/edits, the approved station sprite as the reference), so the
   view, framing, proportions and outline weight carry over and the new sprite still fits the prop's footprint.
   Prop ids, footprints and grants never change: only the picture does.

     node dev/farm-props.mjs desk comms_dish          generate into dev/farm-art/ for review (nothing installed)
     node dev/farm-props.mjs --install desk           trim and install the reviewed sprite over the station one
     node dev/farm-props.mjs --list                   the props that have a farm brief

   Needs ChatGPT_API_KEY (or OPENAI_API_KEY) and, behind a proxy, NODE_USE_ENV_PROXY=1. FARM_IMAGE_MODEL picks the
   model (default gpt-image-1.5). The originals stay in git history: an install is a plain file replacement. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SET = path.join(ROOT, 'frontend', 'assets', 'industrial', 'projection-correction');
const REVIEW = path.join(ROOT, 'dev', 'farm-art');
const MODEL = process.env.FARM_IMAGE_MODEL || 'gpt-image-1.5';
const KEY = process.env.ChatGPT_API_KEY || process.env.OPENAI_API_KEY;

// what each station prop becomes on the farm; the capability it grants stays the same (see docs/FARM_REMASTER.md)
const FARM = {
  desk: 'a farmhouse roll-top writing desk in warm worn oak, with an old beige computer monitor showing a dim amber screen and a keyboard on the desktop, brass drawer pulls',
  comms_dish: 'a small farm windmill: a wooden lattice tower on a stone and timber base, with a many-bladed metal wind wheel and a tail vane at the top',
  gigs_servercart: 'an almanac stand: a small wooden cart with iron wheels holding a thick open farmer\'s almanac on a slanted lectern, with ledgers and seed packets stacked on the shelf below',
  war_intelcab: 'a tall farmhouse seed and records cabinet in dark stained wood, with rows of small labelled drawers, brass handles and a padlocked top door',
  workbench: 'a sturdy carpenter\'s workbench of thick planks with a cast-iron vise, a few hand tools hanging from a pegboard back, and a small old computer terminal with an amber screen on one end',
  studio: 'a painter\'s corner: a wooden easel holding a canvas of a farm landscape, with a small table of paint pots, brushes in a jar and a folded drop cloth',
  plant: 'a young sunflower growing in a terracotta pot',
  chair: 'a wooden farmhouse chair with a spindle back and a linen seat cushion, standing on four turned wooden legs (no swivel base, no wheels)',
};

/* ART OUTSIDE THE MANIFEST: the agent's own workstation and its chair are drawn from fixed files whose sizes the
   renderer assumes, so these are redrawn from the file and installed into the SAME canvas size (fit, bottom-centred). */
const ART = path.join(ROOT, 'frontend', 'assets', 'industrial');
const DESK_BRIEF = 'a farmhouse writing desk in warm worn oak with brass pulls, an old beige computer monitor with a dim amber screen and a keyboard on top';
const CHAIR_BRIEF = 'a wooden farmhouse chair with spindle back and a linen seat cushion';
const FILES = {
  'workstation.png': DESK_BRIEF + ', seen from the front, without any chair',
  'workstation-compact.png': DESK_BRIEF + ', narrower and taller, seen from the front, without any chair',
  'remaster/workstation-n.png': 'the BACK of a farmhouse writing desk in warm worn oak: we see its plain panelled wooden back and the beige back casing of an old computer monitor on top (no screen visible, no keyboard visible), without any chair',
  'remaster/workstation-compact-n.png': 'the BACK of a narrow farmhouse writing desk in warm worn oak: we see its plain panelled wooden back and the beige back casing of an old computer monitor on top (no screen visible, no keyboard visible), without any chair',
  'remaster/workstation-e.png': DESK_BRIEF + ', turned sideways and seen end-on from its short side exactly like the reference, narrow and tall, without any chair',
  'chair-s.png': CHAIR_BRIEF + ', seen from the front',
  'chair-n.png': CHAIR_BRIEF + ', seen from behind',
  'chair-e.png': CHAIR_BRIEF + ' standing on four turned wooden legs (no swivel base, no wheels), seen from its side, facing the same way as the reference',
  'console-bank.png': 'a long low farmhouse dresser in oak with three old wooden-cased radios and a small amber-screen monitor on top',
};
/* the agent's workstation is drawn under its own work light (world.js drawLitProp), tuned for dark metal: warm oak
   under the same light reads hot orange, so these files are installed a step darker and less saturated */
const TONE = { 'workstation.png': 0.62, 'workstation-compact.png': 0.62, 'remaster/workstation-n.png': 0.62,
  'remaster/workstation-compact-n.png': 0.62, 'remaster/workstation-e.png': 0.62 };
const fileOut = f => 'file-' + f.replace(/[\/]/g, '__');

const STYLE = 'Redraw this game prop as {WHAT}. Keep exactly the art style of the reference image: chunky pixel art with thick dark outlines, ' +
  'the same three-quarter front view, the same proportions, size and footprint, lit from the top-left, standing on its base at the bottom ' +
  'of the frame. Warm farm materials (weathered wood, wrought iron, brass, linen, stone). No sci-fi parts, no glowing blue. ' +
  'Only the object, centered, on a fully transparent background, with no floor, shadow plate, text or border.';

function sizeFor(w, h) {
  const r = w / h;
  return r > 1.25 ? '1536x1024' : r < 0.8 ? '1024x1536' : '1024x1024';
}

// every facing a prop is drawn in (s = its front, n = from behind, e/w = from the side), each redrawn from its own art
const FACING = { s: 'seen from the front, as in the reference', n: 'seen from behind, as in the reference (its back faces the viewer)',
  e: 'turned sideways and seen END-ON from its short side, exactly like the reference: keep the reference\'s narrow, tall silhouette and aspect ratio, nothing wider',
  w: 'turned sideways and seen END-ON from its short side, exactly like the reference: keep the reference\'s narrow, tall silhouette and aspect ratio, nothing wider' };
// a prop's east view is its west view mirrored (the station sheet drew them as mirror pairs): generate w, flip for e
const MIRROR = { e: 'w' };
const outName = (id, key) => id + (key === 's' ? '' : '-' + key) + '.png';

async function generate(id) {
  if (!KEY) throw new Error('no ChatGPT_API_KEY / OPENAI_API_KEY in the environment');
  const manifest = JSON.parse(fs.readFileSync(path.join(SET, 'manifest.json'), 'utf8'));
  const views = manifest.props[id] && manifest.props[id].views;
  if (!views || !views.s) throw new Error(id + ': no south view in the manifest');
  if (!FARM[id]) throw new Error(id + ': no farm brief yet (add one to FARM)');
  const only = (process.env.FARM_VIEWS || '').split(',').filter(Boolean);
  const keys = Object.keys(views).filter(k => (!only.length || only.includes(k)) && !(MIRROR[k] && views[MIRROR[k]]));
  await Promise.all(keys.map(k => generateView(id, k, views[k])));
  for (const [k, from] of Object.entries(MIRROR)) {
    if (!views[k] || !views[from] || !fs.existsSync(path.join(REVIEW, outName(id, from)))) continue;
    await require('sharp')(path.join(REVIEW, outName(id, from))).flop().toFile(path.join(REVIEW, outName(id, k)));
    console.log(id + '.' + k + ' = ' + id + '.' + from + ' mirrored');
  }
}

async function generateView(id, key, view) {
  return draw(path.join(SET, view.image), FARM[id] + ', ' + (FACING[key] || FACING.s), view.sourceWidth, view.sourceHeight, outName(id, key), id + '.' + key);
}

async function generateFile(f) {
  if (!FILES[f]) throw new Error(f + ': no farm brief yet (add one to FILES)');
  const meta = await require('sharp')(path.join(ART, f)).metadata();
  return draw(path.join(ART, f), FILES[f], meta.width, meta.height, fileOut(f), f);
}

async function draw(srcPath, what, w, h, outFile, label) {
  if (!KEY) throw new Error('no ChatGPT_API_KEY / OPENAI_API_KEY in the environment');
  const src = fs.readFileSync(srcPath);
  const form = new FormData();
  form.append('model', MODEL);
  form.append('image[]', new Blob([src], { type: 'image/png' }), path.basename(srcPath));
  form.append('prompt', STYLE.replace('{WHAT}', what));
  form.append('size', sizeFor(w, h));
  form.append('background', 'transparent');
  form.append('quality', 'high');
  form.append('output_format', 'png');
  const res = await fetch('https://api.openai.com/v1/images/edits', { method: 'POST', headers: { Authorization: 'Bearer ' + KEY }, body: form });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(label + ': ' + res.status + ' ' + ((body.error && body.error.message) || 'image request failed'));
  fs.mkdirSync(REVIEW, { recursive: true });
  const out = path.join(REVIEW, outFile);
  fs.writeFileSync(out, Buffer.from(body.data[0].b64_json, 'base64'));
  console.log(label + ' -> ' + path.relative(ROOT, out));
}

// trim the reviewed sprite to its opaque pixels and put it where the station one was; the manifest learns its size
async function install(id) {
  const manifest = JSON.parse(fs.readFileSync(path.join(SET, 'manifest.json'), 'utf8'));
  for (const [key, view] of Object.entries(manifest.props[id].views)) {
    if (fs.existsSync(path.join(REVIEW, outName(id, key)))) await installView(id, key, view);
    else console.log(id + '.' + key + ': no reviewed art, the station view stays');
  }
  fs.writeFileSync(path.join(SET, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
}

// trim, then put on the station sheet's pixel grid (gridW art pixels across): hard alpha, a small palette, whole-pixel upscale
async function pixelate(from, gridW, up) {
  const sharp = require('sharp');
  const cut = await sharp(from).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
  const gridH = Math.max(16, Math.round(gridW * cut.info.height / cut.info.width));
  const small = await sharp(cut.data).resize(gridW, gridH, { kernel: 'lanczos3' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 3; i < small.data.length; i += 4) small.data[i] = small.data[i] >= 128 ? 255 : 0;
  const snapped = await sharp(small.data, { raw: small.info }).png({ palette: true, colours: 64, dither: 0 }).toBuffer();
  return sharp(snapped).resize(gridW * up, gridH * up, { kernel: 'nearest' }).png().toBuffer({ resolveWithObject: true });
}

async function installFile(f) {
  const sharp = require('sharp');
  const from = path.join(REVIEW, fileOut(f));
  if (!fs.existsSync(from)) throw new Error(f + ': nothing to install, generate and review it first');
  const meta = await sharp(path.join(ART, f)).metadata();
  const art = await pixelate(from, Math.max(16, Math.round(meta.width / 8)), 8);
  // the SAME canvas the renderer expects: fitted inside it, centred, standing on the bottom edge
  let fit = sharp(art.data).resize(meta.width, meta.height, { fit: 'contain', position: 'south', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: 'nearest' });
  if (TONE[f]) fit = fit.modulate({ brightness: TONE[f], saturation: 0.8 });
  const fitted = await fit.png().toBuffer();
  fs.writeFileSync(path.join(ART, f), fitted);
  console.log(f + ' installed at ' + meta.width + 'x' + meta.height);
}

async function installView(id, key, view) {
  const sharp = require('sharp');
  const from = path.join(REVIEW, outName(id, key));
  /* ONE PIXEL GRID FOR EVERY SPRITE. The model sometimes paints rather than pixels; the station sheet sits at about
     3.5 art pixels per world pixel. Average down to that grid, snap alpha hard and the colours to a small palette,
     then scale back up by whole pixels, so a painterly result and a pixel one read as the same kind of art. */
  const trimmed = await pixelate(from, Math.max(16, Math.round(view.bounds.width * 3.5)), 8);
  fs.writeFileSync(path.join(SET, view.image), trimmed.data);
  view.sourceWidth = trimmed.info.width;
  view.sourceHeight = trimmed.info.height;
  view.contact = { x: 0.5, y: 1 };
  console.log(id + '.' + key + ' installed: ' + view.image + ' ' + trimmed.info.width + 'x' + trimmed.info.height);
}

const args = process.argv.slice(2);
if (args.includes('--list')) { console.log(Object.keys(FARM).concat(Object.keys(FILES).map(f => '--file ' + f)).join('\n')); process.exit(0); }
const ids = args.filter(a => !a.startsWith('--'));
let results;
const fileMode = args.includes('--file');
if (args.includes('--install')) {   // one at a time: every install rewrites the shared manifest
  results = [];
  for (const id of ids) results.push(await (fileMode ? installFile : install)(id).then(v => ({ status: 'fulfilled', value: v }), reason => ({ status: 'rejected', reason })));
} else {
  results = await Promise.allSettled(ids.map(fileMode ? generateFile : generate));
}
let failed = 0;
for (const r of results) if (r.status === 'rejected') { failed++; console.error('FAILED ' + r.reason.message); }
process.exit(failed ? 1 : 0);
