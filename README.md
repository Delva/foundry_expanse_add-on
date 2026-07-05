# The Expanse — Addon (AGE System)

Module **addon** pour **FoundryVTT v13** destiné à jouer à **The Expanse** (JDR AGE,
© Green Ronin Publishing) avec le système non officiel **AGE System**
([`age-system`](https://github.com/vkdolea/age-system)). Projet non officiel, à usage
personnel.

Ce module **n'est pas un système** : il vient enrichir un monde existant utilisant
`age-system` (mode *The Expanse*). Il apporte :

- **Compendiums en français** compatibles age-system :
  - **Prouesses (Péripéties)** — toutes les prouesses de combat, exploration, social… (Items `stunts`).
  - **Armes** — table d'armement (Items `weapon`, capacités/dégâts adaptés au mode Expanse).
  - **Armures & boucliers** — (Items `equipment` avec modificateurs d'armure).
  - **Talents (Spécialisations)** — les 13 spécialisations avec grades Novice/Expert/Maître (Items `talent`).
  - **Compétences (Focus)** — le glossaire des compétences par attribut (Items `focus`).
- **Habillage des dés officiels de The Expanse** via **Dice So Nice** : les 8 apparences
  officielles (Terrien, Martien, Ceinturien, Protogène — versions sombre/claire) sont
  proposées comme jeux de couleurs sélectionnables. Le moteur de jet d'age-system
  (dé de Péripéties) n'est **pas** remplacé.

> **Prérequis** : le système `age-system` (v4+), en **mode The Expanse**
> (santé « Fortune », jeu de 9 capacités). Dice So Nice est recommandé pour l'affichage
> 3D des dés.

## Installation par manifest (recommandé)

> Nécessite un **dépôt public**. La distribution passe par les **Releases GitHub**
> (workflow `.github/workflows/release.yml`).

Publier une version :

```bash
git tag v0.1.0
git push --tags
```

Le workflow construit `module.zip`, injecte la version + les URL dans `module.json`
et crée la release. URL de manifest **stable** à coller dans Foundry
(*Configuration → Modules complémentaires → Installer un module → URL du manifeste*) :

```
https://github.com/Delva/foundry_expanse_add-on/releases/latest/download/module.json
```

Foundry détectera automatiquement les futures versions (nouveaux tags `v*`).

## Installation (développement)

Foundry charge les modules depuis `<userData>/Data/modules/`. Sous Windows, le dossier
utilisateur par défaut est `%LOCALAPPDATA%\FoundryVTT\Data\modules`.

Créez une **jonction** (lien) vers ce dépôt, nommée exactement `expanse-age-fr` :

```powershell
# PowerShell (adaptez le chemin de Data si besoin)
$data = "$env:LOCALAPPDATA\FoundryVTT\Data\modules"
New-Item -ItemType Junction -Path "$data\expanse-age-fr" -Target (Resolve-Path .)
```

Puis compilez les compendiums (les packs LevelDB ne sont **pas** versionnés) :

```bash
npm install
npm run build:packs
```

Activez ensuite le module dans un monde utilisant `age-system`.

## Contenu & build

Les données des compendiums sont **curées** dans [`tools/pack-data.mjs`](tools/pack-data.mjs)
(mécaniques uniquement, textes paraphrasés/adaptés) puis compilées en packs LevelDB
par [`tools/build-packs.mjs`](tools/build-packs.mjs) (`npm run build:packs`). Les Items
portent `system: "age-system"` et respectent le `template.json` d'age-system.

Sources de contenu : *The Expanse — Livre de Base* (© Green Ronin / Black Book Éditions
pour la VF), synthétisées pour un usage privé.

## Dés — crédits & licence des assets

Les images de faces de dés (`ui/dice/**`) proviennent du **système officiel The Expanse**
pour FoundryVTT ([`Foxfyre/expanse`](https://github.com/Foxfyre/expanse), code sous
licence Apache-2.0). L'art des dés est **© Green Ronin Publishing**. Il est réutilisé ici
pour un **usage privé** ; ne pas redistribuer publiquement sans l'autorisation de l'ayant droit.

## Compatibilité

- FoundryVTT **v13** (`minimum`/`verified` : 13).
- Système **age-system** ≥ 4.0.0, mode *The Expanse*.

Projet non officiel. *The Expanse* et l'AGE System sont des marques de Green Ronin Publishing.
