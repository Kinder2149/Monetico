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
