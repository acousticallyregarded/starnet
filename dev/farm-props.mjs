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
  consoleL: 'an L-shaped farmhouse corner desk in oak with an old beige computer showing a dim amber screen',
  rackV: 'a tall narrow oak shelf of stacked ledgers and seed tins',
  bridge_relaystack: 'a tall stack of old wooden filing drawers and ledger boxes tied with twine',
  comms_beacon: 'a farm bell hanging in a sturdy wooden frame with a weathervane on top',
  comms_uplink: 'a tall farm radio mast of wooden poles with a wire antenna and a small weathervane',
  connector_portal: 'a sturdy wooden farm gate set in a rough stone archway',
  core: 'an oak grandfather clock with a brass face and pendulum',
  rack: 'a tall wooden pantry shelf filled with labelled preserve jars',
  safe: 'an old cast-iron farm safe painted green with gold lettering and a brass dial',
  shelf: 'a wooden shelf unit with stoneware crocks, jars and folded linen',
  vault: 'a heavy oak strongbox chest bound with iron bands and a big padlock',
  missionboard: 'a wooden chore board with pinned paper notes, a chalk list and a small brass bell',
  trophycase: 'a glass-fronted oak cabinet of blue ribbons, rosettes and silver county-fair trophies',
  arc_indexwall: 'a wall unit of small oak card-index drawers with brass label holders',
  arc_microfiche: 'a wooden reading table with a brass magnifying lamp over a big open ledger',
  comms_inbox: 'two rural mailboxes side by side on a wooden post, one with its red flag up',
  commswall: 'a long farmhouse kitchen wall board with an old wall telephone, a calendar and pinned notes',
  gigs_amp: 'an old wooden-cased valve radio speaker',
  gigs_thumbwall: 'a corkboard covered in pinned photographs of crops and animals',
  pub_mailpod: 'a low wooden post box chest with a letter slot and a little shingle roof',
  pub_outboundchute: 'a wooden grain chute on legs pouring into a burlap sack',
  pub_publishpress: 'an old cast-iron hand printing press on a wooden bench',
  arc_floorlight: 'an iron oil lantern standing on a small wooden crate',
  arc_ladder: 'a wooden hayloft ladder',
  benchpress: 'a wooden sawhorse holding a log, with an axe leaning against it',
  bookstack: 'a stack of old leather-bound almanacs and seed catalogues',
  booth: 'a farmhouse kitchen booth: a high-backed wooden bench seat with cushions beside a small table',
  bridge_deckperimeter: 'a low white wooden picket fence section',
  cablerun: 'a long coil of rope and a green garden hose laid out flat along the floor',
  camerarig: 'an old wooden box camera on a wooden tripod',
  coffee: 'an enamel coffee pot on a small cast-iron stove',
  crt_pile: 'a pile of old wooden crates holding an old radio, tools and jars',
  cryopod: 'a tall old wooden ice box with brass hinges and latches and SOLID wooden doors, no glass window, nothing and nobody inside or visible',
  desklamp: 'a brass oil lamp with a glass chimney standing beside a low stack of books',
  deskterminal: 'a small wooden writing table with an old black typewriter',
  dinerchair: 'a red-painted wooden kitchen chair',
  dinertable: 'a farmhouse kitchen table with a red gingham tablecloth',
  figurine: 'a small carved and painted wooden rooster',
  gachapon: 'a gumball machine with a red cast-iron base, full of colourful gumballs',
  glasstable: 'a low wooden coffee table with a white lace runner',
  guitar: 'an acoustic guitar leaning on a wooden stand',
  hazardpad: 'a coir doormat saying WELCOME',
  holopet: 'a farm cat sitting on top of a tall wooden scratching post',
  incubator: 'a tall narrow wooden egg incubator cabinet with glass-fronted shelves of brown eggs',
  industrial_cabletray: 'a long, narrow wooden seed tray of sprouting seedlings lying on the floor',
  industrial_floorvent: 'a cast-iron floor grate',
  industrial_partition: 'a wooden lattice garden screen with climbing pink roses',
  industrial_planter: 'a long wooden planter box of green herbs',
  industrial_roundtable: 'a round oak pedestal table',
  industrial_servicecab: 'a tall painted wooden broom cupboard',
  industrial_supplycart: 'a wooden wheelbarrow loaded with burlap sacks',
  industrial_toolcaddy: 'a wooden garden tool tote with trowels and gloves',
  industrial_wallpanel: 'a wooden wall rack of hanging garden tools',
  lavalamp: 'a glass jar of glowing fireflies with a cloth lid',
  longtable: 'a long harvest table of rough oak planks',
  loungetable: 'a low wooden coffee table with a bowl of red apples',
  lowtable: 'a low rustic wooden bench table',
  modelship: 'a model red tractor pulling a little hay wagon, on a long low wooden stand',
  monstera: 'a big leafy fern in a terracotta pot',
  mug: 'an enamel tin mug of coffee',
  plasmaglobe: 'a kerosene hurricane lantern',
  podchair: 'a wicker rocking chair with a gingham cushion',
  punchbag: 'a burlap sack of hay hanging on a rope from a wooden beam frame',
  radio: 'an old wooden tabletop radio',
  rug: 'an oval braided rag rug in faded cream, sage green and barn red',
  rug_large: 'a large oval braided rag rug in faded cream, sage green and barn red',
  rug_small: 'a small oval braided rag rug in faded cream, sage green and barn red',
  sidetable: 'a small oak side table with a jug of wildflowers',
  steamvent: 'a low, wide cast-iron cooking range with a short chimney pipe and a wisp of steam',
  stool: 'a three-legged wooden milking stool',
  tallplant: 'tall sunflowers growing in a big terracotta pot',
  telescope: 'a brass telescope on a wooden tripod',
  terrarium: 'a glass bell jar cloche over a young seedling in a pot',
  toolbox: 'a wooden carpenter\'s toolbox with a handle and tools inside',
  treasury_pnl_holo: 'a wide market chalkboard on a low wooden frame listing crop prices',
  weaponrack: 'a wooden rack holding pitchforks, rakes and hoes',
  airlock: 'a farmhouse Dutch door, split into a top and bottom half, in a wooden frame',
  easel: 'a painter\'s easel holding a canvas of a sunflower field',
  etsy_dyevat: 'a big copper dye pot on an iron stand with skeins of coloured wool',
  etsy_kiln: 'a small brick pottery kiln with an iron door',
  etsy_packbot: 'a wooden packing bench with a stack of produce crates and a roll of twine',
  etsy_threadrack: 'a wooden spinning wheel beside a rack of wool skeins',
  fabricator: 'a cast-iron and oak cider press with a basket of apples',
  research_corelens: 'a brass microscope on a small wooden table',
  research_papers: 'a pile of seed packets and notebooks on a small wooden table',
  research_samplecart: 'a wooden cart of glass soil sample jars',
  research_trendpillar: 'a farm weather station on a wooden post: rain gauge, wind cups and thermometer',
  tube: 'three glass demijohns of golden cider in a long wicker tray',
  vat: 'a large wooden fermenting barrel lying on its side in a cradle, bound with iron hoops',
  arcade: 'an old wooden penny-arcade fortune-teller cabinet',
  arcade2: 'a wooden fairground ring-toss stall with striped awning',
  bar: 'a wooden farmhouse kitchen counter with jars, a bread board and a loaf',
  beanbag: 'a hay bale with a folded plaid blanket on top',
  bookshelf: 'a tall oak bookshelf of almanacs and cookbooks',
  bunk: 'a wooden farmhouse bed with a patchwork quilt',
  couch: 'a plaid upholstered farmhouse sofa with cushions',
  djbooth: 'a fiddle and a banjo on a little wooden stage with a hay bale',
  fishtank: 'a stone water trough with goldfish and lily pads',
  industrial_bench: 'a long rustic wooden bench',
  jukebox: 'an old wind-up gramophone with a brass horn on a wooden cabinet',
  pinball: 'a wooden bagatelle game table with brass pins',
  pokertable: 'a round wooden card table with a checkered cloth and playing cards',
  quarters_lockerbank: 'a row of wooden mudroom cubbies with hooks, coats and boots',
  quarters_minifridge: 'a small upright wooden ice cabinet with brass handles',
  quarters_pooltable: 'a long wooden shuffleboard table',
  quarters_vending: 'an honesty farm stand with jars of honey and eggs and a cash tin',
  recliner: 'a padded wingback armchair in plaid',
  speaker: 'an old wooden radio speaker cabinet',
  tv: 'an old wooden-cabinet television set',
  bigscreen: 'a very long chalkboard on a wooden frame with a hand-drawn map of the fields',
  bridge_consolebank: 'a long oak sideboard with old radios and an open ledger',
  bridge_dispatch_pylon: 'a wooden signpost with arrow boards pointing different ways',
  bridge_orderqueue: 'a wooden order board with clipped paper tickets',
  bridge_tacscreen: 'a framed hand-drawn map of the farm on a wooden easel',
  bridge_tacticaltable: 'a large wooden table with a hand-drawn farm map and little wooden markers',
  calwall: 'a long wall board with a calendar of the seasons, planting dates and a picture of a barn',
  chartwall: 'a chalkboard with crop yield charts drawn in chalk',
  holotable: 'a wooden sand table modelling the farm fields in miniature',
  screens: 'a wall of framed farm pictures around a small chalkboard',
  tank: 'two galvanised water tanks side by side on a wooden stand',
  ticker: 'a long chalkboard of market prices',
  war_pivotpanel: 'a wooden noticeboard on a swivel stand',
  war_threatcore: 'a weather barometer and storm glass in a wooden case',
  wartable: 'a long planning table with a map of the fields and seed packets',
  whiteboard: 'a wide chalkboard on a low wooden frame',
  boxes: 'a stack of wooden produce crates of red apples',
  bridge_equipmentbay: 'a wooden shelving bay of feed sacks and tools',
  crate: 'a wooden crate of potatoes',
  gigs_partsbin: 'a wooden bin of onions and seed potatoes',
  goldcrate: 'a wooden crate of golden corn cobs',
  industrial_drawerbank: 'a long low chest of oak drawers',
  industrial_locker: 'a tall painted wooden wardrobe',
  treasury_coinsorter: 'an old brass cash register on a wooden counter',
  treasury_token_furnace: 'a tall narrow cast-iron pot-bellied stove with a long chimney pipe',
  bay: 'a farm work stall: a sturdy potting bench with a stool under a small shingle roof',
  filter: 'a wooden sorting table with a sieve and two woven baskets',
  intake: 'a wooden feed hopper on legs',
  joiner: 'a wooden grain chute where two chutes join into one',
  loop: 'a wooden water wheel on a small frame',
  merger: 'a wide wooden funnel hopper gathering into one sack',
  outbox: 'a farm-gate produce stand with a little roof and crates of vegetables',
  splitter: 'a wooden grain chute splitting into two spouts',
  bench: 'a farmhouse potting bench with an old beige computer showing a dim amber screen',
  console: 'an oak radio desk with an old beige computer showing a dim amber screen',
  desk2: 'a wide double farmhouse writing desk in oak with two old beige computers showing dim amber screens',
  pixelrig: 'an oak roll-top desk with an old beige computer showing a dim amber screen',
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
   under the same light reads hot orange, so these files are installed a touch darker and less saturated */
