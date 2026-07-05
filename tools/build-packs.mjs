/**
 * Compile les données curées (tools/pack-data.mjs) en packs LevelDB lisibles par
 * FoundryVTT v13, dans packs/<name>/.
 *
 * Usage : node tools/build-packs.mjs   (ou npm run build:packs)
 */
import { ClassicLevel } from "classic-level";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PACKS } from "./pack-data.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PACKS_DIR = path.join(ROOT, "packs");
const SYSTEM_ID = "age-system";
const CORE_VERSION = "13";

/** Identifiant déterministe de 16 caractères alphanumériques (stable entre builds). */
function makeId(seed) {
  const h = crypto.createHash("md5").update(seed).digest("base64").replace(/[^a-zA-Z0-9]/g, "");
  return (h + "0000000000000000").slice(0, 16);
}

/** Construit un document minimal (Item ou Macro) attendu dans un pack v13. */
function buildDoc(doc, pack) {
  const collection = pack.type === "Macro" ? "macros" : "items";
  const _id = makeId(`${pack.name}:${doc.name}`);
  const base = {
    _id,
    _key: `!${collection}!${_id}`,
    name: doc.name,
    img: doc.img ?? (pack.type === "Macro" ? "icons/svg/d20.svg" : "icons/svg/item-bag.svg"),
    folder: null,
    sort: doc.sort ?? 0,
    flags: doc.flags ?? {},
    _stats: { systemId: SYSTEM_ID, coreVersion: CORE_VERSION }
  };
  if (pack.type === "Macro") {
    return { ...base, type: "script", scope: "global", command: doc.command ?? "", author: null };
  }
  return { ...base, type: doc.type, system: doc.system ?? {}, effects: doc.effects ?? [] };
}

async function buildPack(pack) {
  const dest = path.join(PACKS_DIR, pack.name);
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });

  const db = new ClassicLevel(dest, { keyEncoding: "utf8", valueEncoding: "json" });
  const batch = db.batch();
  for (const raw of pack.docs) {
    const doc = buildDoc(raw, pack);
    batch.put(doc._key, doc);
  }
  await batch.write();
  await db.close();
  console.log(`  ✓ ${pack.name} : ${pack.docs.length} documents → packs/${pack.name}`);
}

console.log("The Expanse — Addon (AGE) | Compilation des compendiums…");
fs.mkdirSync(PACKS_DIR, { recursive: true });
for (const pack of PACKS) {
  await buildPack(pack);
}
console.log("Terminé.");
