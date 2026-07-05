/**
 * The Expanse — Addon (AGE System)
 * Module addon pour FoundryVTT v13 / système age-system (mode The Expanse).
 *
 * Rôle du script : intégrer l'APPARENCE des dés officiels de The Expanse via
 * Dice So Nice (habillage cosmétique). Le moteur de jet d'age-system n'est pas modifié.
 */

const MODULE_ID = "expanse-age-fr";

/**
 * Les 8 apparences officielles = 4 factions × {sombre, clair}.
 * edge/background repris du système officiel (Foxfyre/expanse).
 * Les faces sont des images (labels) + cartes de relief (bumpMaps).
 */
const FACTIONS = [
  { key: "earth",    labelKey: "EXPANSE_AGE.Faction.Earth",    dark: "#0019FF", light: "#FFFFFF" },
  { key: "mars",     labelKey: "EXPANSE_AGE.Faction.Mars",     dark: "#000000", light: "#BC3219" },
  { key: "belt",     labelKey: "EXPANSE_AGE.Faction.Belt",     dark: "#000000", light: "#FFFFFF" },
  { key: "protogen", labelKey: "EXPANSE_AGE.Faction.Protogen", dark: "#000000", light: "#5BCBF5" }
];

const VARIANTS = [
  { style: "dark",  suffixKey: "EXPANSE_AGE.Variant.Dark" },
  { style: "light", suffixKey: "EXPANSE_AGE.Variant.Light" }
];

const facePath = (faction, n, style) =>
  `modules/${MODULE_ID}/ui/dice/${faction}/${faction}-${n}-${style}.png`;
const bumpPath = (faction, n) =>
  `modules/${MODULE_ID}/ui/dice/${faction}/${faction}-${n}-bump.png`;

const faceLabels = (faction, style) =>
  [1, 2, 3, 4, 5, 6].map((n) => facePath(faction, n, style));
const bumpMaps = (faction) =>
  [1, 2, 3, 4, 5, 6].map((n) => bumpPath(faction, n));

/** Enregistre les jeux de couleurs et presets Expanse auprès de Dice So Nice. */
function registerDiceSoNice(dice3d) {
  dice3d.addSystem({ id: "expanse-age", name: "The Expanse (AGE)" }, "default");

  for (const faction of FACTIONS) {
    const factionLabel = game.i18n.localize(faction.labelKey);
    for (const variant of VARIANTS) {
      const name = `expanse-${faction.key}-${variant.style}`;
      const description = `${factionLabel} — ${game.i18n.localize(variant.suffixKey)}`;
      dice3d.addColorset(
        {
          name,
          category: "The Expanse (AGE)",
          description,
          edge: faction[variant.style],
          background: faction[variant.style],
          material: "plastic"
        },
        "default"
      );
      dice3d.addDicePreset(
        {
          type: "d6",
          labels: faceLabels(faction.key, variant.style),
          bumpMaps: bumpMaps(faction.key),
          colorset: name,
          system: "expanse-age"
        },
        "d6"
      );
    }
  }

  const preferred = game.settings.get(MODULE_ID, "defaultDiceStyle");
  if (preferred && preferred !== "none") {
    // On ne force pas le réglage du joueur : simple valeur par défaut si aucune n'est choisie.
    const current = game.user.getFlag("dice-so-nice", "settings");
    if (!current?.colorset || current.colorset === "custom") {
      game.user.setFlag("dice-so-nice", "settings", { ...(current ?? {}), colorset: preferred });
    }
  }

  console.log(`${MODULE_ID} | Apparences de dés The Expanse enregistrées (Dice So Nice).`);
}

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "defaultDiceStyle", {
    name: "EXPANSE_AGE.Settings.DefaultDiceStyle.Name",
    hint: "EXPANSE_AGE.Settings.DefaultDiceStyle.Hint",
    scope: "client",
    config: true,
    type: String,
    default: "none",
    choices: {
      none: "EXPANSE_AGE.Settings.DefaultDiceStyle.None",
      "expanse-earth-dark": "EXPANSE_AGE.Faction.Earth",
      "expanse-mars-light": "EXPANSE_AGE.Faction.Mars",
      "expanse-belt-dark": "EXPANSE_AGE.Faction.Belt",
      "expanse-protogen-light": "EXPANSE_AGE.Faction.Protogen"
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

Hooks.once("diceSoNiceReady", (dice3d) => {
  try {
    registerDiceSoNice(dice3d);
  } catch (err) {
    console.error(`${MODULE_ID} | Échec de l'enregistrement Dice So Nice :`, err);
  }
});
