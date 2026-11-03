import { test } from 'node:test';
import assert from 'node:assert/strict';
import initSqlJs from 'sql.js';
import { creerBase } from '../src/donnees/base.js';
import * as depot from '../src/donnees/depot.js';
import { formaterEuros, lireMontant, montantPourSaisie, total, entreesSorties, parJour, rechercher } from '../src/logique/argent.js';
import { libelleJour, bornesDuMois } from '../src/logique/dates.js';

const SQL = await initSqlJs();

function nouvelleBase() {
  const sauvegardes = [];
  const base = creerBase(new SQL.Database(), (contenu) => sauvegardes.push(contenu));
  return { base, sauvegardes };
}

test('montants : format français', () => {
  assert.equal(formaterEuros(123456).replace(/\s/g, ' '), '1 234,56 €');
  assert.equal(formaterEuros(-500).replace(/\s/g, ' '), '-5,00 €');
});

test('montants : lecture de la saisie', () => {
  assert.equal(lireMontant('12,5'), 1250);
  assert.equal(lireMontant('1 234,56 €'), 123456);
  assert.equal(lireMontant('-20'), -2000);
  assert.equal(lireMontant('0.1'), 10);
  assert.equal(lireMontant('abc'), null);
  assert.equal(lireMontant('12,345'), null);
  assert.equal(montantPourSaisie(150000), '1500,00');
});

test('étape 2 : créer, modifier, supprimer un porte-monnaie', () => {
  const { base } = nouvelleBase();
  const id = depot.creerPorteMonnaie(base, { nom: 'Compte courant', soldeDepart: 120000 });
  depot.creerPorteMonnaie(base, { nom: 'Espèces', soldeDepart: 4550 });
  let liste = depot.listerPorteMonnaie(base);
  assert.deepEqual(liste.map((p) => p.nom), ['Compte courant', 'Espèces']);
  assert.equal(total(liste), 124550);

  depot.modifierPorteMonnaie(base, id, { nom: 'Banque', soldeDepart: 100000 });
  liste = depot.listerPorteMonnaie(base);
  assert.equal(liste.find((p) => p.id === id).nom, 'Banque');
  assert.equal(total(liste), 104550);

  depot.supprimerPorteMonnaie(base, id);
  assert.deepEqual(depot.listerPorteMonnaie(base).map((p) => p.nom), ['Espèces']);
});

test('données conservées : la base rechargée retrouve les porte-monnaie', () => {
  const { base, sauvegardes } = nouvelleBase();
  depot.creerPorteMonnaie(base, { nom: 'Épargne', soldeDepart: 5000 });
  const rechargee = creerBase(new SQL.Database(sauvegardes.at(-1)));
  assert.deepEqual(depot.listerPorteMonnaie(rechargee).map((p) => p.nom), ['Épargne']);
});

test('étape 3 : la liste de départ est en place', () => {
  const { base } = nouvelleBase();
  const depenses = depot.listerCategories(base, 'depense');
  const revenus = depot.listerCategories(base, 'revenu');
  assert.equal(depenses.length, 10);
  assert.equal(revenus.length, 6);
  const logement = depenses.find((c) => c.nom === 'Logement');
  assert.deepEqual(logement.sous.map((s) => s.nom), ['Assurance', 'Eau', 'Électricité', 'Internet/Téléphone', 'Loyer']);
  assert.equal(depenses.find((c) => c.nom === 'Santé').sous.length, 0);
  assert.equal(depenses.reduce((n, c) => n + c.sous.length, 0), 21);
  // Chaque catégorie du modèle a une icône de départ.
  const toutes = [...depenses, ...revenus].flatMap((c) => [c, ...c.sous]);
  assert.deepEqual(toutes.filter((c) => !c.icone).map((c) => c.nom), []);
});

