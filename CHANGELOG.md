# Journal des modifications

## [0.1.0] — Version initiale

### Ajouté
- **Module addon** pour FoundryVTT v13, compatible avec le système `age-system`
  (mode *The Expanse*).
- **Compendiums en français** :
  - Prouesses (Péripéties) — Items `stunts`, classées par catégorie (combat, tir, lutte,
    corps à corps, véhicule, poursuites, exploration, infiltration, social, investigation).
  - Armes — Items `weapon` (capacité, dégâts, portée adaptés au mode Expanse).
  - Armures & boucliers — Items `equipment` avec modificateurs d'armure/pénalité.
  - Talents (Spécialisations) — les 13 spécialisations avec grades Novice/Expert/Maître.
  - Compétences (Focus) — glossaire des compétences par attribut.
  - Macros — « Jet Expanse ».
- **Habillage des dés officiels de The Expanse** via Dice So Nice : 8 apparences
  (Terrien, Martien, Ceinturien, Protogène × sombre/claire) enregistrées comme jeux de
  couleurs + presets de faces personnalisées, sans remplacer le moteur de jet d'age-system.
- Outillage de build des compendiums (`tools/pack-data.mjs` + `tools/build-packs.mjs`)
  et workflow de release GitHub (`.github/workflows/release.yml`).
