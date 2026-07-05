/**
 * The Expanse — Addon (AGE System)
 * Module addon pour FoundryVTT v13 / système age-system (mode The Expanse).
 *
 * Rôle : reproduire les dés officiels de The Expanse (mêmes images de faces et
 * mêmes couleurs par faction que le système officiel Foxfyre/expanse) via Dice So Nice,
 * et les APPLIQUER automatiquement aux jets d'age-system (qui lance de simples d6).
 *
 * Fonctionnement (API Dice So Nice) :
 *  - Les presets de faces sont indexés par (système, type). L'art des faces est porté
 *    par le SYSTÈME, pas par le jeu de couleurs. On enregistre donc UN système DSN par
 *    variante (faction × sombre/clair), chacun avec un unique preset d6.
 *  - age-system lance des d6 réels et lit l'apparence DSN du joueur
 *    (flags["dice-so-nice"].appearance.global.system) pour les afficher. On écrit donc
 *    cette apparence selon la faction choisie dans le réglage du module → les faces
 *    Expanse s'affichent sans que le joueur ait à configurer Dice So Nice.
 */

const MODULE_ID = "expanse-age-fr";
const CATEGORY = "The Expanse (AGE)";

/**
 * 8 variantes = 4 factions × {sombre, clair}. Couleurs officielles (Foxfyre/expanse).
 * bg/edge = couleur de faction ; fg = couleur de contraste des reliefs.
 */
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

/** Enregistre un système DSN + colorset + preset d6 par variante. */
function registerDiceSoNice(dice3d) {
  for (const v of VARIANTS) {
    const label = game.i18n.localize(v.styleKey);

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
  }

  console.log(`${MODULE_ID} | ${VARIANTS.length} apparences de dés The Expanse enregistrées (Dice So Nice).`);
}

/**
 * Écrit l'apparence DSN du joueur pour utiliser la variante donnée (ou la retire).
 * age-system lit flags["dice-so-nice"].appearance.global.system → les faces s'appliquent.
 */
async function applyUserAppearance(variantId, { force = false } = {}) {
  if (!game.user) return;
  const appearance = foundry.utils.deepClone(game.user.getFlag("dice-so-nice", "appearance") ?? {});
  appearance.global = appearance.global ?? {};
  const currentSystem = appearance.global.system ?? "standard";

  if (!variantId || variantId === "none") return; // « Aucune » : on ne touche à rien.

  // Au chargement (force=false) : n'appliquer que si le joueur n'a pas déjà choisi une apparence.
  // Sur changement de réglage (force=true) : appliquer immédiatement.
  const isCustom = currentSystem !== "standard" && currentSystem !== variantId;
  if (!force && isCustom) return;

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
      applyUserAppearance(value, { force: true }).then(() => {
        ui.notifications?.info(
          "The Expanse — Addon : apparence de dés appliquée. Lancez un test pour la voir."
        );
      });
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
    registerDiceSoNice(dice3d);
    const chosen = game.settings.get(MODULE_ID, "defaultDiceStyle");
    if (VARIANT_BY_ID[chosen]) await applyUserAppearance(chosen, { force: true });
  } catch (err) {
    console.error(`${MODULE_ID} | Échec de l'enregistrement Dice So Nice :`, err);
  }
});