test('étape 3 : ajouter, renommer, supprimer catégories et sous-catégories', () => {
  const { base } = nouvelleBase();
  const id = depot.creerCategorie(base, { nom: 'Animaux', type: 'depense' });
  depot.creerCategorie(base, { nom: 'Vétérinaire', type: 'depense', parentId: id });
  depot.creerCategorie(base, { nom: 'Croquettes', type: 'depense', parentId: id });
  let animaux = depot.listerCategories(base, 'depense').find((c) => c.id === id);
  assert.deepEqual(animaux.sous.map((s) => s.nom), ['Croquettes', 'Vétérinaire']);

  depot.modifierCategorie(base, id, { nom: 'Animal de compagnie', icone: 'dog' });
  animaux = depot.listerCategories(base, 'depense').find((c) => c.id === id);
  assert.equal(animaux.nom, 'Animal de compagnie');
  assert.equal(animaux.icone, 'dog');

  depot.supprimerCategorie(base, animaux.sous[0].id);
  assert.equal(depot.listerCategories(base, 'depense').find((c) => c.id === id).sous.length, 1);

  // Supprimer une catégorie emporte ses sous-catégories.
  depot.supprimerCategorie(base, id);
  assert.equal(depot.listerCategories(base, 'depense').length, 10);
  assert.equal(base.lire('SELECT COUNT(*) AS n FROM categorie WHERE parent_id = ?', [id])[0].n, 0);
});

function avecDonnees() {
  const { base } = nouvelleBase();
  const banque = depot.creerPorteMonnaie(base, { nom: 'Banque', soldeDepart: 100000 });
  const especes = depot.creerPorteMonnaie(base, { nom: 'Espèces', soldeDepart: 5000 });
  const cat = (nom) => base.lire('SELECT id FROM categorie WHERE nom = ?', [nom])[0].id;
  return { base, banque, especes, cat };
}

test('étape 4 : une dépense baisse le solde, un revenu le monte', () => {
  const { base, banque, cat } = avecDonnees();
  depot.creerOperation(base, { type: 'depense', montant: 2350, categorieId: cat('Courses'), porteMonnaieId: banque, date: '2026-11-03' });
  depot.creerOperation(base, { type: 'revenu', montant: 200000, categorieId: cat('Salaire'), porteMonnaieId: banque, date: '2026-11-01' });
  const liste = depot.listerPorteMonnaie(base);
  assert.equal(liste.find((p) => p.id === banque).solde, 100000 - 2350 + 200000);
  assert.equal(total(liste), 105000 - 2350 + 200000);
});

test('étape 4 : montant nul refusé par la base', () => {
  const { base, banque, cat } = avecDonnees();
  assert.throws(() => depot.creerOperation(base, { type: 'depense', montant: 0, categorieId: cat('Courses'), porteMonnaieId: banque, date: '2026-11-03' }));
});

test('D22 : porte-monnaie et catégorie utilisés ne peuvent pas être supprimés', () => {
  const { base, banque, especes, cat } = avecDonnees();
  depot.creerOperation(base, { type: 'depense', montant: 500, categorieId: cat('Courses'), porteMonnaieId: banque, date: '2026-11-03' });
  assert.equal(depot.porteMonnaieUtilise(base, banque), true);
  assert.equal(depot.porteMonnaieUtilise(base, especes), false);
  assert.equal(depot.categorieUtilisee(base, cat('Courses')), true);
  assert.equal(depot.categorieUtilisee(base, cat('Alimentation')), true, 'la catégorie parente compte aussi');
  assert.equal(depot.categorieUtilisee(base, cat('Logement')), false);
  // Garde-fou : la base refuse même si l'écran laissait passer.
  assert.throws(() => depot.supprimerPorteMonnaie(base, banque));
  assert.throws(() => depot.supprimerCategorie(base, cat('Alimentation')));
});

