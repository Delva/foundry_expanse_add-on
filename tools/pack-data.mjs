/**
 * Données curées des compendiums « The Expanse — Addon (AGE System) ».
 * Items compatibles avec le système age-system (mode The Expanse).
 * Mécaniques uniquement, textes paraphrasés/adaptés.
 * Source : The Expanse — Livre de Base (© Green Ronin / Black Book Éditions).
 * Compilé en packs LevelDB par tools/build-packs.mjs.
 */

import crypto from "node:crypto";

const p = (s) => `<p>${s}</p>`;

/** Identifiant déterministe de 20 caractères alphanumériques (clé de modificateur age-system). */
function modId(seed) {
  return crypto.createHash("md5").update(seed).digest("hex").slice(0, 20);
}

/** Construit une entrée de modificateur age-system (system.modifiers[key]). */
function mod(seed, type, formula) {
  const key = modId(`${seed}:${type}`);
  return {
    key,
    entry: {
      type,
      formula: String(formula),
      flavor: "",
      isActive: true,
      valid: true,
      conditions: {},
      ftype: "",
      key
    }
  };
}

/** Assemble une liste de modificateurs en objet indexé par clé. */
function modifiers(...list) {
  const o = {};
  for (const { key, entry } of list) o[key] = entry;
  return o;
}

/* =========================================================================
 * 1) PROUESSES (Péripéties)  →  Item type "stunts"
 * ========================================================================= */

// Coût AGE → { stuntPoints, stuntPointsMax, costType }
function parseCost(cost) {
  const s = String(cost).trim();
  let m;
  if ((m = s.match(/^(\d+)\s*-\s*(\d+)$/))) {
    return { stuntPoints: +m[1], stuntPointsMax: +m[2], costType: "variable" };
  }
  if ((m = s.match(/^(\d+)\s*\+$/))) {
    return { stuntPoints: +m[1], stuntPointsMax: +m[1], costType: "variable" };
  }
  if ((m = s.match(/^(\d+)$/))) {
    return { stuntPoints: +m[1], stuntPointsMax: +m[1], costType: "fixed" };
  }
  return { stuntPoints: 1, stuntPointsMax: 1, costType: "fixed" };
}

// Catégories : [libellé affiché, arène AGE (combat|exploration|roleplaying)]
const STUNT_CATEGORIES = {
  "combat": ["Combat — Général", "combat"],
  "poursuites": ["Combat — Poursuites", "combat"],
  "tir": ["Combat — Arme à feu", "combat"],
  "lutte": ["Combat — Lutte", "combat"],
  "corps-a-corps": ["Combat — Corps à corps", "combat"],
  "vehicule": ["Combat — Véhicule", "combat"],
  "exploration": ["Exploration — Général", "exploration"],
  "infiltration": ["Exploration — Infiltration", "exploration"],
  "investigation": ["Exploration — Investigation", "exploration"],
  "attitude": ["Social — Attitude", "roleplaying"],
  "affiliation": ["Social — Affiliation & réputation", "roleplaying"]
};

