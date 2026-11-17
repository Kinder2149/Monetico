// Lecture d'un export Money Lover (CSV) en opérations prêtes à importer (D26).
import { aujourdhui } from './dates.js';

const COLONNES = ['Note', 'Amount', 'Category', 'Account', 'Date'];

// « Fast Food » et « Fast-food », « Électricité » et « electricite » désignent la même chose.
export const cleNom = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

// --- Correspondance des catégories Money Lover → catégories Moneta (D43) ---
// Chaque catégorie Money Lover : [catégorie parent (null = premier niveau), nom dans Moneta, icône].
// Les catégories absentes de cette table sont reprises telles quelles (D26).

// Icônes des parents créés à l'import (les autres parents existent dans le modèle de départ).
export const PARENTS_IMPORT = { 'Assurances': 'shield', 'Banque': 'landmark', 'Bureau de tabac': 'cigarette' };

const DEPENSES = {
  'Alimentation': [null, 'Alimentation', 'utensils'], 'Courses': ['Alimentation', 'Courses', 'shopping-cart'],
  'Restaurants': ['Alimentation', 'Restaurant', 'utensils'], 'Restaurant': ['Alimentation', 'Restaurant', 'utensils'],
  'Fast Food': ['Alimentation', 'Fast-food', 'sandwich'], 'Café': ['Alimentation', 'Café', 'coffee'],
  'Bar': ['Alimentation', 'Bar', 'beer'], 'Boulangerie': ['Alimentation', 'Boulangerie', 'bread'],
  'Locations': ['Logement', 'Locations', 'house'], 'Maison': ['Logement', 'Maison', 'sofa'],
  'Factures': ['Logement', 'Factures', 'receipt'], "Facture d'électricité": ['Logement', 'Électricité', 'zap'],
  'Facture de téléphone': ['Logement', 'Facture de téléphone', 'smartphone'],
  'Assurances': [null, 'Assurances', 'shield'],
  'Transports': [null, 'Transports', 'car'], 'Essence': ['Transports', 'Carburant', 'fuel'],
  'Frais de stationnement': ['Transports', 'Stationnement', 'parking'],
  'Vehicle Maintenance': ['Transports', 'Entretien', 'wrench'], 'Taxi': ['Transports', 'Taxi', 'car'],
  'Santé': [null, 'Santé', 'heart-pulse'], 'Visite médicale': ['Santé', 'Visite médicale', 'stethoscope'],
  'Shopping': [null, 'Shopping', 'shopping-bag'], 'Vêtements': ['Shopping', 'Vêtements', 'shirt'],
  'Chaussures': ['Shopping', 'Chaussures', 'shoe'], 'Accessoires': ['Shopping', 'Accessoires', 'handbag'],
  'Électronique & électroménager': ['Shopping', 'Électronique', 'tv'], 'Hygiène': ['Shopping', 'Hygiène', 'sparkles'],
  'Loisirs': [null, 'Loisirs', 'party'], 'Jeux': ['Loisirs', 'Jeux', 'gamepad'], 'Cinéma': ['Loisirs', 'Cinéma', 'film'],
  'Soirée': ['Loisirs', 'Soirée', 'cocktail'], 'Sports': ['Loisirs', 'Sport', 'dumbbell'],
  'Vacances': ['Loisirs', 'Vacances', 'plane'], 'Amis & conjoint': ['Loisirs', 'Amis & conjoint', 'hand-heart'],
  'Abonnement': [null, 'Abonnements', 'repeat'], 'Cadeau': [null, 'Cadeaux', 'gift'],
  'Banque': [null, 'Banque', 'landmark'], 'Frais & charges': ['Banque', 'Frais & charges', 'receipt'],
  'Retrait': ['Banque', 'Retraits', 'cash'], 'Retrait B': ['Banque', 'Retraits', 'cash'],
  'Bureau de tabac': [null, 'Bureau de tabac', 'cigarette'],
  'Autres dépenses': ['Divers', 'Autres dépenses', 'ellipsis'], 'En Attente': ['Divers', 'En Attente', 'hourglass'],
  'Famille': ['Divers', 'Famille', 'hand-heart'],
};

const REVENUS = {
  'Salaire': [null, 'Salaire', 'briefcase'], 'Prime': [null, 'Prime', 'trophy'],
  'Remboursement': [null, 'Remboursement', 'rotate-ccw'], 'Vente': [null, 'Vente', 'tag'],
  'Cadeaux': [null, 'Cadeau reçu', 'hand-heart'], 'Autres revenus': [null, 'Autres', 'money-bag'],
};

