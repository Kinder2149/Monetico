import { test } from 'node:test';
import assert from 'node:assert/strict';
import initSqlJs from 'sql.js';
import { creerBase } from '../src/donnees/base.js';
import * as depot from '../src/donnees/depot.js';
import { formaterEuros, lireMontant, montantPourSaisie, total } from '../src/logique/argent.js';

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
});

test('étape 3 : ajouter, renommer, supprimer catégories et sous-catégories', () => {
  const { base } = nouvelleBase();
  const id = depot.creerCategorie(base, { nom: 'Animaux', type: 'depense' });
  depot.creerCategorie(base, { nom: 'Vétérinaire', type: 'depense', parentId: id });
  depot.creerCategorie(base, { nom: 'Croquettes', type: 'depense', parentId: id });
  let animaux = depot.listerCategories(base, 'depense').find((c) => c.id === id);
  assert.deepEqual(animaux.sous.map((s) => s.nom), ['Croquettes', 'Vétérinaire']);

  depot.renommerCategorie(base, id, 'Animal de compagnie');
  animaux = depot.listerCategories(base, 'depense').find((c) => c.id === id);
  assert.equal(animaux.nom, 'Animal de compagnie');

  depot.supprimerCategorie(base, animaux.sous[0].id);
  assert.equal(depot.listerCategories(base, 'depense').find((c) => c.id === id).sous.length, 1);

  // Supprimer une catégorie emporte ses sous-catégories.
  depot.supprimerCategorie(base, id);
  assert.equal(depot.listerCategories(base, 'depense').length, 10);
  assert.equal(base.lire('SELECT COUNT(*) AS n FROM categorie WHERE parent_id = ?', [id])[0].n, 0);
});