// [coût, nom, effet] par catégorie (Livre de Base p.95-107)
const PROUESSES = {
  "combat": [
    ["1-3", "Montée d'adrénaline", "Regagne des points de Fortune égaux aux PP dépensés."],
    ["1-3", "Élan", "+3 à l'initiative par PP."],
    ["1-3", "Anguille", "+1 Défense par PP jusqu'au prochain tour."],
    ["1-3", "S'abriter", "Coefficient d'abri égal aux PP (max de l'abri)."],
    ["1+", "Ange gardien", "S'interpose pour un allié à 5 m ; subit 1 dégât par PP à sa place."],
    ["1+", "Escarmouche", "Déplace la cible ou soi de 2 m par PP."],
    ["1", "Les moyens du bord", "Attrape de quoi faire une arme improvisée."],
    ["2+", "Tactique de groupe", "Un allié se déplace de 2 m par tranche de 2 PP."],
    ["2", "Duo de choc", "Un allié attaque immédiatement votre cible."],
    ["2", "Blesser", "Impose l'état Blessé (si cible ≤ ½ Fortune et dégâts > Résistance)."],
    ["2", "Mise à terre", "Met l'ennemi à terre."],
    ["2", "Surmonter la résistance", "Résistance de la cible divisée par 2 contre cette attaque."],
    ["2", "Raillerie", "La cible doit vous attaquer/gêner (Tromperie vs Maîtrise de soi)."],
    ["3", "Attaque vicieuse", "+1d6 dégâts."],
    ["3", "Blocage", "S'interpose entre un ennemi et une cible protégée."],
    ["3", "Mettre à découvert", "Détruit ou déplace un abri à portée."],
    ["3", "Attaque éclair", "Une 2e attaque à votre tour."],
    ["3", "Domination rapide", "Les témoins subissent −1 (Intimidation)."],
    ["4", "Assommer", "Impose l'état Inconscient (mêmes conditions que Blesser)."],
    ["4", "Prise d'initiative", "Placé en tête de l'ordre d'initiative."],
    ["5", "Coup mortel", "+2d6 dégâts."],
    ["5", "Blesser gravement", "Impose l'état Gravement blessé (mêmes conditions)."]
  ],
  "poursuites": [
    ["1+", "Pied au plancher", "+1 au prochain test de poursuite par PP."],
    ["2", "Manœuvre d'évitement", "Attaques contre vous −2 jusqu'au prochain tour."],
    ["2", "Suivez le guide", "Manœuvre délicate (test ND choisi) ; échec = accident."],
    ["2", "Attaque en mouvement", "Action bonus : une attaque au contact/à distance, ou Activer."],
    ["3", "Stabilisation", "Passagers +1 aux attaques/tests sur support stable."],
    ["3", "Interférence", "Une cible −2 à son prochain test de poursuite."],
    ["4", "Raccourci", "+2 à votre total de poursuite."]
  ],
  "tir": [
    ["1-3", "Surveillance étroite", "Adversaire −1 aux attaques par PP."],
    ["1-4", "Tir de précision", "Augmente le bonus de Viser de +1 par PP."],
    ["1-3", "Ricochet", "Ignore une part du coefficient d'armure (= PP) d'une cible à couvert."],
    ["1-3", "Courte rafale (auto)", "Ignore 1 pt de Résistance par PP."],
    ["1-3", "Mitraillage (auto)", "Attaque aussi les cibles autour (rayon = PP), dégâts ÷2."],
    ["1-5", "Tir de suppression (auto)", "Attaque quiconque entre dans un rayon de (PP) m."],
    ["1", "Rechargement rapide", "Prochain rechargement = action libre."],
    ["2+", "Tireur efficace", "−1 au dé de Péripéties de Capacité par 2 PP."],
    ["2", "Longue rafale (auto)", "2e attaque (−2 attaque, +2 dégâts)."],
    ["2", "Coup de crosse (pistolet)", "2e attaque en frappe : 1d6 + Force."],
    ["4", "Tir ciblé", "Les dégâts deviennent pénétrants."],
    ["4", "Perchoir de tireur d'élite", "Double la portée de l'arme au prochain tour."],
    ["5", "Arroser (auto)", "Touche toutes les cibles dans 5 m (un seul test)."]
  ],
  "lutte": [
    ["1-3", "Handicap", "Attaques de contact de l'adversaire −2 dégâts par PP."],
    ["1", "Lutte", "Cible immobilisée 1 tour ; vous deux −2 Défense."],
    ["2", "Plaquage", "Vous deux à terre ; cible +1d6 dégâts."],
    ["2", "Bouclier humain", "Les attaques à distance ratées touchent la cible."],
    ["3", "Étranglement", "La cible perd une action pour reprendre sa respiration."],
    ["3", "Otage", "Position de vulnérabilité ; +2 au dé de Péripéties si elle agit."],
    ["4", "Immobiliser", "Cible limitée à une action libre ; vous deux −4 Défense."],
    ["4", "Entraver", "Avec équipement : impose l'état Entravé."]
  ],
  "corps-a-corps": [
    ["1-3", "Parade", "Adversaire −1 Défense par PP."],
    ["1+", "Jeu de jambes", "+1 par PP à un test lié au combat."],
    ["2", "Feinte", "Réduit l'initiative de la cible de 1 (min 1)."],
    ["2", "Désarmement", "Projette l'arme de la cible à 1d6 + Force mètres."],
    ["3", "Crampe", "Rapidité de la cible −3 (cumulatif ; 0 = Entravé)."],
    ["3", "Bloquer l'arme", "La prochaine attaque de contact de l'adversaire échoue."],
    ["4", "Écraser l'armure", "Convertit jusqu'à 3 dégâts en pénalité d'armure."],
    ["5", "Casser l'arme", "Détruit l'arme de l'adversaire."]
  ],
  "vehicule": [
    ["1-3", "Endommager les systèmes", "−1 par PP (max 3) à Maniement / Capteurs / Armes."],
    ["1+", "Transpercer la coque", "Outrepasse la résistance (dépenser PP = coef de Coque)."],
    ["2", "Déviation", "Le véhicule dévie ; le pilote teste ND 15 pour garder le contrôle."],
    ["2", "Saborder", "Détruit un véhicule impuissant."],
    ["2+", "Shrapnel", "Explosion interne : 1d6 / 2 PP (ou 2d6 / 4 PP) aux occupants."],
    ["3+", "Coque endommagée", "Réduit le coef de Coque de 1 par 3 PP."],
    ["3", "Ralentissement", "Rapidité du véhicule −1 catégorie ; pilote teste ND 15."],
    ["4", "Désactiver le propulseur", "Véhicule impuissant (test ND 15)."],
    ["4+", "Embrocher", "4 PP : 4d6 à un occupant ; 6 PP : 6d6."],
    ["5", "Rupture", "3d6 pénétrants aux occupants + effet Endommager / Ralentissement."],
    ["6", "Désactiver le moteur", "Véhicule sans énergie ni défense."]
  ],
  "exploration": [
    ["1-3", "Un plan sans accroc", "Un allié gagne un bonus égal aux PP à son prochain test pour le même objectif."],
    ["1+", "Mieux vaut prévenir", "+1 par PP au prochain test lié (dans un test prolongé)."],
    ["1+", "Le bon filon", "+1 par PP (temporaire) à vos Revenus, jusqu'au prochain échec de Revenus."],
    ["2", "Bricolage", "Plus de pénalité de manque d'équipement pour la rencontre."],
    ["2", "Bête de course", "Complète le test en moitié moins de temps."],
    ["3", "La haute main", "Si le succès mène au combat : +3 à l'initiative."],
    ["4", "Avec panache", "+1 à tous les tests en opposition contre les témoins (fin de rencontre)."],
    ["5", "Frugal", "Ce test de Revenus ne vide pas vos comptes."]
  ],
  "infiltration": [
    ["1+", "Juste une ombre", "Tant que personne ne vous remarque : +1 par PP au prochain test."],
    ["1", "Bon instinct", "Découvrez la conséquence probable de votre action (test de Perception)."],
    ["1+", "Apaiser les eaux", "Réduit la Réserve de Turbulences du nombre de PP dépensés."],
    ["1", "Bravoure", "+1d6 points de Résistance face au prochain risque délétère."],
    ["2", "Par ici !", "Vos alliés +1 pour se cacher ; les adversaires vous ciblent vous."],
    ["3", "Sens du sacrifice", "Subissez à la place d'un allié les dégâts d'un risque qu'il a raté."],
    ["3", "Effacer ses traces", "−2 à tous les futurs jets cherchant à suivre votre piste."],
    ["4", "Techno-embrouille", "Ignore une complication mineure, ou accomplit une tâche impossible."],
    ["4", "C'était pas moi", "Incrimine un autre personnage pour le résultat de votre test."],
    ["5", "Quelle coïncidence", "Un PNJ possédant une compétence/un talent choisi arrive sur les lieux."]
  ],
  "investigation": [
    ["1-3", "À moi !", "Le MJ dévoile une info supplémentaire par PP (Simple) ; +1 par PP au test sur cette piste (Détaillée)."],
    ["1", "Réminiscence", "Le MJ révèle une autre source d'investigation (Simple) ; une compétence apparentée compte comme principale (Détaillée)."],
    ["2", "Intuition", "Le MJ dévoile un fait non déductible (Simple) ; un indice donne 2 pistes au lieu d'une (Détaillée)."],
    ["3", "Coup de chance (Détaillée)", "Une compétence non pertinente compte comme apparentée au prochain test de piste."],
    ["4", "Dans le terrier du lapin blanc (Détaillée)", "Une révélation fournit en plus une piste vers de plus grandes récompenses."],
    ["5", "Découverte", "Indice/preuve irréfutable (Simple) ; réduit d'une le nombre de pistes → progresse vers une révélation (Détaillée)."]
  ],
  "attitude": [
    ["1-3", "Faire une offre", "Décale l'Attitude de la cible de 1 cran en votre faveur par PP."],
    ["1", "Prendre la température", "Le MJ dévoile l'attitude/intention d'un PNJ présent."],
    ["2", "Deux voix valent mieux qu'une", "Persuade un PNJ de prendre votre parti (+1 cran d'Attitude)."],
    ["3", "Inconvenance", "Regagne les PP dépensés +1 ; un PNJ vous devient hostile."],
    ["3", "Discréditer", "Un PNJ −2 à son prochain jet social (sauf contre vous)."],
    ["4", "Pari risqué", "Dégrade l'Attitude de la cible envers un autre (jusqu'à Très hostile)."],
    ["5", "Ingérence", "Décale d'un cran l'Attitude réciproque de deux PNJ."]
  ],
  "affiliation": [
    ["1", "Bon mot", "Titre honorifique temporaire (Réputation passive)."],
    ["1", "Prise de risque", "Un allié +2 à son prochain test social (au risque de votre Réputation)."],
    ["2", "Dans les règles", "Votre rang d'Affiliation compte +1 niveau pour accéder à des ressources."],
    ["2", "Le bénéfice du doute", "+1 aux bonus d'Affiliation/Réputation avec un PNJ."],
    ["3", "Message viral", "Titre honorifique pour le reste de la session."],
    ["4", "Assurance débordante", "Titre honorifique / rang d'Affiliation temporaire."],
    ["5", "Esbroufe", "Bénéficiez des avantages de Réputation/Affiliation d'un tiers."]
  ]
};

