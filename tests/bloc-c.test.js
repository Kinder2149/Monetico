import { test } from 'node:test';
import assert from 'node:assert/strict';
import initSqlJs from 'sql.js';
import { creerBase } from '../src/donnees/base.js';
import * as depot from '../src/donnees/depot.js';
import { etatBudget } from '../src/logique/argent.js';
import { periodeBudget, libellePeriode } from '../src/logique/dates.js';

const SQL = await initSqlJs();
const nouvelleBase = () => creerBase(new SQL.Database());

const categorie = (base, nom, type = 'depense') => {
  const toutes = depot.listerCategories(base, type).flatMap((c) => [c, ...c.sous]);
  return toutes.find((c) => c.nom === nom).id;
};

test('étape 8 : période du budget selon le jour de départ', () => {
  assert.deepEqual(periodeBudget(1, '2026-11-03'), { debut: '2026-11-01', fin: '2026-11-30' });
  assert.deepEqual(periodeBudget(5, '2026-11-03'), { debut: '2026-10-05', fin: '2026-11-04' });
  assert.deepEqual(periodeBudget(5, '2026-11-05'), { debut: '2026-11-05', fin: '2026-12-04' });
  assert.deepEqual(periodeBudget(15, '2026-01-10'), { debut: '2025-12-15', fin: '2026-01-14' });
  // Le 31 devient le dernier jour des mois plus courts.
  assert.deepEqual(periodeBudget(31, '2026-03-02'), { debut: '2026-02-28', fin: '2026-03-30' });
  assert.equal(libellePeriode({ debut: '2026-11-01', fin: '2026-11-30' }), 'du 1 nov. au 30 nov.');
});

test('étape 8 : dépensé, catégories et sous-catégories, dépassement, exclusion', () => {
  const base = nouvelleBase();
  const pm = depot.creerPorteMonnaie(base, { nom: 'Courant', soldeDepart: 0 });
  const alimentation = categorie(base, 'Alimentation');
  const courses = categorie(base, 'Courses');
  const op = (montant, categorieId, date, type = 'depense') =>
    depot.creerOperation(base, { type, montant, categorieId, porteMonnaieId: pm, date });
  const gros = op(15000, courses, '2026-11-02');
  op(2000, alimentation, '2026-11-03');
  op(4000, categorie(base, 'Sorties'), '2026-11-03');      // autre catégorie : non comptée
  op(3000, courses, '2026-10-31');                          // période précédente : non comptée
  op(9000, categorie(base, 'Salaire', 'revenu'), '2026-11-03', 'revenu');

  const id = depot.creerBudget(base, { nom: 'Alimentation', maximum: 10000, categorieIds: [alimentation] });
  const [budget] = depot.listerBudgets(base);
  assert.equal(budget.jourDepart, 1);
  const periode = periodeBudget(budget.jourDepart, '2026-11-03');
  let etat = etatBudget(budget.maximum, depot.depensesDuBudget(base, id, periode));
  assert.equal(etat.depense, 17000);
  assert.equal(etat.depasse, true);
  assert.equal(etat.part, 1);

  depot.exclureDuBudget(base, id, gros, true);
  etat = etatBudget(budget.maximum, depot.depensesDuBudget(base, id, periode));
  assert.equal(etat.depense, 2000);
  assert.equal(etat.depasse, false);
  assert.equal(etat.part, 0.2);

  depot.exclureDuBudget(base, id, gros, false);
  assert.equal(etatBudget(10000, depot.depensesDuBudget(base, id, periode)).depense, 17000);

  // Au mois suivant, le budget repart à zéro.
  assert.equal(etatBudget(10000, depot.depensesDuBudget(base, id, periodeBudget(1, '2026-12-01'))).depense, 0);
});

test('étape 8 : modifier et supprimer un budget ; une opération supprimée sort de ses exclusions', () => {
  const base = nouvelleBase();
  const pm = depot.creerPorteMonnaie(base, { nom: 'Courant', soldeDepart: 0 });
  const courses = categorie(base, 'Courses');
  const o = depot.creerOperation(base, { type: 'depense', montant: 500, categorieId: courses, porteMonnaieId: pm, date: '2026-11-02' });
  const id = depot.creerBudget(base, { nom: 'Courses', maximum: 30000, categorieIds: [courses] });
  depot.exclureDuBudget(base, id, o, true);
  depot.supprimerOperation(base, o);
  assert.equal(depot.depensesDuBudget(base, id, periodeBudget(1, '2026-11-03')).length, 0);

  depot.modifierBudget(base, id, { nom: 'Sorties', maximum: 5000, jourDepart: 10, categorieIds: [categorie(base, 'Sorties')] });
  const [b] = depot.listerBudgets(base);
  assert.deepEqual([b.nom, b.maximum, b.jourDepart, b.categorieIds.length], ['Sorties', 5000, 10, 1]);

  depot.supprimerBudget(base, id);
  assert.equal(depot.listerBudgets(base).length, 0);
  assert.equal(base.lire('SELECT COUNT(*) AS n FROM budget_categorie')[0].n, 0);
});
