// Lectures et écritures métier. Les montants sont en centimes.

// Tri alphabétique français (accents compris : « Électricité » avant « Internet »).
const parNom = (a, b) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' });

export function listerPorteMonnaie(base) {
  return base.lire(
    `SELECT id, nom, solde_depart AS soldeDepart, solde_depart AS solde FROM porte_monnaie`
  ).sort(parNom);
}

export function creerPorteMonnaie(base, { nom, soldeDepart }) {
  return base.ecrire('INSERT INTO porte_monnaie (nom, solde_depart) VALUES (?, ?)', [nom, soldeDepart]);
}

export function modifierPorteMonnaie(base, id, { nom, soldeDepart }) {
  base.ecrire('UPDATE porte_monnaie SET nom = ?, solde_depart = ? WHERE id = ?', [nom, soldeDepart, id]);
}

export function supprimerPorteMonnaie(base, id) {
  base.ecrire('DELETE FROM porte_monnaie WHERE id = ?', [id]);
}

// Catégories d'un type ('depense' ou 'revenu'), chacune avec ses sous-catégories.
export function listerCategories(base, type) {
  const toutes = base.lire(
    `SELECT id, nom, type, parent_id AS parentId, icone FROM categorie
     WHERE type = ?`, [type]
  ).sort(parNom);
  return toutes
    .filter((c) => c.parentId === null)
    .map((c) => ({ ...c, sous: toutes.filter((s) => s.parentId === c.id) }));
}

export function creerCategorie(base, { nom, type, parentId = null }) {
  return base.ecrire('INSERT INTO categorie (nom, type, parent_id) VALUES (?, ?, ?)', [nom, type, parentId]);
}

export function renommerCategorie(base, id, nom) {
  base.ecrire('UPDATE categorie SET nom = ? WHERE id = ?', [nom, id]);
}

// Supprime la catégorie et ses sous-catégories.
export function supprimerCategorie(base, id) {
  base.ecrire('DELETE FROM categorie WHERE id = ?', [id]);
}
