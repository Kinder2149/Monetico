import { test } from 'node:test';
import assert from 'node:assert/strict';
import initSqlJs from 'sql.js';
import { creerBase } from '../src/donnees/base.js';
import * as depot from '../src/donnees/depot.js';
import { lireExportMoneyLover } from '../src/logique/importMoneyLover.js';
import { DESSINS } from '../src/ui/dessins.js';

const SQL = await initSqlJs();

// Les 49 catégories de l'export Money Lover du 2026-11-16 (D43) : dépenses puis revenus.
const DEPENSES = ['Abonnement', 'Accessoires', 'Alimentation', 'Amis & conjoint', 'Assurances', 'Autres dépenses', 'Banque', 'Bar',
  'Boulangerie', 'Bureau de tabac', 'Cadeau', 'Café', 'Chaussures', 'Cinéma', 'Courses', 'En Attente', 'Essence',
  "Facture d'électricité", 'Facture de téléphone', 'Factures', 'Famille', 'Fast Food', 'Frais & charges', 'Frais de stationnement',
  'Hygiène', 'Jeux', 'Locations', 'Loisirs', 'Maison', 'Restaurants', 'Retrait', 'Retrait B', 'Santé', 'Shopping', 'Soirée', 'Sports',
  'Taxi', 'Transports', 'Vacances', 'Vehicle Maintenance', 'Visite médicale', 'Vêtements', 'Électronique & électroménager'];
const REVENUS = ['Autres revenus', 'Cadeaux', 'Prime', 'Remboursement', 'Salaire', 'Vente'];

function fichier() {
  const lignes = ['ID,Note,Amount,Category,Account,Currency,Date,Event,Exclude Report'];
  [...DEPENSES.map((c) => [c, -10]), ...REVENUS.map((c) => [c, 10])].forEach(([c, m], i) => {
    lignes.push(`${i + 1},,${m},${/[,"]/.test(c) ? `"${c}"` : c},Compte,EUR,02/11/2026,,False`);
  });
  return '﻿' + lignes.join('\n') + '\n';
}

function importer() {
  const base = creerBase(new SQL.Database(), () => {});
  const { operations } = lireExportMoneyLover(fichier(), '2026-11-17');
  const resume = depot.importerOperations(base, operations);
  return { base, resume, operations };
}

test('D43 : chaque catégorie Money Lover est rangée sous le bon parent, avec une icône', () => {
  const { base, resume } = importer();
  assert.equal(resume.operations, 49);
  const arbre = Object.fromEntries(depot.listerCategories(base, 'depense').map((c) => [c.nom, c.sous.map((s) => s.nom)]));
  for (const nom of ['Bar', 'Boulangerie', 'Café', 'Courses', 'Fast-food', 'Restaurant']) assert.ok(arbre.Alimentation.includes(nom), nom);
  for (const nom of ['Locations', 'Maison', 'Factures', 'Électricité', 'Facture de téléphone']) assert.ok(arbre.Logement.includes(nom), nom);
  for (const nom of ['Carburant', 'Stationnement', 'Entretien', 'Taxi']) assert.ok(arbre.Transports.includes(nom), nom);
  assert.ok(arbre.Santé.includes('Visite médicale'));
  for (const nom of ['Vêtements', 'Chaussures', 'Accessoires', 'Électronique', 'Hygiène']) assert.ok(arbre.Shopping.includes(nom), nom);
  for (const nom of ['Jeux', 'Cinéma', 'Soirée', 'Sport', 'Vacances', 'Amis & conjoint']) assert.ok(arbre.Loisirs.includes(nom), nom);
  assert.deepEqual([...arbre.Banque].sort(), ['Frais & charges', 'Retraits']);
  for (const nom of ['Autres dépenses', 'En Attente', 'Famille']) assert.ok(arbre.Divers.includes(nom), nom);
  for (const nom of ['Assurances', 'Banque', 'Bureau de tabac', 'Abonnements', 'Cadeaux']) assert.ok(nom in arbre, nom);
  // L'opération « Maison » de Money Lover va sous Logement, pas sous la sous-catégorie Maison de Shopping (D43).
  const maison = depot.listerOperations(base).find((o) => o.categorie === 'Maison' && o.montant === 1000);
  assert.equal(maison.categorieParent, 'Logement');
  const revenus = depot.listerCategories(base, 'revenu').map((c) => c.nom);
  for (const nom of ['Salaire', 'Prime', 'Remboursement', 'Vente', 'Cadeau reçu', 'Autres']) assert.ok(revenus.includes(nom), nom);
  assert.ok(!revenus.includes('Autres revenus') && !revenus.includes('Cadeaux'));
});

test('D43 : aucune catégorie sans icône, et toutes les icônes ont un dessin', () => {
  const { base } = importer();
  const toutes = ['depense', 'revenu'].flatMap((t) => depot.listerCategories(base, t).flatMap((c) => [c, ...c.sous]));
  // Seules les catégories du modèle de départ jamais utilisées peuvent ne pas avoir d'icône ; celles de l'import en ont une.
  const utilisees = new Set(base.lire('SELECT DISTINCT categorie_id AS id FROM operation').map((r) => r.id));
  for (const c of toutes.filter((x) => utilisees.has(x.id))) {
    assert.ok(c.icone, `${c.nom} sans icône`);
    assert.ok(DESSINS[c.icone], `${c.nom} : dessin « ${c.icone} » absent`);
  }
});

test('D43 : réimporter ne crée rien de plus et les catégories ne sont pas dupliquées', () => {
  const { base, operations } = importer();
  const avant = base.lire('SELECT COUNT(*) AS n FROM categorie')[0].n;
  const resume = depot.importerOperations(base, operations);
  assert.equal(resume.operations, 0);
  assert.equal(resume.categoriesCreees, 0);
  assert.equal(base.lire('SELECT COUNT(*) AS n FROM categorie')[0].n, avant);
});
