/**
 * The Expanse — Addon (AGE System)
 * Module addon pour FoundryVTT v13 / système age-system (mode The Expanse).
 *
 * Rôle du script : intégrer l'APPARENCE des dés officiels de The Expanse via
 * Dice So Nice (habillage cosmétique). Le moteur de jet d'age-system n'est pas modifié.
 *
 * IMPORTANT (API Dice So Nice) : les presets de dés sont indexés par (système, type).
 * L'art des faces (images) est porté par le SYSTÈME, pas par le jeu de couleurs.
 * On enregistre donc UN système DSN par variante (faction × sombre/clair), chacun
 * avec un unique preset d6. Le joueur sélectionne ensuite le système voulu dans
 * « Configurer les dés » de Dice So Nice (ou on le définit par défaut via le réglage).
 */

const MODULE_ID = "expanse-age-fr";

/**
 * 8 variantes = 4 factions × {sombre, clair}.
 * id        : identifiant du système DSN + du colorset.
 * faces     : sous-dossier/suffixe des images (ui/dice/<faction>/<faction>-N-<style>.png).
 * styleKey  : clé i18n du libellé affiché.
 * bg/edge   : couleurs officielles (Foxfyre/expanse). fg = couleur de contraste.
 */
const VARIANTS = [
  { id: "expanse-earth-dark",    faction: "earth",    style: "dark",  styleKey: "EXPANSE_AGE.Style.EarthDark",    bg: "#0019FF", fg: "#FFFFFF" },
  { id: "expanse-earth-light",   faction: "earth",    style: "light", styleKey: "EXPANSE_AGE.Style.EarthLight",   bg: "#FFFFFF", fg: "#0019FF" },
  { id: "expanse-mars-dark",     faction: "mars",     style: "dark",  styleKey: "EXPANSE_AGE.Style.MarsDark",     bg: "#000000", fg: "#BC3219" },
  { id: "expanse-mars-light",    faction: "mars",     style: "light", styleKey: "EXPANSE_AGE.Style.MarsLight",    bg: "#BC3219", fg: "#FFFFFF" },
  { id: "expanse-belt-dark",     faction: "belt",     style: "dark",  styleKey: "EXPANSE_AGE.Style.BeltDark",     bg: "#000000", fg: "#FFFFFF" },
  { id: "expanse-belt-light",    faction: "belt",     style: "light", styleKey: "EXPANSE_AGE.Style.BeltLight",    bg: "#FFFFFF", fg: "#000000" },
  { id: "expanse-protogen-dark", faction: "protogen", style: "dark",  styleKey: "EXPANSE_AGE.Style.ProtogenDark", bg: "#000000", fg: "#5BCBF5" },
  { id: "expanse-protogen-light",faction: "protogen", style: "light", styleKey: "EXPANSE_AGE.Style.ProtogenLight",bg: "#5BCBF5", fg: "#000000" }
];

const CATEGORY = "The Expanse (AGE)";

const facePath = (faction, n, style) =>
  `modules/${MODULE_ID}/ui/dice/${faction}/${faction}-${n}-${style}.png`;
const bumpPath = (faction, n) =>
  `modules/${MODULE_ID}/ui/dice/${faction}/${faction}-${n}-bump.png`;

const faceLabels = (faction, style) => [1, 2, 3, 4, 5, 6].map((n) => facePath(faction, n, style));
const bumpMaps = (faction) => [1, 2, 3, 4, 5, 6].map((n) => bumpPath(faction, n));

/** Enregistre un système DSN + colorset + preset d6 par variante. */
function registerDiceSoNice(dice3d) {
  const preferred = game.settings.get(MODULE_ID, "defaultDiceStyle");

  for (const v of VARIANTS) {
    const label = game.i18n.localize(v.styleKey);
    const mode = v.id === preferred ? "preferred" : "default";

    // 1) Le SYSTÈME porte l'art des faces : c'est ce que le joueur sélectionne.
    dice3d.addSystem({ id: v.id, name: label, group: CATEGORY }, mode);

    // 2) Colorset assorti (couleurs/matériau ; ne remplace pas les faces).
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

    // 3) UN preset d6 dans CE système (images de faces + relief).
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

  console.log(
    `${MODULE_ID} | ${VARIANTS.length} apparences de dés The Expanse enregistrées (Dice So Nice).`
  );
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
    default: "none",
    choices,
    onChange: () => {
      // Le système « preferred » de DSN est fixé au chargement ; on invite à recharger.
      ui.notifications?.info(
        "The Expanse — Addon : rechargez la page (F5) pour appliquer l'apparence de dés par défaut."
      );
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
