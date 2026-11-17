// Corrections après le test de Kinder du 2026-11-17 (D34 à D40).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import initSqlJs from 'sql.js';
import { creerBase } from '../src/donnees/base.js';
import * as depot from '../src/donnees/depot.js';
import { lireExportMoneyLover, ecrireExportMoneyLover } from '../src/logique/importMoneyLover.js';
import { moisEntre, libelleOngletMois } from '../src/logique/dates.js';

const SQL = await initSqlJs();
const nouvelleBase = () => creerBase(new SQL.Database());

test('D34 : un prêt pour mémoire ne change aucun solde, ses remboursements non plus', () => {
  const base = nouvelleBase();
  const pm = depot.creerPorteMonnaie(base, { nom: 'Courant', soldeDepart: 100000 });
  const memo = depot.creerPret(base, { personne: 'Léa', montant: 5000, date: '2026-11-01', porteMonnaieId: pm });
  depot.ajouterRemboursement(base, memo, { montant: 2000, date: '2026-11-05', porteMonnaieId: pm });
  assert.equal(depot.listerPorteMonnaie(base)[0].solde, 100000);
  assert.equal(depot.soldeTotalAu(base, '2026-11-30'), 100000);
  const [pret] = depot.listerPrets(base);
  assert.equal(pret.compteSolde, false);
  assert.equal(pret.resteDu, 3000);

  // Coché « Compter dans mon solde » : le prêt et ses remboursements comptent (D28).
  depot.modifierPret(base, memo, { ...pret, compteSolde: true });
  assert.equal(depot.listerPorteMonnaie(base)[0].solde, 100000 - 5000 + 2000);
  assert.equal(depot.soldeTotalAu(base, '2026-11-30'), 97000);
});

test('D34 : les prêts créés avant la mise à jour passent pour mémoire', () => {
  const db = new SQL.Database();
  const ancienne = creerBase(db);
  db.run('PRAGMA user_version = 8');
  db.run('ALTER TABLE budget DROP COLUMN icone');
  db.run('ALTER TABLE pret DROP COLUMN compte_solde');
  const pm = depot.creerPorteMonnaie(ancienne, { nom: 'Courant', soldeDepart: 10000 });
  db.run("INSERT INTO pret (personne, montant, date, porte_monnaie_id) VALUES ('Tom', 1000, '2026-10-01', ?)", [pm]);
  const base = creerBase(db);
  assert.equal(depot.listerPorteMonnaie(base)[0].solde, 10000);
});

const EXPORT = '﻿ID,Note,Amount,Category,Account,Currency,Date,Event,Exclude Report\n'
  + '1,"Resto, entre amis",-45.5,Restaurant,Caisse D\'épargne,EUR,15/06/2024,,False\n'
  + '2,pain,-1.2,Boulangerie,Caisse D\'épargne,EUR,02/11/2026,,False\n'
  + '3,pain,-1.2,Boulangerie,Caisse D\'épargne,EUR,02/11/2026,,False\n'
  + '4,,1800,Salaire,Caisse D\'épargne,EUR,28/04/2024,,False\n';

test('D40 : l\'export reprend le modèle Money Lover et se réimporte à l\'identique', () => {
  const base = nouvelleBase();
  depot.importerOperations(base, lireExportMoneyLover(EXPORT, '2026-11-17').operations);
  const [pm] = depot.listerPorteMonnaie(base);
  const autre = depot.creerPorteMonnaie(base, { nom: 'Épargne', soldeDepart: 0 });
  depot.creerOperation(base, { type: 'transfert', montant: 100, porteMonnaieId: pm.id, versPorteMonnaieId: autre, date: '2026-11-03' });

  const { texte, operations, transferts } = ecrireExportMoneyLover(depot.listerOperations(base));
  assert.equal(operations, 4);
  assert.equal(transferts, 1);
  const lignes = texte.replace(/^﻿/, '').trim().split('\n');
  assert.equal(lignes[0], 'ID,Note,Amount,Category,Account,Currency,Date,Event,Exclude Report');
  const sansId = lignes.slice(1).map((l) => l.replace(/^\d+,/, ''));
  assert.ok(sansId.includes('"Resto, entre amis",-45.5,Restaurant,Caisse D\'épargne,EUR,15/06/2024,,False'));
  assert.ok(sansId.includes(',1800,Salaire,Caisse D\'épargne,EUR,28/04/2024,,False'));

  // Réimporté dans la même base : rien n'est ajouté.
  assert.equal(depot.importerOperations(base, lireExportMoneyLover(texte, '2026-11-17').operations).operations, 0);
  // Réimporté dans une base neuve : mêmes opérations, même solde (hors transfert).
  const neuve = nouvelleBase();
  const resume = depot.importerOperations(neuve, lireExportMoneyLover(texte, '2026-11-17').operations);
  assert.equal(resume.operations, 4);
  assert.equal(depot.listerPorteMonnaie(neuve)[0].solde, 180000 - 4550 - 240);
});

test('D37 : onglets des mois de la liste des opérations', () => {
  assert.deepEqual(moisEntre('2026-09-30', '2026-11-17'), ['2026-09', '2026-10', '2026-11']);
  assert.deepEqual(moisEntre('2025-12-31', '2026-01-01'), ['2025-12', '2026-01']);
  assert.equal(libelleOngletMois('2026-11', '2026-11-17'), 'Ce mois-ci');
  assert.equal(libelleOngletMois('2026-10', '2026-11-17'), 'Mois dernier');
  assert.equal(libelleOngletMois('2025-12', '2026-01-05'), 'Mois dernier');
  assert.equal(libelleOngletMois('2026-08', '2026-11-17'), 'Août 2026');
});

test('D41 : le solde du jour ignore les opérations datées dans le futur', () => {
  const base = nouvelleBase();
  const pm = depot.creerPorteMonnaie(base, { nom: 'Courant', soldeDepart: 10000 });
  const loisirs = depot.listerCategories(base, 'depense').find((c) => c.nom === 'Loisirs').id;
  depot.creerOperation(base, { type: 'depense', montant: 1000, categorieId: loisirs, porteMonnaieId: pm, date: '2026-11-16' });
  depot.creerOperation(base, { type: 'depense', montant: 2500, categorieId: loisirs, porteMonnaieId: pm, date: '2026-11-21' });
  assert.equal(depot.listerPorteMonnaie(base, '2026-11-17')[0].solde, 9000);
  assert.equal(depot.listerPorteMonnaie(base)[0].solde, 6500); // solde prévu
  assert.equal(depot.listerPorteMonnaie(base, '2026-11-21')[0].solde, 6500);
});