const prouessesDocs = [];
let stuntSort = 0;
for (const [slug, lignes] of Object.entries(PROUESSES)) {
  const [libelle, arene] = STUNT_CATEGORIES[slug];
  for (const [cout, nom, effet] of lignes) {
    const c = parseCost(cout);
    prouessesDocs.push({
      name: nom,
      type: "stunts",
      img: "icons/svg/target.svg",
      sort: (stuntSort += 100),
      system: {
        shortDesc: `${libelle} — Coût ${cout} PP`,
        longDesc: p(effet),
        favorite: false,
        reference: "",
        stuntPoints: c.stuntPoints,
        stuntPointsMax: c.stuntPointsMax,
        costType: c.costType,
        type: arene
      }
    });
  }
}

/* =========================================================================
 * 2) ARMES  →  Item type "weapon"  (mode The Expanse)
 *    useAbl = capacité d'attaque (fight = Combat, acc = Précision)
 *    dmgAbl = capacité ajoutée aux dégâts (str = Force, per = Perception)
 * ========================================================================= */

// [nom, useAbl, useFocus, nrDice, diceType, extraValue, dmgAbl, ranged, range, rangeMax, rof, cout, note]
const ARMES = [
  ["Mains nues", "fight", "Bagarre", "1", "3", 0, "str", false, 0, 0, "none", null, "1d6 avec un focus adapté."],
  ["Arme improvisée", "fight", "", "1", "6", 0, "str", false, 0, 0, "none", null, ""],
  ["Arme de contact légère", "fight", "Armes légères", "1", "6", 0, "str", false, 0, 0, "none", 6, "Couteau, matraque, bâton léger, épée… (Force ou Dextérité aux dégâts)."],
  ["Arme de contact lourde", "fight", "Armes lourdes", "2", "6", 0, "str", false, 0, 0, "none", 7, "Hache, masse, grande épée…"],
  ["Arc", "acc", "Arcs", "1", "6", 0, "per", true, 100, 150, "singleShot", null, "Arc composite à arbalète ; dégâts selon l'arme (voir Livre de Base)."],
  ["Pistolet", "acc", "Pistolets", "2", "6", 0, "per", true, 50, 75, "semiAuto", 10, "Arme balistique de poing."],
  ["Fusil", "acc", "Fusils", "3", "6", 0, "per", true, 200, 300, "semiAuto", 12, "Arme balistique d'épaule."],
  ["Arme de jet", "acc", "Jet", "1", "6", 0, "str", true, 10, 0, "none", 6, "Portée 10 + Force mètres (lot de 4 à 6)."],
  ["Grenade", "acc", "Jet", "3", "6", 0, "", true, 0, 0, "none", 15, "Dégâts sur un rayon de 5 m."]
];