const CORRESPONDANCES = new Map([
  ...Object.entries(DEPENSES).map(([nom, v]) => ['depense/' + cleNom(nom), v]),
  ...Object.entries(REVENUS).map(([nom, v]) => ['revenu/' + cleNom(nom), v]),
]);

// Catégorie Moneta d'une catégorie Money Lover : { categorie, categorieParent, categorieIcone },
// ou seulement le nom d'origine si elle n'est pas dans la table.
function correspondance(nom, type) {
  const c = CORRESPONDANCES.get(type + '/' + cleNom(nom));
  return c ? { categorie: c[1], categorieParent: c[0], categorieIcone: c[2] } : { categorie: nom };
}

// Découpe un CSV en lignes de champs (champs entre guillemets acceptés, avec virgules ou guillemets doublés).
function lireCsv(texte) {
  const lignes = [];
  let ligne = [];
  let champ = '';
  let guillemets = false;
  for (let i = 0; i < texte.length; i++) {
    const c = texte[i];
    if (guillemets) {
      if (c === '"' && texte[i + 1] === '"') { champ += '"'; i++; }
      else if (c === '"') guillemets = false;
      else champ += c;
    } else if (c === '"') guillemets = true;
    else if (c === ',') { ligne.push(champ); champ = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && texte[i + 1] === '\n') i++;
      ligne.push(champ); champ = '';
      if (ligne.some((v) => v !== '')) lignes.push(ligne);
      ligne = [];
    } else champ += c;
  }
  ligne.push(champ);
  if (ligne.some((v) => v !== '')) lignes.push(ligne);
  return lignes;
}

// « 28/11/2026 » → « 2026-11-28 » ; null si la date n'est pas lisible.
function lireDate(texte) {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(texte.trim());
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : null;
}

// Renvoie { operations, aVenir } ; les opérations datées après `jour` ne sont que comptées.
// Lève une erreur (message pour l'utilisateur) si le fichier n'est pas un export Money Lover.
export function lireExportMoneyLover(texte, jour = aujourdhui()) {
  const [entete, ...lignes] = lireCsv(texte.replace(/^﻿/, ''));
  const position = Object.fromEntries((entete ?? []).map((nom, i) => [nom.trim(), i]));
  if (!COLONNES.every((nom) => nom in position)) {
    throw new Error("Ce fichier n'est pas un export Money Lover (fichier CSV attendu).");
  }
  const valeur = (ligne, nom) => (position[nom] === undefined ? '' : (ligne[position[nom]] ?? '').trim());
  const operations = [];
  let aVenir = 0;
  for (const ligne of lignes) {
    const date = lireDate(valeur(ligne, 'Date'));
    const montant = Math.round(Number(valeur(ligne, 'Amount')) * 100);
    if (!date || !Number.isFinite(montant) || montant === 0) {
      throw new Error(`Ligne illisible dans le fichier : « ${ligne.join(',')} ».`);
    }
    if (date > jour) { aVenir++; continue; }
    const evenement = valeur(ligne, 'Event');
    const type = montant > 0 ? 'revenu' : 'depense';
    operations.push({
      type,
      montant: Math.abs(montant),
      ...correspondance(valeur(ligne, 'Category') || 'Divers', type),
      porteMonnaie: valeur(ligne, 'Account') || 'Money Lover',
      date,
      note: [valeur(ligne, 'Note'), evenement].filter(Boolean).join(' · '),
    });
  }
  return { operations, aVenir };
}

// --- Export au même modèle (D40) ---

const ENTETE = ['ID', 'Note', 'Amount', 'Category', 'Account', 'Currency', 'Date', 'Event', 'Exclude Report'];

// Champ CSV : entre guillemets s'il contient une virgule, un guillemet ou un retour à la ligne.
const champCsv = (v) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

// « 2026-11-28 » → « 28/11/2026 »
const dateMoneyLover = (jour) => jour.split('-').reverse().join('/');

// Opérations de Moneta → texte CSV au modèle de l'export Money Lover (réimportable sans doublons).
// Les transferts n'existent pas dans ce modèle : ils ne sont que comptés.
export function ecrireExportMoneyLover(operations) {
  const lignes = [ENTETE.join(',')];
  let transferts = 0;
  for (const o of operations) {
    if (o.type === 'transfert') { transferts++; continue; }
    const montant = (o.type === 'depense' ? -o.montant : o.montant) / 100;
    lignes.push([
      String(lignes.length), o.note ?? '', String(montant), o.categorie ?? '', o.porteMonnaie, 'EUR',
      dateMoneyLover(o.date), '', 'False',
    ].map(champCsv).join(','));
  }
  return { texte: '﻿' + lignes.join('\n') + '\n', operations: lignes.length - 1, transferts };
}
