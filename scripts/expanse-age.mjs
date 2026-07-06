/**
 * The Expanse — Addon (AGE System)
 * Module addon pour FoundryVTT v13 / système age-system (mode The Expanse).
 *
 * Rôle : reproduire les dés officiels de The Expanse (mêmes images de faces et
 * mêmes couleurs par faction) via Dice So Nice, et les appliquer automatiquement
 * aux jets d'age-system (qui lance de simples d6).
 *
 * API Dice So Nice : les presets de faces sont indexés par (système, type). L'art des
 * faces est porté par le SYSTÈME. On enregistre donc UN système DSN par variante
 * (faction × sombre/clair), chacun avec un unique preset d6. age-system lit l'apparence
 * DSN du joueur (flags["dice-so-nice"].appearance.global.system) pour afficher ses d6 :
 * on écrit donc cette apparence selon la faction choisie.
 *
 * Robustesse : on ne fixe l'apparence QUE si le système est réellement enregistré, et on
 * répare toute apparence « expanse-* » orpheline (sinon DSN plante au lancer : voir
 * DiceFactory.create → this.systems.get(appearance.system).getCacheString()).
 */

const MODULE_ID = "expanse-age-fr";
const CATEGORY = "The Expanse (AGE)";

const VARIANTS = [
  { id: "expanse-earth-dark",     faction: "earth",    style: "dark",  styleKey: "EXPANSE_AGE.Style.EarthDark",     bg: "#0019FF", fg: "#FFFFFF" },
  { id: "expanse-earth-light",    faction: "earth",    style: "light", styleKey: "EXPANSE_AGE.Style.EarthLight",    bg: "#FFFFFF", fg: "#0019FF" },
  { id: "expanse-mars-dark",      faction: "mars",     style: "dark",  styleKey: "EXPANSE_AGE.Style.MarsDark",      bg: "#000000", fg: "#BC3219" },
  { id: "expanse-mars-light",     faction: "mars",     style: "light", styleKey: "EXPANSE_AGE.Style.MarsLight",     bg: "#BC3219", fg: "#FFFFFF" },
  { id: "expanse-belt-dark",      faction: "belt",     style: "dark",  styleKey: "EXPANSE_AGE.Style.BeltDark",      bg: "#000000", fg: "#FFFFFF" },
  { id: "expanse-belt-light",     faction: "belt",     style: "light", styleKey: "EXPANSE_AGE.Style.BeltLight",     bg: "#FFFFFF", fg: "#000000" },
  { id: "expanse-protogen-dark",  faction: "protogen", style: "dark",  styleKey: "EXPANSE_AGE.Style.ProtogenDark",  bg: "#000000", fg: "#5BCBF5" },
  { id: "expanse-protogen-light", faction: "protogen", style: "light", styleKey: "EXPANSE_AGE.Style.ProtogenLight", bg: "#5BCBF5", fg: "#000000" }
];

const VARIANT_BY_ID = Object.fromEntries(VARIANTS.map((v) => [v.id, v]));

const facePath = (faction, n, style) =>
  `modules/${MODULE_ID}/ui/dice/${faction}/${faction}-${n}-${style}.png`;
const bumpPath = (faction, n) =>
  `modules/${MODULE_ID}/ui/dice/${faction}/${faction}-${n}-bump.png`;

const faceLabels = (faction, style) => [1, 2, 3, 4, 5, 6].map((n) => facePath(faction, n, style));
const bumpMaps = (faction) => [1, 2, 3, 4, 5, 6].map((n) => bumpPath(faction, n));

/** Retourne la Map des systèmes DSN si accessible, sinon null. */
function dsnSystems(dice3d) {
  return dice3d?.DiceFactory?.systems ?? null;
}

/**
 * Enregistre un système DSN + colorset + preset d6 par variante, PUIS précharge les
 * textures de chaque preset. Le préchargement est indispensable : create() lit
 * diceobj.labels sans charger les images lui-même ; sans loadTextures() préalable, les
 * labels restent des chaînes et DSN dessine le chemin en texte. Retourne les ids OK.
 */
