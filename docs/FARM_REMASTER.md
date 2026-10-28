# Homestead — the farm remaster

Homestead is a fork of [StarNet](https://github.com/androoAGI/starnet) (MIT) that keeps the whole agent
harness and moves the world from a space station to a farm. The contract does not change: **a building is a
capability-scoped team, a path is an authorized handoff lane, and a placed object is a real capability
grant.** Only what the player sees changes.

## What stays fixed

- Internal ids: room kinds (`hab`, `bridge`, `lab`, `factory`, `quarters`, `storage`, `corridor`), prop types,
  save schema (`starnet.station`), `skynet.*` keys, events in `shared/`, tool names such as `station.map`.
- The hosted StarNet services (subscription, account, credits, Remote, cloud link) belong to the original
  author and keep their name wherever the UI refers to them.

## Done

| Layer | Where | What |
| --- | --- | --- |
| Ground | `frontend/app/terrain.js` (`FARM`) | Default backdrop. Staggered fields of wheat, barley, corn, cabbages, pumpkins, sprouts, plowed soil, orchards and pastures (sheep, cattle); hedgerows with oaks, post-and-rail fences, cart tracks; a grass home paddock round the farm with hay, a trough and hens. Procedural, no art files. |
| Buildings | `frontend/app/worldmodel.js` `ROOM_KINDS` | hab → BARN (oak plank, barn-red clapboard) · bridge → FARMHOUSE (walnut parquet, white clapboard) · lab → GREENHOUSE (turf, glass) · factory → WORKSHOP (stone flags, brick) · quarters → COTTAGE (matting, stone) · storage → GRANARY (plank, log timber) · corridor → PATH (plank, shingle roof). Old names still resolve (`was`). |
| Starter | `WorldModel.starterDoc()` | The HOME room is a white clapboard farmhouse with an oak plank floor. |
| Daylight | `frontend/app/stationbake.js` | The exterior shell is exposed for daylight, not vacuum. |
| Wording | everywhere a player reads it | StarNet → Homestead, station → farm, Commander → Farmer, hallway/corridor → path. Size tiers: HOMESTEAD → FARM → RANCH → ESTATE. |
| Wordmark | `dev/homestead-logo.mjs` | `homestead-wordmark.svg` (chrome mask) and `homestead-logo.png` (title screen). |

## Still to do: the art

Props, agent bodies and the exterior shell textures are PNG art made with PixelLab (see `docs/DECISIONS.md`).
They need a PixelLab API key in the environment (`PIXELLAB_API_KEY`). The prop ids stay; only the sprites
change, so every grant keeps working.

### Capability props first (these are the ones a player places on purpose)

| Prop id | Grants | Station art | Farm art |
| --- | --- | --- | --- |
| `desk`, `desk2`, `console`, `pixelrig`, `bench` | COMPUTE | desks, consoles | farmhouse writing desk, rolltop desk, kitchen table |
| `workbench` | TERMINAL | workbench | carpenter's bench with tools |
| `war_intelcab`, `safe`, `vault`, `rack`, `shelf` | FILES | cabinets, safe | filing chest, pantry shelves, seed cabinet |
| `comms_dish`, `comms_uplink`, `comms_beacon` | WEB | satellite dish, antennas | windmill, weathervane, bell post |
| `gigs_servercart`, `bridge_relaystack`, `core` | MEMORY | server cart, databank | almanac stand, ledger shelf, root cellar door |
| `connector_portal` | LIVE TOOLS | portal | barn door / gate |
| `plugin_terminal` | PLUGIN TOOLS | terminal | tool rack |
| `studio` | IMAGES | media studio | easel and paints |
| `jukebox` | SPOTIFY | jukebox | gramophone |

### Workflow (conveyor) machines

| Prop id | Station art | Farm art |
| --- | --- | --- |
| `intake` (INBOX) | intake hopper | feed hopper / mailbox |
| `bay` | agent bay | work stall |
| `filter` | filter | sorting table |
| `splitter`, `merger`, `joiner` | junctions | grain chutes |
| `loop` | loop gate | water wheel |
| `outbox` | outbox | produce crate / farm-gate stall |

Belts become wooden chutes or a cart rail.

### Agents

The default body (`voidwizard`) and the class bodies become farmhands: straw hat, overalls, apron, boots.
Same 8 directions and the same clips (`idle`, `walk`, `sit`, `gesture`).

### Every prop in the catalog (158)

- **capability** (13): `connector_portal` CONNECTOR, `comms_dish` DISH, `comms_uplink` UPLINK, `comms_beacon` BEACON, `war_intelcab` INTEL CAB, `safe` SAFE, `vault` VAULT, `rack` RACK, `shelf` SHELF, `core` CORE, `gigs_servercart` SERVER CART, `bridge_relaystack` RELAY STACK, `studio` STUDIO
- **command** (2): `missionboard` MISSION BOARD, `trophycase` TROPHY CASE
- **comms** (9): `commswall` COMMS WALL, `comms_inbox` MAIL TRAY, `gigs_thumbwall` THUMB WALL, `gigs_amp` AMP, `pub_publishpress` PUBLISH PRESS, `pub_outboundchute` OUTBOUND CHUTE, `pub_mailpod` MAIL POD, `arc_indexwall` INDEX WALL, `arc_microfiche` MICROFICHE
- **decor** (61): `industrial_supplycart` SUPPLY TROLLEY, `industrial_toolcaddy` TOOL CADDY, `industrial_planter` PLANTER TROUGH, `industrial_partition` MODULAR PARTITION, `industrial_roundtable` PEDESTAL TABLE, `industrial_servicecab` SERVICE CABINET, `industrial_wallpanel` SERVICE PANEL, `industrial_floorvent` FLUSH GRILLE, `industrial_cabletray` CABLE CHANNEL, `bridge_deckperimeter` DECK PERIMETER, `coffee` COFFEE, `plant` PLANT, `rug` RUG, `rug_small` SMALL RUG, `rug_large` LARGE RUG, `treasury_pnl_holo` PNL HOLO, `arc_floorlight` FLOOR LIGHT, `arc_ladder` LADDER, `stool` STOOL, `chair` CHAIR, `sidetable` SIDE TABLE, `lowtable` LOW TABLE, `glasstable` GLASS TABLE, `dinertable` DINER TABLE, `guitar` GUITAR, `booth` BOOTH, `dinerchair` DINER CHAIR, `podchair` POD CHAIR, `loungetable` LOUNGE TABLE, `longtable` LONG TABLE, `lavalamp` LAVA LAMP, `crt_pile` CRT PILE, `cablerun` CABLE RUN, `hazardpad` HAZARD PAD, `tallplant` TALL PLANT, `terrarium` TERRARIUM, `holopet` HOLO PET, `plasmaglobe` PLASMA GLOBE, `gachapon` GACHAPON, `monstera` MONSTERA, `mug` MUG, `bookstack` BOOKS, `desklamp` DESK LAMP, `radio` RADIO, `toolbox` TOOLBOX, `figurine` FIGURINE, `deskterminal` TERMINAL, `modelship` MODEL SHIP, `steamvent` STEAM VENT, `cryopod` CRYO POD, `incubator` INCUBATOR, `telescope` TELESCOPE ›, `telescope_r` TELESCOPE ‹, `camerarig` CAMERA RIG ‹, `camerarig_r` CAMERA RIG ›, `weaponrack` WEAPON RACK ‹, `weaponrack_r` WEAPON RACK ›, `punchbag` HEAVY BAG ‹, `punchbag_r` HEAVY BAG ›, `benchpress` BENCH PRESS ‹, `benchpress_r` BENCH PRESS ›
- **isolation** (1): `airlock` AIRLOCK
- **lab** (12): `fabricator` FABRICATOR, `vat` VAT, `easel` EASEL, `tube` TUBE, `research_corelens` CORE LENS, `research_trendpillar` TREND PILLAR, `research_samplecart` SAMPLE CART, `research_papers` PAPERS, `etsy_threadrack` THREAD RACK, `etsy_dyevat` DYE VAT, `etsy_kiln` KILN, `etsy_packbot` PACK BOT
- **lounge** (21): `industrial_bench` CREW BENCH, `djbooth` DJ BOOTH, `speaker` SPEAKER, `bar` BAR, `tv` TV, `couch` COUCH, `arcade` ARCADE, `arcade2` ARCADE II, `jukebox` JUKEBOX, `bunk` BED, `quarters_pooltable` POOL TABLE, `quarters_vending` VENDING, `quarters_lockerbank` LOCKERS, `quarters_minifridge` MINIFRIDGE, `fishtank` FISH TANK, `pokertable` POKER TABLE, `bookshelf` BOOKSHELF, `beanbag` BEANBAG, `pinball` PINBALL, `recliner` RECLINER ‹ LEFT, `recliner_r` RECLINER RIGHT ›
- **screens** (16): `bridge_consolebank` BRIDGE CONSOLE BANK, `bridge_tacticaltable` TACTICAL TABLE, `bigscreen` BIG SCREEN, `holotable` HOLOTABLE, `screens` SCREENS, `tank` TANK, `whiteboard` WHITEBOARD, `ticker` TICKER, `chartwall` CHART WALL, `wartable` WAR TABLE, `calwall` CAL WALL, `bridge_tacscreen` TAC SCREEN, `bridge_dispatch_pylon` DISPATCH PYLON, `bridge_orderqueue` ORDER QUEUE, `war_pivotpanel` PIVOT PANEL, `war_threatcore` THREAT CORE
- **storage** (9): `industrial_locker` MODULAR LOCKER, `industrial_drawerbank` DRAWER BANK, `bridge_equipmentbay` EQUIPMENT BAY, `crate` CRATE, `boxes` BOXES, `goldcrate` GOLD CRATE, `gigs_partsbin` PARTS BIN, `treasury_coinsorter` COIN SORTER, `treasury_token_furnace` TOKEN FURNACE
- **workflow** (8): `intake` INBOX, `bay` BAY, `filter` FILTER, `merger` MERGER, `splitter` SPLITTER, `joiner` JOINER, `loop` LOOP, `outbox` OUTBOX
- **workstation** (6): `desk` DESK, `desk2` DESK ×2, `console` CONSOLE, `pixelrig` PIXEL RIG, `bench` BENCH, `workbench` WORKBENCH
