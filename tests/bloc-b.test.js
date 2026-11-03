import { test } from 'node:test';
import assert from 'node:assert/strict';
import initSqlJs from 'sql.js';
import { creerBase } from '../src/donnees/base.js';
import * as depot from '../src/donnees/depot.js';
import { lireExportMoneyLover } from '../src/logique/importMoneyLover.js';

const SQL = await initSqlJs();

function nouvelleBase() {
  const sauvegardes = [];
  const base = creerBase(new SQL.Database(), (contenu) => sauvegardes.push(contenu));
  return { base, sauvegardes };
}

// Même forme que l'export réel de Kinder (BOM, en-tête, dates JJ/MM/AAAA, point décimal).
const EXPORT = '\uFEFFID,Note,Amount,Category,Account,Currency,Date,Event,Exclude Report\n'
  + '1,Bouygues,-23.39,Facture de téléphone,Caisse D\'épargne,EUR,28/11/2026,,False\n'
  + '2,pain,-1.2,Boulangerie,Caisse D\'épargne,EUR,02/11/2026,,False\n'
  + '3,pain,-1.2,Boulangerie,Caisse D\'épargne,EUR,02/11/2026,,False\n'
  + '4,"Resto, entre amis",-45.5,Restaurant,Caisse D\'épargne,EUR,15/06/2024,Holidays 2k24,False\n'
  + '5,,-30,Fast Food,Caisse D\'épargne,EUR,01/05/2024,,False\n'
  + '6,,1800,Salaire,Caisse D\'épargne,EUR,28/04/2024,,False\n'
  + '7,Solde initial,172.57,Autres revenus,Caisse D\'épargne,EUR,02/04/2019,,False\n';

test('étape 7 : lecture de l\'export, opérations à venir écartées', () => {
  const { operations, aVenir } = lireExportMoneyLover(EXPORT, '2026-11-03');
  assert.equal(aVenir, 1);
  assert.equal(operations.length, 6);
  assert.deepEqual(operations[2], {
    type: 'depense', montant: 4550, categorie: 'Restaurant', porteMonnaie: "Caisse D'épargne",
    date: '2024-06-15', note: 'Resto, entre amis · Holidays 2k24',
  });
  assert.equal(operations[4].type, 'revenu');
  assert.equal(operations[4].montant, 180000);
});

test('étape 7 : un fichier qui n\'est pas un export est refusé', () => {
  assert.throws(() => lireExportMoneyLover('nom,prix\npain,1'), /pas un export Money Lover/);
});

test('étape 7 : import, solde, catégories retrouvées ou créées, une seule sauvegarde', () => {
  const { base, sauvegardes } = nouvelleBase();
  const avant = sauvegardes.length;
  const { operations } = lireExportMoneyLover(EXPORT, '2026-11-03');
  const resume = depot.importerOperations(base, operations);
  assert.equal(sauvegardes.length, avant + 1);
  assert.deepEqual(resume, { operations: 6, dejaPresentes: 0, porteMonnaieCrees: 1, categoriesCreees: 2, porteMonnaie: 1 });
  const [pm] = depot.listerPorteMonnaie(base);
  assert.equal(pm.nom, "Caisse D'épargne");
  assert.equal(pm.solde, -120 - 120 - 4550 - 3000 + 180000 + 17257);
  // « Fast Food » rejoint la sous-catégorie Moneta « Fast-food » ; Boulangerie et Autres revenus sont créées.
  const liste = depot.listerOperations(base);
  assert.equal(liste.find((o) => o.montant === 3000).categorieParent, 'Alimentation');
  assert.ok(depot.listerCategories(base, 'depense').some((c) => c.nom === 'Boulangerie'));
  assert.ok(depot.listerCategories(base, 'revenu').some((c) => c.nom === 'Autres revenus'));
  assert.equal(liste.filter((o) => o.note === 'pain').length, 2);
});

test('étape 7 : réimporter le même fichier ne crée pas de doublons', () => {
  const { base } = nouvelleBase();
  const { operations } = lireExportMoneyLover(EXPORT, '2026-11-03');
  depot.importerOperations(base, operations);
  const solde = depot.listerPorteMonnaie(base)[0].solde;
  const resume = depot.importerOperations(base, operations);
  assert.equal(resume.operations, 0);
  assert.equal(resume.dejaPresentes, 6);
  assert.equal(resume.categoriesCreees, 0);
  assert.equal(depot.listerOperations(base).length, 6);
  assert.equal(depot.listerPorteMonnaie(base)[0].solde, solde);
});

test('étape 7 : une erreur pendant l\'import n\'enregistre rien', () => {
  const { base } = nouvelleBase();
  assert.throws(() => depot.importerOperations(base, [
    { type: 'depense', montant: 100, categorie: 'Courses', porteMonnaie: 'A', date: '2024-01-01', note: '' },
    { type: 'depense', montant: -5, categorie: 'Courses', porteMonnaie: 'A', date: '2024-01-01', note: '' },
  ]));
  assert.equal(depot.listerOperations(base).length, 0);
  assert.equal(depot.listerPorteMonnaie(base).length, 0);
});
