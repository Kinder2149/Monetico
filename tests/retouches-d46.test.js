// Retouches après le test de Kinder du 2026-11-17 (D46) : budgets, mémoire de saisie, graphiques.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import initSqlJs from 'sql.js';
import { creerBase } from '../src/donnees/base.js';
import * as depot from '../src/donnees/depot.js';
import { historiqueBudget, argentDisponible, repartitionBudgets } from '../src/logique/argent.js';

const SQL = await initSqlJs();
const nouvelleBase = () => creerBase(new SQL.Database());

function jeu() {
  const base = nouvelleBase();
  const pm = depot.creerPorteMonnaie(base, { nom: 'Courant', soldeDepart: 100000 });
  const courses = depot.creerCategorie(base, { nom: 'Courses', type: 'depense', icone: 'shopping-cart' });
  const sorties = depot.creerCategorie(base, { nom: 'Sorties', type: 'depense' });
  const ajout = (categorieId, montant, date, note = '') =>
    depot.creerOperation(base, { type: 'depense', montant, categorieId, porteMonnaieId: pm, date, note });
  return { base, pm, courses, sorties, ajout };
}

test('D46 : un budget garde son icône', () => {
  const { base, courses } = jeu();
  const id = depot.creerBudget(base, { nom: 'Courses', maximum: 30000, categorieIds: [courses], icone: 'shopping-cart' });
  assert.equal(depot.listerBudgets(base)[0].icone, 'shopping-cart');
  depot.modifierBudget(base, id, { nom: 'Courses', maximum: 30000, jourDepart: 1, categorieIds: [courses], icone: 'gift' });
  assert.equal(depot.listerBudgets(base)[0].icone, 'gift');
});

test('D46 : l\'historique d\'un budget donne le dépensé par mois, l\'écart et la variation', () => {
  const mois = [
    { periode: { debut: '2026-11-01', fin: '2026-11-30' }, depenses: [{ montant: 25000 }, { montant: 10000, exclue: true }] },
    { periode: { debut: '2026-10-01', fin: '2026-10-31' }, depenses: [{ montant: 35000 }] },
  ];
  const [nov, oct] = historiqueBudget(30000, mois);
  assert.equal(nov.depense, 25000);
  assert.equal(nov.reste, 5000);
  assert.equal(nov.depasse, false);
  assert.equal(nov.variation, -10000);
  assert.equal(oct.depense, 35000);
  assert.equal(oct.depasse, true);
  assert.equal(oct.variation, null);
});

test('D46 : l\'argent disponible additionne solde, salaire et autres lignes ; les budgets sont comparés', () => {
  const dispo = argentDisponible(50000, [{ montant: 200000 }, { montant: 15000 }, { montant: 0 }]);
  assert.equal(dispo, 265000);
  assert.deepEqual(repartitionBudgets(dispo, [100000, 120000]), { total: 220000, libre: 45000, depasse: false });
  assert.equal(repartitionBudgets(dispo, [200000, 100000]).depasse, true);
});

test('D46 : un montant récurrent propose sa catégorie habituelle, un montant rare non', () => {
  const { base, courses, sorties, ajout } = jeu();
  ajout(courses, 1250, '2026-11-01');
  assert.equal(depot.categorieHabituelle(base, 'depense', 1250), null);
  ajout(courses, 1250, '2026-11-02');
  ajout(sorties, 1250, '2026-11-03');
  assert.equal(depot.categorieHabituelle(base, 'depense', 1250), courses);
  assert.equal(depot.categorieHabituelle(base, 'depense', 999), null);
});

test('D46 : en tapant « car », les notes déjà utilisées sont proposées avec leur catégorie', () => {
  const { base, courses, sorties, ajout } = jeu();
  ajout(courses, 4000, '2026-11-01', 'Carrefour');
  ajout(courses, 3000, '2026-11-02', 'Carrefour');
  ajout(sorties, 2000, '2026-11-03', 'Café du coin');
  ajout(sorties, 1500, '2026-11-04', 'Scarlett');
  const propositions = depot.suggestionsNotes(base, 'depense', 'car');
  assert.deepEqual(propositions.map((s) => s.note), ['Carrefour', 'Scarlett']);
  assert.equal(propositions[0].categorieId, courses);
  assert.deepEqual(depot.suggestionsNotes(base, 'depense', 'c'), []);
  assert.deepEqual(depot.suggestionsNotes(base, 'depense', 'carrefour'), []);
});

test('D46 : une opération sait de quelle catégorie parente elle dépend (filtre par catégorie)', () => {
  const { base, courses, ajout } = jeu();
  const bio = depot.creerCategorie(base, { nom: 'Bio', type: 'depense', parentId: courses });
  ajout(bio, 800, '2026-11-05');
  const [o] = depot.listerOperations(base, {});
  assert.equal(o.categorieId, bio);
  assert.equal(o.categorieParentId, courses);
});