const TONE = { 'workstation.png': 0.92, 'workstation-compact.png': 0.92, 'remaster/workstation-n.png': 0.92,
  'remaster/workstation-compact-n.png': 0.92, 'remaster/workstation-e.png': 0.92 };
/* SURFACES: the floor, wall and wall-top textures every room is painted with. Redrawn from the station texture (so the
   layout carries over: a wainscot keeps its panel-over-boards split), made seamless, installed at the original size.
   They are SUNNY farm surfaces — light, warm, daylit — because the room tint keeps a texture's own brightness. */
const SURFACE = 'Redraw this tiling game texture as {WHAT}. Seen straight from above, flat and evenly lit by bright summer daylight, ' +
  'light and warm in tone, chunky pixel art with clear dark outlines between pieces, the same layout and scale as the reference. ' +
  'No metal plates, no bolts or rivets, no sci-fi parts. Fill the whole square edge to edge; no border, no shadow, no vignette.';
const TEXTURES = {
  'remaster/floors/plank.png': 'a floor of long honey-coloured oak floorboards in staggered rows, with visible wood grain and small dark nail heads',
  'remaster/floors/parquet.png': 'a light oak herringbone parquet floor',
  'remaster/floors/turf.png': 'short bright green summer grass with a few clover leaves and small daisies, growing over soft soil',
  'remaster/floors/soft-v2.png': 'a woven rag rug floor covering in faded cream, sage and barn-red stripes',
  'remaster/floors/basalt-v2.png': 'a floor of pale sandstone flagstones with mortar joints',
  'remaster/walls/wainscot.png': 'a farmhouse interior wall: whitewashed plaster above, a band of honey oak wainscot boards below with a moulded rail between them',
  'remaster/crown.png': 'the top edge of a wall: a long honey oak beam with a moulded edge, seen from above',
};
// the plank came back cartoon-yellow; under the room's oak tint a little less saturation reads as real honey oak
const TEX_SATURATION = { 'remaster/floors/plank.png': 0.72 };
const fileOut = f => 'file-' + f.replace(/[\/]/g, '__');

