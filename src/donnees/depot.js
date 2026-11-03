// Lectures et écritures métier. Les montants sont en centimes.

export function listerPorteMonnaie(base) {
  return base.lire(
    `SELECT id, nom, solde_depart AS soldeDepart, solde_depart AS solde
     FROM porte_monnaie ORDER BY nom COLLATE NOCASE`
  );
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