const armesDocs = ARMES.map(
  ([nom, useAbl, useFocus, nrDice, diceType, extra, dmgAbl, ranged, range, rangeMax, rof, cout, note], i) => {
    const abilLabel = { fight: "Combat", acc: "Précision", per: "Perception", str: "Force" };
    const formula = `${nrDice}d${diceType}${dmgAbl ? ` + ${abilLabel[dmgAbl]}` : ""}`;
    return {
      name: nom,
      type: "weapon",
      img: "icons/svg/sword.svg",
      sort: (i + 1) * 100,
      system: {
        useAbl,
        useFocus,
        targetNumber: 10,
        powerPointCost: 1,
        fatigueTN: 10,
        dmgType: "wound",
        dmgSource: "impact",
        nrDice: String(nrDice),
        diceType: String(diceType),
        extraValue: extra,
        dmgAbl,
        damageInjury: 1,
        damageFormula: formula,
        minStr: 0,
        weight: 0,
        cost: cout ?? 0,
        quantity: 1,
        equiped: false,
        ranged,
        range,
        rangeMax,
        rof,
        reload: "minor",
        capacity: 0,
        wgroups: [],
        shortDesc: ranged
          ? `${abilLabel[useAbl]} (${useFocus}) — portée ${range}${rangeMax ? "/" + rangeMax : ""} m`
          : `${abilLabel[useAbl]} (${useFocus || "—"}) — contact`,
        longDesc: note ? p(note) : "",
        favorite: false,
        reference: "",
        modifiers: {},
        itemMods: {}
      }
    };
  }
);

/* =========================================================================
 * 3) ARMURES & BOUCLIERS  →  Item type "equipment"
 *    Les valeurs passent par system.modifiers (age-system, mode Expanse) :
 *    impactArmor = Armure, armorPenalty = Pénalité, defense = bonus de Défense (boucliers).
 *    Les bonus ne s'appliquent que lorsque l'objet est équipé (equiped: true).
 * ========================================================================= */