async function registerDiceSoNice(dice3d) {
  const registered = [];
  const loadPromises = [];
  for (const v of VARIANTS) {
    const label = game.i18n.localize(v.styleKey);
    try {
      dice3d.addSystem({ id: v.id, name: label, group: CATEGORY }, "default");
      dice3d.addColorset(
        {
          name: v.id,
          description: label,
          category: CATEGORY,
          foreground: v.fg,
          background: v.bg,
          outline: v.bg,
          edge: v.bg,
          texture: "none",
          material: "plastic",
          font: "Arial"
        },
        "default"
      );
      dice3d.addDicePreset(
        {
          type: "d6",
          system: v.id,
          labels: faceLabels(v.faction, v.style),
          bumpMaps: bumpMaps(v.faction),
          colorset: v.id
        },
        "d6"
      );
      registered.push(v.id);

      // Précharge les images des faces (sinon rendu en texte au lancer).
      const preset = dsnSystems(dice3d)?.get(v.id)?.dice?.get("d6");
      if (preset?.loadTextures) {
        loadPromises.push(
          preset.loadTextures().catch((err) =>
            console.warn(`${MODULE_ID} | Préchargement des faces « ${v.id} » échoué :`, err)
          )
        );
      }
    } catch (err) {
      console.error(`${MODULE_ID} | Échec d'enregistrement de la variante « ${v.id} » :`, err);
    }
  }
  await Promise.allSettled(loadPromises);

  const sys = dsnSystems(dice3d);
  const present = sys ? VARIANTS.map((v) => v.id).filter((id) => sys.has(id)) : registered;
  console.log(
    `${MODULE_ID} | ${present.length}/${VARIANTS.length} systèmes de dés The Expanse enregistrés + faces préchargées :`,
    present
  );
  return present;
}

/** Vrai si le système DSN est réellement disponible (sinon l'utiliser ferait planter DSN). */
function isSystemUsable(dice3d, id) {
  const sys = dsnSystems(dice3d);
  if (sys) return sys.has(id);
  return !!VARIANT_BY_ID[id]; // à défaut d'accès, on se fie à nos variantes
}

/**
 * Répare une apparence DSN « expanse-* » qui pointerait vers un système non enregistré
 * (sinon DSN plante au lancer). Retourne true si une réparation a eu lieu.
 */
async function healStaleAppearance(dice3d) {
  const appearance = game.user?.getFlag("dice-so-nice", "appearance");
  const sysId = appearance?.global?.system;
  if (!sysId || !String(sysId).startsWith("expanse-")) return false;
  if (isSystemUsable(dice3d, sysId)) return false;

  const fixed = foundry.utils.deepClone(appearance);
  fixed.global.system = "standard";
  await game.user.setFlag("dice-so-nice", "appearance", fixed);
  console.warn(`${MODULE_ID} | Apparence orpheline « ${sysId} » réinitialisée sur « standard ».`);
  return true;
}

/** Écrit l'apparence DSN du joueur pour utiliser la variante (uniquement si utilisable). */
async function applyUserAppearance(dice3d, variantId) {
  if (!game.user || !variantId || variantId === "none") return;
  if (!isSystemUsable(dice3d, variantId)) {
    ui.notifications?.warn(
      `The Expanse — Addon : le système de dés « ${variantId} » n'est pas disponible dans Dice So Nice.`
    );
    return;
  }
  const appearance = foundry.utils.deepClone(game.user.getFlag("dice-so-nice", "appearance") ?? {});
  appearance.global = appearance.global ?? {};
  appearance.global.system = variantId;
  appearance.global.colorset = variantId;
  await game.user.setFlag("dice-so-nice", "appearance", appearance);
}

Hooks.once("init", () => {
  const choices = { none: "EXPANSE_AGE.Settings.DefaultDiceStyle.None" };
  for (const v of VARIANTS) choices[v.id] = v.styleKey;

  game.settings.register(MODULE_ID, "defaultDiceStyle", {
    name: "EXPANSE_AGE.Settings.DefaultDiceStyle.Name",
    hint: "EXPANSE_AGE.Settings.DefaultDiceStyle.Hint",
    scope: "client",
    config: true,
    type: String,
    default: "expanse-earth-dark",
    choices,
    onChange: (value) => {
      const dice3d = game.dice3d;
      if (value === "none") return;
      if (dice3d) {
        applyUserAppearance(dice3d, value).then(() =>
          ui.notifications?.info("The Expanse — Addon : apparence de dés appliquée. Lancez un test pour la voir.")
        );
      }
    }
  });
});

Hooks.once("ready", () => {
  if (game.system.id !== "age-system") {
    ui.notifications?.warn(
      "The Expanse — Addon : ce module est prévu pour le système « age-system » (mode The Expanse)."
    );
  }
});

Hooks.once("diceSoNiceReady", async (dice3d) => {
  try {
    const present = await registerDiceSoNice(dice3d);
    // Répare d'abord toute apparence orpheline (évite le crash DiceFactory.create).
    await healStaleAppearance(dice3d);
    const chosen = game.settings.get(MODULE_ID, "defaultDiceStyle");
    if (present.includes(chosen)) await applyUserAppearance(dice3d, chosen);
  } catch (err) {
    console.error(`${MODULE_ID} | Échec de l'intégration Dice So Nice :`, err);
  }
});