test('étape 5 : liste, modification, suppression, filtre, recherche, mois', () => {
  const { base, banque, especes, cat } = avecDonnees();
  const a = depot.creerOperation(base, { type: 'depense', montant: 1200, categorieId: cat('Restaurant'), porteMonnaieId: banque, date: '2026-11-02', note: 'Pizzéria du coin' });
  depot.creerOperation(base, { type: 'depense', montant: 300, categorieId: cat('Café/Bar'), porteMonnaieId: especes, date: '2026-11-03' });
  depot.creerOperation(base, { type: 'revenu', montant: 5000, categorieId: cat('Vente'), porteMonnaieId: banque, date: '2026-10-28' });

  const toutes = depot.listerOperations(base);
  assert.deepEqual(toutes.map((o) => o.date), ['2026-11-03', '2026-11-02', '2026-10-28']);
  assert.equal(toutes[1].categorieParent, 'Alimentation');
  assert.deepEqual(parJour(toutes).map((g) => g.jour), ['2026-11-03', '2026-11-02', '2026-10-28']);
  assert.equal(depot.listerOperations(base, { porteMonnaieId: especes }).length, 1);

  assert.equal(rechercher(toutes, 'pizzeria').length, 1, 'sans accent');
  assert.equal(rechercher(toutes, 'ALIMENT').length, 2, 'par catégorie parente');

  const { debut, fin } = bornesDuMois('2026-11-15');
  assert.deepEqual({ debut, fin }, { debut: '2026-11-01', fin: '2026-11-30' });
  assert.deepEqual(entreesSorties(depot.listerOperations(base, { debut, fin })), { entrees: 0, sorties: 1500 });

  depot.modifierOperation(base, a, { type: 'depense', montant: 1500, categorieId: cat('Restaurant'), porteMonnaieId: banque, date: '2026-11-02', note: '' });
  assert.equal(depot.listerPorteMonnaie(base).find((p) => p.id === banque).solde, 100000 - 1500 + 5000);
  depot.supprimerOperation(base, a);
  assert.equal(depot.listerPorteMonnaie(base).find((p) => p.id === banque).solde, 100000 + 5000);
});

test('dates : libellés des jours', () => {
  assert.equal(libelleJour('2026-11-03', '2026-11-03'), "Aujourd'hui");
  assert.equal(libelleJour('2026-11-02', '2026-11-03'), 'Hier');
  assert.equal(libelleJour('2026-10-26', '2026-11-03'), 'Lundi 26 octobre');
  assert.equal(libelleJour('2025-12-31', '2026-11-03'), 'Mercredi 31 décembre 2025');
});

test('étape 6 : un transfert déplace l\'argent sans changer le total ni le mois', () => {
  const { base, banque, especes } = avecDonnees();
  const id = depot.creerOperation(base, { type: 'transfert', montant: 4000, porteMonnaieId: banque, versPorteMonnaieId: especes, date: '2026-11-03' });
  const liste = depot.listerPorteMonnaie(base);
  assert.equal(liste.find((p) => p.id === banque).solde, 100000 - 4000);
  assert.equal(liste.find((p) => p.id === especes).solde, 5000 + 4000);
  assert.equal(total(liste), 105000);

  const duMois = depot.listerOperations(base, { debut: '2026-11-01', fin: '2026-11-30' });
  assert.deepEqual(entreesSorties(duMois), { entrees: 0, sorties: 0 });

  // Visible dans la liste des deux porte-monnaie, sans catégorie.
  const vueEspeces = depot.listerOperations(base, { porteMonnaieId: especes });
  assert.equal(vueEspeces.length, 1);
  assert.equal(vueEspeces[0].versPorteMonnaie, 'Espèces');
  assert.equal(vueEspeces[0].categorieId, null);

  // Le porte-monnaie d'arrivée compte comme utilisé (D22).
  assert.equal(depot.porteMonnaieUtilise(base, especes), true);

  depot.modifierOperation(base, id, { type: 'transfert', montant: 1000, porteMonnaieId: especes, versPorteMonnaieId: banque, date: '2026-11-03' });
  const apres = depot.listerPorteMonnaie(base);
  assert.equal(apres.find((p) => p.id === banque).solde, 100000 + 1000);
  assert.equal(apres.find((p) => p.id === especes).solde, 5000 - 1000);
});