// [nom, catégorie, { impactArmor?, armorPenalty?, toughness?, defense? }, coût, note]
const ARMURES = [
  ["Matelassage", "armure", { impactArmor: 1 }, 8, "Protection matelassée improvisée."],
  ["Armure légère", "armure", { impactArmor: 2, armorPenalty: 1 }, 12, ""],
  ["Armure intermédiaire", "armure", { impactArmor: 4, armorPenalty: 2 }, 14, ""],
  ["Armure lourde", "armure", { impactArmor: 6, armorPenalty: 3 }, 16, ""],
  ["Armure assistée", "armure", { impactArmor: 12 }, 0, "Servo-armure motorisée : aucune pénalité de mouvement. Coût spécial (voir le MJ)."],
  ["Bouclier anti-émeute", "bouclier", { defense: 2 }, 13, "Occupe une main."],
  ["Bouclier balistique", "bouclier", { defense: 3 }, 14, "Bouclier lourd ; occupe une main."]
];

const ARMURE_LABEL = {
  impactArmor: (v) => `Armure ${v}`,
  armorPenalty: (v) => `Pénalité −${v}`,
  toughness: (v) => `Résistance +${v}`,
  defense: (v) => `Défense +${v}`
};

const armuresDocs = ARMURES.map(([nom, categorie, stats, cout, note], i) => {
  const mods = [];
  const parts = [];
  for (const [type, val] of Object.entries(stats)) {
    if (!val) continue;
    mods.push(mod(nom, type, val));
    parts.push(ARMURE_LABEL[type](val));
  }
  return {
    name: nom,
    type: "equipment",
    img: "icons/svg/shield.svg",
    sort: (i + 1) * 100,
    system: {
      shortDesc: `${parts.join(" · ")} — coût ${cout || "spécial"}`,
      longDesc: note ? p(note) : "",
      favorite: false,
      reference: "",
      weight: 0,
      cost: cout,
      quantity: 1,
      equiped: false,
      modifiers: modifiers(...mods),
      itemMods: {}
    }
  };
});

/* =========================================================================
 * 4) TALENTS (Spécialisations)  →  Item type "talent"  (grades Novice/Expert/Maître)
 * ========================================================================= */