const STYLE = 'Redraw this game prop as {WHAT}. Keep exactly the art style of the reference image: chunky pixel art with thick dark outlines, ' +
  'the same three-quarter front view, the same proportions, size and footprint, lit from the top-left, standing on its base at the bottom ' +
  'of the frame. Warm farm materials (weathered wood, wrought iron, brass, linen, stone). No sci-fi parts, no glowing blue. ' +
  'Only the object, centered, on a fully transparent background, with no floor, shadow plate, text or border.';

function sizeFor(w, h) {
  const r = w / h;
  return r > 1.25 ? '1536x1024' : r < 0.8 ? '1024x1536' : '1024x1024';
}

// a prop drawn as a left/right pair: the right-hand one is the left one flipped, so the two always match
const PAIRS = { benchpress_r: 'benchpress', camerarig_r: 'camerarig', punchbag_r: 'punchbag', recliner_r: 'recliner', telescope_r: 'telescope', weaponrack_r: 'weaponrack' };

// every facing a prop is drawn in (s = its front, n = from behind, e/w = from the side), each redrawn from its own art
const FACING = { s: 'seen from the front, as in the reference', n: 'seen from behind, as in the reference (its back faces the viewer)',
  e: 'turned sideways and seen END-ON from its short side, exactly like the reference: keep the reference\'s narrow, tall silhouette and aspect ratio, nothing wider',
  w: 'turned sideways and seen END-ON from its short side, exactly like the reference: keep the reference\'s narrow, tall silhouette and aspect ratio, nothing wider' };
