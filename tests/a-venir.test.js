// D56 : l'onglet « À venir » ne plante plus quand une récurrente est à valider.
// Operations.jsx n'est pas lisible par node (JSX) : on en extrait la fonction recurrentesPrevues, telle quelle.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import initSqlJs from 'sql.js';
import { creerBase } from '../src/donnees/base.js';
import * as depot from '../src/donnees/depot.js';
import { decaler, decalerMois, jourPrevu, moisDe } from '../src/logique/dates.js';

const SQL = await initSqlJs();
const source = readFileSync(new URL('../src/ui/Operations.jsx', import.meta.url), 'utf8');
const texte = source.match(/function recurrentesPrevues[\s\S]*?\r?\n}\r?\n/)[0];
const recurrentesPrevues = new Function(
  'decaler', 'decalerMois', 'moisDe', 'jourPrevu', 'recurrentesAValider',
  `${texte}; return recurrentesPrevues;`,
)(decaler, decalerMois, moisDe, jourPrevu, depot.recurrentesAValider);

test('D56 : À venir renvoie les récurrentes à valider, et seulement celles du compte filtré', () => {
  const base = creerBase(new SQL.Database());
  const a = depot.creerPorteMonnaie(base, { nom: 'Courant', soldeDepart: 100000 });
  const b = depot.creerPorteMonnaie(base, { nom: 'Épargne', soldeDepart: 0 });
  const cat = depot.listerCategories(base, 'depense')[0].id;
  depot.creerRecurrente(base, { type: 'depense', montant: 65000, categorieId: cat, porteMonnaieId: a, jour: 5, note: 'Loyer' });
  depot.creerRecurrente(base, { type: 'depense', montant: 1000, categorieId: cat, porteMonnaieId: b, jour: 10, note: 'Frais' });

  const toutes = recurrentesPrevues(base, null, '2026-11-18');
  assert.ok(toutes.length >= 2);
  assert.ok(toutes.every((r) => r.date >= '2026-11-19'));
  const duCompte = recurrentesPrevues(base, a, '2026-11-18');
  assert.ok(duCompte.length >= 1);
  assert.ok(duCompte.every((r) => r.porteMonnaieId === a));
});