// [nom, prérequis, thème court, novice, expert, maître]
const TALENTS = [
  ["Agent", "Perception 2, compétences Perception (Empathie) et Communication (Tromperie).",
    "Espion et infiltrateur de talent.",
    "Si vous échouez à un test de Communication (Tromperie), vous pouvez le relancer mais devez conserver le nouveau résultat.",
    "Quand vous accomplissez la prouesse Prendre la température, ajoutez +3 à votre test de Perception (Empathie) s'il se fait en opposition.",
    "Vous gagnez deux compétences parmi Communication (Déguisement), Communication (Investigation), Dextérité (Discrétion), Intelligence (Cryptographie) et Intelligence (Sécurité) que vous ne possédez pas ; si vous les avez toutes, choisissez-en deux et gagnez +1 aux jets correspondants."],
  ["Artiste martial", "Combat 2 et au moins un grade Novice dans un style de combat rapproché.",
    "Pour vous, le combat rapproché est un art.",
    "Quand vous effectuez un jet d'attaque basé sur le Combat, ajoutez +1 aux dégâts en cas de succès.",
    "Quand vous accomplissez la prouesse Élan avec des PP gagnés grâce à un jet d'attaque de Combat, déterminez le bonus d'initiative comme si vous aviez dépensé 1 PP de plus.",
    "Quand vous effectuez l'action Manœuvre de combat avec un jet d'attaque de Combat, vous générez automatiquement 2 PP."],
  ["As de la gâchette", "Dextérité 2 et Précision 2.",
    "Personne ne tire aussi vite et précisément que vous.",
    "Votre précision est instinctive. Choisissez Précision (Pistolets) ou Précision (Fusils) : +1 aux jets d'attaque et de dégâts avec la compétence choisie.",
    "Vous pouvez choisir l'autre compétence du grade Novice (et lui appliquer le bonus), ou améliorer à +2 le bonus de la compétence déjà choisie.",
    "Choisissez une prouesse parmi Attaque éclair, Surveillance étroite, Coup mortel ou Mutilation : avec une arme à feu, vous l'accomplissez pour 1 PP de moins (Surveillance étroite : effets décalés d'un cran)."],
  ["Cadre", "Communication 2 et compétence Communication (Persuasion).",
    "Vous faites valoir votre autorité à la tête d'une organisation.",
    "Vous gagnez une nouvelle Affiliation ou montez d'un rang dans une que vous possédez ; vous pouvez relancer les tests pour accéder à ses privilèges ou influencer ses membres (conserver le nouveau résultat).",
    "Une fois par jour, un test de Communication (Persuasion) réussi convoque un subordonné de votre organisation pour vous assister (niveau et ND selon votre niveau de personnage).",
    "Ajoutez votre rang d'Affiliation à vos Revenus quand vous faites appel à l'organisation ; un point de Revenus perdu est regagné au prochain interlude passé avec elle."],
  ["Commando", "Constitution 2 et compétence Volonté (Maîtrise de soi).",
    "Vous avez été formé à combattre et à gagner, qu'importent vos chances.",
    "Si vous échouez à un test de Volonté (Maîtrise de soi), vous pouvez le relancer mais devez conserver le nouveau résultat.",
    "Vous gagnez une Relation d'intensité 1 avec votre équipe, conservée même si ses membres changent (augmentable normalement).",
    "Face à un état épuisé, fatigué, blessé ou gravement blessé : test de Constitution (Endurance) ou Volonté (Maîtrise de soi) ND 13 ; en cas de succès, ignorez les effets de cet état pour la rencontre."],
  ["Hacker", "Intelligence 2 et compétence Intelligence (Technologie).",
    "Vous excellez dans l'usage et l'exploitation des systèmes informatiques.",
    "Ajoutez +1 à vos tests d'Intelligence (Technologie).",
    "Vous pouvez accomplir la prouesse Techno-embrouille pour 2 PP ; +1 à votre dé de Péripéties lors des tests prolongés impliquant des systèmes informatiques.",
    "Quand vous utilisez un système informatique, vous pouvez accomplir Effacer ses traces pour 1 PP ; +1 supplémentaire au dé de Péripéties (total +2) en test prolongé."],
  ["Investigateur", "Perception 2, Intelligence 2 et au moins une compétence de Perception.",
    "Vous êtes un détective accompli.",
    "Vous pouvez toujours tester pour débloquer une piste, même sans compétence adaptée (sinon ND +2) ; avec une compétence primaire ou apparentée, +1 au test ou ND non augmenté.",
    "Vous pouvez accomplir la prouesse Intuition pour 1 PP ; +1 supplémentaire (total +2) si vous possédez la compétence primaire de la piste.",
    "Vous pouvez accomplir la prouesse Découverte lors d'une investigation pour 3 PP seulement."],
  ["Mondain", "Communication 2 et Perception 2.",
    "Vous savez y faire avec les gens pour qu'ils vous offrent ce que vous désirez.",
    "Vous pouvez accomplir la prouesse Deux voix valent mieux qu'une pour 1 PP.",
    "Lors d'une manœuvre sociale complexe, il vous faut un décalage de moins pour réussir (minimum 1) ; une manœuvre simple vous donne +1 au test.",
    "Avec des gens dont l'attitude serait Neutre ou pire envers vous, celle-ci est automatiquement décalée d'un cran en votre faveur (sauf s'ils se sentent physiquement menacés)."],
  ["Pilote émérite", "Dextérité 3 et compétence Dextérité (Pilotage).",
    "Peu de gens savent voler comme vous.",
    "Quand vous accomplissez la prouesse de poursuite Pied au plancher, vous gagnez +1 supplémentaire au prochain test de poursuite (+2 pour 1 PP, +3 pour 2 PP, etc.).",
    "Ajoutez +2 au dé de Péripéties lors de vos tests de Dextérité (Pilotage).",
    "Ajoutez +1 aux tests de Dextérité (Pilotage) ; vous pouvez relancer un jet raté (sans ce bonus), en conservant le nouveau résultat."],
  ["Star", "Communication 2 et compétence Communication (Spectacle).",
    "Vos performances, votre charisme et votre célébrité captivent le public.",
    "Avec la compétence Communication (Spectacle), vous pouvez accomplir la prouesse Influencer l'auditoire pour 1 PP.",
    "Vous pouvez accomplir la prouesse Assurance débordante pour 2 PP.",
    "Lors d'un Geste symbolique, votre seuil de succès pour chaque décalage diminue de 1."],
  ["Tireur d'élite", "Précision 3 et compétence Précision (Fusils).",
    "Vous réalisez les tirs les plus difficiles.",
    "Si votre cible ne vous a pas détecté, vous pouvez relancer votre premier jet d'attaque de Précision (Fusils) de la rencontre (conserver le nouveau résultat).",
    "Avec l'action Viser pour une attaque de Précision (Fusils), ajoutez à vos dégâts un bonus égal à celui de Viser (Tir de précision inclus).",
    "Avec la compétence Précision (Fusils), vous pouvez accomplir la prouesse Tir ciblé pour 2 PP."],
  ["Universitaire", "Intelligence 2 et compétence Intelligence (Recherches).",
    "Vous savez dénicher les informations et vous en servir.",
    "Si vous échouez à un test d'Intelligence (Recherches), vous pouvez le relancer mais devez conserver le nouveau résultat.",
    "Quand vous accomplissez la prouesse A-Ha !, vous gagnez une utilisation gratuite supplémentaire (2× pour 1 PP, 3× pour 2 PP, etc.).",
    "Lors d'un test prolongé, gagnez +1 au résultat de chaque dé de Péripéties sur les tests d'Intelligence (Recherches)."],
  ["Voleur", "Dextérité 2 et compétences Dextérité (Escamotage) et Dextérité (Discrétion).",
    "Pour voler des choses sans vous faire prendre, vous êtes un expert.",
    "Choisissez Dextérité (Discrétion) ou Dextérité (Escamotage) : +1 à tous les tests correspondants.",
    "Sur un test de Dextérité (Discrétion) ou (Escamotage) pour dissimuler/dérober, vous pouvez relancer (conserver le nouveau résultat) ; vous pouvez accomplir C'était pas moi pour 2 PP.",
    "Choisissez l'autre compétence entre Dextérité (Discrétion) et (Escamotage) : +1 supplémentaire à tous les tests correspondants."]
];

