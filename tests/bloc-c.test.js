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

test('étape 9 : une récurrente « À valider » ne change le solde qu\'une fois validée', () => {
  const base = nouvelleBase();
  const pm = depot.creerPorteMonnaie(base, { nom: 'Courant', soldeDepart: 100000 });
  const loyer = categorie(base, 'Loyer');
  const id = depot.creerRecurrente(base, { type: 'depense', montant: 65000, categorieId: loyer, porteMonnaieId: pm, jour: 5, note: 'Loyer' });
  depot.creerRecurrente(base, { type: 'revenu', montant: 200000, categorieId: categorie(base, 'Salaire', 'revenu'), porteMonnaieId: pm, jour: 28 });

  assert.equal(depot.recurrentesAValider(base, '2026-11').length, 2);
  assert.equal(depot.listerPorteMonnaie(base)[0].solde, 100000);
  assert.equal(depot.listerOperations(base).length, 0);

  const [r] = depot.recurrentesAValider(base, '2026-11').filter((x) => x.id === id);
  const operationId = depot.validerRecurrente(base, r, '2026-11', '2026-11-06');
  assert.equal(depot.listerPorteMonnaie(base)[0].solde, 35000);
  const [o] = depot.listerOperations(base);
  assert.deepEqual([o.date, o.montant, o.categorie, o.note], ['2026-11-06', 65000, 'Loyer', 'Loyer']);
  assert.deepEqual(depot.recurrentesAValider(base, '2026-11').map((x) => x.id).includes(id), false);
  // Le mois suivant, elle revient « À valider ».
  assert.equal(depot.recurrentesAValider(base, '2026-12').length, 2);
  // Supprimer l'opération validée remet le mois « À valider ».
  depot.supprimerOperation(base, operationId);
  assert.equal(depot.recurrentesAValider(base, '2026-11').length, 2);
});

test('étape 9 : modifier, supprimer ; catégorie et porte-monnaie d\'une récurrente protégés', () => {
  const base = nouvelleBase();
  const pm = depot.creerPorteMonnaie(base, { nom: 'Courant', soldeDepart: 0 });
  const abonnements = categorie(base, 'Abonnements');
  const id = depot.creerRecurrente(base, { type: 'depense', montant: 1599, categorieId: abonnements, porteMonnaieId: pm, jour: 28 });
  assert.equal(depot.categorieUtilisee(base, abonnements), true);
  assert.equal(depot.porteMonnaieUtilise(base, pm), true);

  depot.modifierRecurrente(base, id, { type: 'depense', montant: 1999, categorieId: abonnements, porteMonnaieId: pm, jour: 31, note: 'Basic fit' });
  const [r] = depot.listerRecurrentes(base);
  assert.deepEqual([r.montant, r.jour, r.note], [1999, 31, 'Basic fit']);

  const operationId = depot.validerRecurrente(base, r, '2026-11', '2026-11-30');
  depot.supprimerRecurrente(base, id);
  assert.equal(depot.listerRecurrentes(base).length, 0);
  assert.equal(depot.listerOperations(base)[0].id, operationId);
  assert.equal(depot.categorieUtilisee(base, abonnements), true);
});

test('étape 9 : jour prévu dans le mois', async () => {
  const { jourPrevu } = await import('../src/logique/dates.js');
  assert.equal(jourPrevu(28, '2026-11-03'), '2026-11-28');
  assert.equal(jourPrevu(31, '2026-04-10'), '2026-04-30');
  assert.equal(jourPrevu(31, '2026-02-01'), '2026-02-28');
});