// a prop's east view is its west view mirrored (the station sheet drew them as mirror pairs): generate w, flip for e
const MIRROR = { e: 'w' };
const outName = (id, key) => id + (key === 's' ? '' : '-' + key) + '.png';

async function generate(id) {
  if (PAIRS[id]) {
    const from = path.join(REVIEW, outName(PAIRS[id], 's'));
    if (!fs.existsSync(from)) await generate(PAIRS[id]);
    await require('sharp')(from).flop().toFile(path.join(REVIEW, outName(id, 's')));
    console.log(id + '.s = ' + PAIRS[id] + '.s mirrored');
    return;
  }
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
  /* SHAPE: the sprite is fitted inside the station sprite's box, so a different outline draws small. Say the ratio. */
  const cut = await require('sharp')(src).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
  const ratio = cut.info.width / cut.info.height;
  what += '. Its outline must fill the same shape as the reference: about ' + (ratio >= 1 ? ratio.toFixed(1) + ' times as wide as it is tall' : (1 / ratio).toFixed(1) + ' times as tall as it is wide');
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
  // the effects build reads this: a redrawn prop's station effect regions no longer fit its picture
  const listFile = path.join(SET, 'farm-redrawn.json');
  const list = fs.existsSync(listFile) ? JSON.parse(fs.readFileSync(listFile, 'utf8')) : [];
  if (!list.includes(id)) { list.push(id); list.sort(); fs.writeFileSync(listFile, JSON.stringify(list, null, 2) + '\n'); }
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

async function generateTexture(f) {
  if (!TEXTURES[f]) throw new Error(f + ': no surface brief yet (add one to TEXTURES)');
  if (!KEY) throw new Error('no ChatGPT_API_KEY / OPENAI_API_KEY in the environment');
  const meta = await require('sharp')(path.join(ART, f)).metadata();
  const form = new FormData();
  form.append('model', MODEL);
  form.append('image[]', new Blob([fs.readFileSync(path.join(ART, f))], { type: 'image/png' }), path.basename(f));
  form.append('prompt', SURFACE.replace('{WHAT}', TEXTURES[f]));
  form.append('size', sizeFor(meta.width, meta.height));
  form.append('quality', 'high');
  form.append('output_format', 'png');
  const res = await fetch('https://api.openai.com/v1/images/edits', { method: 'POST', headers: { Authorization: 'Bearer ' + KEY }, body: form });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(f + ': ' + res.status + ' ' + ((body.error && body.error.message) || 'image request failed'));
  fs.mkdirSync(REVIEW, { recursive: true });
  fs.writeFileSync(path.join(REVIEW, fileOut(f)), Buffer.from(body.data[0].b64_json, 'base64'));
  console.log(f + ' -> dev/farm-art/' + fileOut(f));
}

/* SEAMLESS: blend in a copy rolled by half its size wherever the original is near an edge. The rolled copy is continuous
   across the edges (they were its middle), the original carries the middle, so the tile wraps without a visible seam. */
async function installTexture(f) {
  const sharp = require('sharp');
  const meta = await sharp(path.join(ART, f)).metadata();
  const W = meta.width, H = meta.height;
  const a = await sharp(path.join(REVIEW, fileOut(f))).resize(W, H).removeAlpha().raw().toBuffer();
  const out = Buffer.alloc(W * H * 3), band = Math.round(Math.min(W, H) * 0.18);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = Math.min(x, W - 1 - x, y, H - 1 - y), t = Math.min(1, d / band), wa = t * t * (3 - 2 * t);
    const i = (y * W + x) * 3, j = (((y + H / 2) % H) * W + ((x + W / 2) % W)) * 3;
    for (let c = 0; c < 3; c++) out[i + c] = Math.round(a[i + c] * wa + a[j + c] * (1 - wa));
  }
  let img = sharp(out, { raw: { width: W, height: H, channels: 3 } });
  if (TEX_SATURATION[f]) img = img.modulate({ saturation: TEX_SATURATION[f] });
  await img.png().toFile(path.join(ART, f));
  console.log(f + ' installed (seamless) at ' + W + 'x' + H);
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
const fileMode = args.includes('--file'), texMode = args.includes('--texture');
if (args.includes('--install')) {   // one at a time: every install rewrites the shared manifest
  results = [];
  const run = texMode ? installTexture : fileMode ? installFile : install;
  for (const id of ids) results.push(await run(id).then(v => ({ status: 'fulfilled', value: v }), reason => ({ status: 'rejected', reason })));
} else {
  const gen = texMode ? generateTexture : fileMode ? generateFile : generate, LIMIT = Number(process.env.FARM_CONCURRENCY) || 4;
  const queue = ids.filter(id => !(PAIRS[id] && ids.includes(PAIRS[id])));   // a pair's base generates its mirror after
  const pairsAfter = ids.filter(id => PAIRS[id] && ids.includes(PAIRS[id]));
  results = [];
  await Promise.all(Array.from({ length: Math.min(LIMIT, queue.length) }, async () => {
    while (queue.length) { const id = queue.shift(); results.push(await gen(id).then(v => ({ status: 'fulfilled', value: v }), reason => ({ status: 'rejected', reason: Object.assign(reason, { message: reason.message }) }))); }
  }));
  for (const id of pairsAfter) results.push(await gen(id).then(v => ({ status: 'fulfilled', value: v }), reason => ({ status: 'rejected', reason })));
}
let failed = 0;
for (const r of results) if (r.status === 'rejected') { failed++; console.error('FAILED ' + r.reason.message); }
process.exit(failed ? 1 : 0);