const talentsDocs = TALENTS.map(([nom, prereq, theme, novice, expert, maitre], i) => ({
  name: nom,
  type: "talent",
  img: "icons/svg/upgrade.svg",
  sort: (i + 1) * 100,
  system: {
    shortDesc: theme,
    longDesc: p(`<strong>Prérequis :</strong> ${prereq}`),
    favorite: false,
    reference: "",
    requirement: prereq,
    degree: "0",
    type: "talent",
    activate: false,
    degree0: { desc: p(`<strong>Novice.</strong> ${novice}`), isActive: true },
    degree1: { desc: p(`<strong>Expert.</strong> ${expert}`), isActive: true },
    degree2: { desc: p(`<strong>Maître.</strong> ${maitre}`), isActive: true },
    degree3: { desc: "", isActive: false },
    degree4: { desc: "", isActive: false },
    modifiers: {},
    itemMods: {}
  }
}));

/* =========================================================================
 * 5) COMPÉTENCES (Focus)  →  Item type "focus"
 *    useAbl = attribut associé.
 * ========================================================================= */

// attribut → [nom compétence, définition]
const COMPETENCES = {
  fight: [
    ["Armes légères", "Maîtrise des armes de contact légères : matraques, couteaux, bâtons légers, épées."],
    ["Armes lourdes", "Maîtrise des armes de contact grandes ou lourdes : haches, masses, grandes épées."],
    ["Bagarre", "Maîtrise du combat à mains nues, de la boxe aux arts martiaux."],
    ["Lutte", "Techniques de combat sans arme visant à immobiliser ou entraver."]
  ],
  comm: [
    ["Déguisement", "Modifier votre apparence pour ressembler à quelqu'un d'autre."],
    ["Étiquette", "Connaître les bonnes pratiques sociales de diverses cultures."],
    ["Expression", "Transmettre efficacement idées et pensées par les mots."],
    ["Investigation", "Interroger les gens, découvrir puis décrypter des preuves."],
    ["Jeu", "Maîtriser les jeux d'argent et savoir en tirer profit."],
    ["Marchandage", "Négocier et conclure des accords avec des tiers."],
    ["Meneur d'hommes", "Guider, diriger et inspirer les autres."],
    ["Persuasion", "Convaincre les autres d'adhérer à votre point de vue."],
    ["Séduction", "Attirer l'attention grâce à une attitude séductrice ou provocante."],
    ["Spectacle", "Divertir un public par une représentation artistique."],
    ["Tromperie", "Duper les gens et leur mentir."]
  ],
  cons: [
    ["Course", "Se déplacer rapidement, en sprint ou sur de grandes distances."],
    ["Endurance", "Résister à la fatigue, aux maladies et aux privations."],
    ["Natation", "Se mouvoir dans l'eau et se maintenir à la surface."],
    ["Tolérance", "Résister aux effets de substances potentiellement toxiques."]
  ],
  dex: [
    ["Acrobaties", "Exécuter des mouvements de gymnastique, garder l'équilibre, amortir les chutes."],
    ["Apesanteur", "Se déplacer et agir en apesanteur (microgravité)."],
    ["Artisanat", "Fabriquer des objets par des compétences manuelles (arts plastiques inclus)."],
    ["Conduite", "Maîtrise des véhicules terrestres : voitures, camions, chariots de transport."],
    ["Discrétion", "Se déplacer sans être détecté."],
    ["Escamotage", "Duper, dissimuler ou faire les poches par des gestes lestes."],
    ["Initiative", "Réagir rapidement sous la pression."],
    ["Pilotage", "Manœuvrer des véhicules en trois dimensions : avions, drones, vaisseaux."]
  ],
  str: [
    ["Escalade", "Gravir murs et autres obstacles verticaux."],
    ["Intimidation", "Impressionner par des menaces et une attitude physique."],
    ["Saut", "Effectuer des sauts, avec ou sans élan."],
    ["Vigueur", "Recourir à la force brute : soulever, transporter des objets lourds."]
  ],
  int: [
    ["Affaires", "Faire tourner une entreprise ; connaître le monde corporatiste."],
    ["Art", "Connaissance des courants, styles, artistes et œuvres des beaux-arts."],
    ["Cryptographie", "Créer et déchiffrer codes et cryptages."],
    ["Culture générale", "Connaissances en politique, actualités et culture populaire."],
    ["Estimation", "Connaître la valeur des biens, œuvres d'art et autres objets."],
    ["Explosifs", "Identifier, utiliser et manipuler les explosifs en toute sécurité."],
    ["Ingénierie", "Fabriquer, réparer et entretenir des appareils technologiques."],
    ["Loi", "Connaissance des codes, réglementations et procédures légales."],
    ["Médecine", "Traiter blessures et maladies ; connaissances médicales et anatomiques."],
    ["Navigation", "Planifier et suivre un itinéraire, lire cartes et données cartographiques."],
    ["Recherches", "Mener des recherches systématiques d'informations (archives, livres…)."],
    ["Sciences", "Connaissances dans un domaine d'étude institutionnalisé (biologie, physique…)."],
    ["Sécurité", "Connaissance des appareils, systèmes, protocoles et personnels de sécurité."],
    ["Tactiques", "Connaissance des stratégies et tactiques militaires."],
    ["Technologie", "Fonctionnement et utilisation de la technologie, notamment les ordinateurs."]
  ],
  per: [
    ["Empathie", "Percevoir et interpréter les émotions et sentiments des autres."],
    ["Fouille", "Trouver des choses dissimulées (compartiments secrets…)."],
    ["Goût", "Percevoir quelque chose grâce à votre sens gustatif."],
    ["Intuition", "Percevoir « à l'instinct » certaines choses autrement indécelables."],
    ["Odorat", "Percevoir quelque chose grâce à votre sens olfactif."],
    ["Ouïe", "Percevoir quelque chose grâce à votre sens auditif."],
    ["Pistage", "Suivre traces et autres signes de passage."],
    ["Survie", "Compétences pratiques de survie en pleine nature."],
    ["Toucher", "Percevoir quelque chose grâce à votre sens tactile."],
    ["Vue", "Percevoir quelque chose grâce à votre sens visuel."]
  ],
  acc: [
    ["Arcs", "Maîtrise des armes de trait, de l'arc composite à l'arbalète mécanique."],
    ["Artillerie", "Maîtrise des armes lourdes à longue portée, y compris embarquées."],
    ["Fusils", "Maîtrise des armes balistiques d'épaule."],
    ["Jet", "Maîtrise des armes de jet, grenades incluses."],
    ["Pistolets", "Maîtrise des armes balistiques de poing."]
  ],
  will: [
    ["Courage", "Surmonter la peur face à l'adversité."],
    ["Foi", "Entretenir sa force intérieure par une croyance morale ou spirituelle."],
    ["Maîtrise de soi", "Concentrer votre énergie mentale, contrôler pulsions et émotions."]
  ]
};

