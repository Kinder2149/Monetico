// Lecture d'un export Money Lover (CSV) en opérations prêtes à importer (D26).
import { aujourdhui } from './dates.js';

const COLONNES = ['Note', 'Amount', 'Category', 'Account', 'Date'];

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
    operations.push({
      type: montant > 0 ? 'revenu' : 'depense',
      montant: Math.abs(montant),
      categorie: valeur(ligne, 'Category') || 'Divers',
      porteMonnaie: valeur(ligne, 'Account') || 'Money Lover',
      date,
      note: [valeur(ligne, 'Note'), evenement].filter(Boolean).join(' · '),
    });
  }
  return { operations, aVenir };
}