test('étape 10 : prêt, remboursements, reste dû, effet sur les soldes (D28)', () => {
  const base = nouvelleBase();
  const courant = depot.creerPorteMonnaie(base, { nom: 'Courant', soldeDepart: 100000 });
  const especes = depot.creerPorteMonnaie(base, { nom: 'Especes', soldeDepart: 0 });
  const id = depot.creerPret(base, { personne: 'Léa', montant: 5000, date: '2026-11-01', porteMonnaieId: courant });
  const soldes = () => Object.fromEntries(depot.listerPorteMonnaie(base).map((p) => [p.nom, p.solde]));
  assert.deepEqual(soldes(), { Courant: 95000, Especes: 0 });

  depot.ajouterRemboursement(base, id, { montant: 2000, date: '2026-11-02', porteMonnaieId: especes });
  let [p] = depot.listerPrets(base);
  assert.deepEqual([p.rembourse, p.resteDu, p.remboursements.length], [2000, 3000, 1]);
  assert.deepEqual(soldes(), { Courant: 95000, Especes: 2000 });
  assert.equal(depot.porteMonnaieUtilise(base, especes), true);
  // Ni le prêt ni le remboursement ne sont des opérations (carte du mois, budgets).
  assert.equal(depot.listerOperations(base).length, 0);

  const r2 = depot.ajouterRemboursement(base, id, { montant: 3000, date: '2026-11-03', porteMonnaieId: courant });
  [p] = depot.listerPrets(base);
  assert.equal(p.resteDu, 0);

  // Un prêt remboursé passe après ceux encore dus.
  depot.creerPret(base, { personne: 'Tom', montant: 1000, date: '2026-10-01', porteMonnaieId: courant });
  assert.deepEqual(depot.listerPrets(base).map((x) => x.personne), ['Tom', 'Léa']);

  depot.supprimerRemboursement(base, r2);
  assert.equal(depot.listerPrets(base).find((x) => x.id === id).resteDu, 3000);
  depot.modifierPret(base, id, { personne: 'Léa M.', montant: 6000, date: '2026-11-01', porteMonnaieId: courant });
  assert.equal(depot.listerPrets(base).find((x) => x.id === id).resteDu, 4000);

  depot.supprimerPret(base, id);
  assert.deepEqual(soldes(), { Courant: 99000, Especes: 0 });
  assert.equal(base.lire('SELECT COUNT(*) AS n FROM remboursement')[0].n, 0);
});

test('étape 11 : camembert du mois et solde en fin de mois', async () => {
  const { partsCamembert } = await import('../src/logique/argent.js');
  const { decalerMois } = await import('../src/logique/dates.js');
  const base = nouvelleBase();
  const pm = depot.creerPorteMonnaie(base, { nom: 'Courant', soldeDepart: 100000 });
  const op = (type, montant, nom, date) => depot.creerOperation(base, {
    type, montant, categorieId: categorie(base, nom, type), porteMonnaieId: pm, date,
  });
  op('depense', 3000, 'Courses', '2026-11-02');
  op('depense', 1000, 'Restaurant', '2026-11-03');
  op('depense', 6000, 'Loyer', '2026-11-01');
  op('depense', 999, 'Courses', '2026-10-31');
  op('revenu', 50000, 'Salaire', '2026-10-28');
  depot.creerPret(base, { personne: 'Léa', montant: 2000, date: '2026-11-02', porteMonnaieId: pm });

  // Les sous-catégories comptent dans leur catégorie ; seulement le mois choisi.
  const categories = depot.depensesParCategorie(base, { debut: '2026-11-01', fin: '2026-11-30' });
  assert.deepEqual(categories.map((c) => [c.nom, c.montant]), [['Logement', 6000], ['Alimentation', 4000]]);
  const { total, parts } = partsCamembert(categories);
  assert.equal(total, 10000);
  assert.deepEqual(parts.map((p) => p.part), [0.6, 0.4]);

  const beaucoup = Array.from({ length: 9 }, (_, i) => ({ id: i, nom: `C${i}`, montant: 100 }));
  const regroupe = partsCamembert(beaucoup).parts;
  assert.equal(regroupe.length, 7);
  assert.deepEqual([regroupe.at(-1).nom, regroupe.at(-1).montant], ['Autres catégories', 300]);

  assert.equal(depot.soldeTotalAu(base, '2026-09-30'), 100000);
  assert.equal(depot.soldeTotalAu(base, '2026-10-31'), 100000 + 50000 - 999);
  assert.equal(depot.soldeTotalAu(base, '2026-11-30'), 100000 + 50000 - 999 - 10000 - 2000);
  assert.equal(depot.soldeTotalAu(base, '2026-11-30'), depot.listerPorteMonnaie(base)[0].solde);

  assert.equal(decalerMois('2026-11-03', -11), '2025-12-03');
  assert.equal(decalerMois('2026-03-31', -1), '2026-02-28');
});