const ABIL_LABEL = {
  fight: "Combat", comm: "Communication", cons: "Constitution", dex: "Dextérité",
  str: "Force", int: "Intelligence", per: "Perception", acc: "Précision", will: "Volonté"
};

const competencesDocs = [];
let focusSort = 0;
for (const [abil, liste] of Object.entries(COMPETENCES)) {
  for (const [nom, def] of liste) {
    competencesDocs.push({
      name: nom,
      type: "focus",
      img: "icons/svg/book.svg",
      sort: (focusSort += 100),
      system: {
        useAbl: abil,
        initialValue: 0,
        improved: false,
        isOrg: false,
        targetNumber: 10,
        powerPointCost: 1,
        fatigueTN: 10,
        shortDesc: `${ABIL_LABEL[abil]} — ${def}`,
        longDesc: p(def),
        favorite: false,
        reference: ""
      }
    });
  }
}

/* =========================================================================
 * 6) MACRO
 * ========================================================================= */

const macroJet = [
  "// Jet Expanse — sélectionnez un jeton puis lancez un test depuis la fiche age-system.",
  "const actor = canvas.tokens?.controlled[0]?.actor ?? game.user.character;",
  "if (!actor) { ui.notifications.warn('The Expanse : sélectionnez un jeton ou assignez un personnage.'); }",
  "else { actor.sheet?.render(true); ui.notifications.info('Fiche ouverte — cliquez sur une capacité pour lancer un test (dé de Péripéties inclus).'); }"
].join("\n");

/* =========================================================================
 * Export
 * ========================================================================= */

export const PACKS = [
  { name: "prouesses", label: "Prouesses (Péripéties)", type: "Item", docs: prouessesDocs },
  { name: "armes", label: "Armes", type: "Item", docs: armesDocs },
  { name: "armures", label: "Armures & boucliers", type: "Item", docs: armuresDocs },
  { name: "talents", label: "Talents (Spécialisations)", type: "Item", docs: talentsDocs },
  { name: "competences", label: "Compétences (Focus)", type: "Item", docs: competencesDocs },
  {
    name: "macros",
    label: "Macros",
    type: "Macro",
    docs: [{ name: "Jet Expanse", img: "icons/svg/d20-black.svg", command: macroJet }]
  }
];
