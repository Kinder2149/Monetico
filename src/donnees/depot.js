// Lectures et écritures métier. Les montants sont en centimes.

// Tri alphabétique français (accents compris : « Électricité » avant « Internet »).
const parNom = (a, b) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' });

export function listerPorteMonnaie(base) {
  return base.lire(
    `SELECT p.id, p.nom, p.solde_depart AS soldeDepart,
            p.solde_depart + COALESCE((
              SELECT SUM(CASE o.type WHEN 'revenu' THEN o.montant ELSE -o.montant END)
              FROM operation o WHERE o.porte_monnaie_id = p.id
            ), 0) + COALESCE((
              SELECT SUM(o.montant) FROM operation o WHERE o.vers_porte_monnaie_id = p.id
            ), 0) AS solde
     FROM porte_monnaie p`
  ).sort(parNom);
}

export function creerPorteMonnaie(base, { nom, soldeDepart }) {
  return base.ecrire('INSERT INTO porte_monnaie (nom, solde_depart) VALUES (?, ?)', [nom, soldeDepart]);
}

export function modifierPorteMonnaie(base, id, { nom, soldeDepart }) {
  base.ecrire('UPDATE porte_monnaie SET nom = ?, solde_depart = ? WHERE id = ?', [nom, soldeDepart, id]);
}

// Un porte-monnaie qui contient des opérations ne peut pas être supprimé (D22).
export function porteMonnaieUtilise(base, id) {
  return base.lire(
    'SELECT 1 FROM operation WHERE porte_monnaie_id = ? OR vers_porte_monnaie_id = ? LIMIT 1', [id, id]
  ).length > 0;
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

export function creerCategorie(base, { nom, type, parentId = null, icone = null }) {
  return base.ecrire('INSERT INTO categorie (nom, type, parent_id, icone) VALUES (?, ?, ?, ?)', [nom, type, parentId, icone]);
}

export function modifierCategorie(base, id, { nom, icone }) {
  base.ecrire('UPDATE categorie SET nom = ?, icone = ? WHERE id = ?', [nom, icone, id]);
}

// Une catégorie utilisée par des opérations (elle ou une de ses sous-catégories) ne peut pas être supprimée (D22).
export function categorieUtilisee(base, id) {
  return base.lire(
    `SELECT 1 FROM operation WHERE categorie_id = ?
       OR categorie_id IN (SELECT id FROM categorie WHERE parent_id = ?) LIMIT 1`, [id, id]
  ).length > 0;
}

// Supprime la catégorie et ses sous-catégories.
export function supprimerCategorie(base, id) {
  base.ecrire('DELETE FROM categorie WHERE id = ?', [id]);
}

// --- Opérations ---

const CHAMPS_OPERATION = `
  o.id, o.type, o.montant, o.date, o.note,
  o.porte_monnaie_id AS porteMonnaieId, p.nom AS porteMonnaie,
  o.vers_porte_monnaie_id AS versPorteMonnaieId, vers.nom AS versPorteMonnaie,
  o.categorie_id AS categorieId, c.nom AS categorie, c.icone AS icone, parent.nom AS categorieParent`;

const JOINTURES_OPERATION = `
  FROM operation o
  JOIN porte_monnaie p ON p.id = o.porte_monnaie_id
  LEFT JOIN porte_monnaie vers ON vers.id = o.vers_porte_monnaie_id
  LEFT JOIN categorie c ON c.id = o.categorie_id
  LEFT JOIN categorie parent ON parent.id = c.parent_id`;

// type : 'depense', 'revenu' ou 'transfert' (sans catégorie, avec un porte-monnaie d'arrivée).
function valeursOperation({ type, montant, categorieId = null, porteMonnaieId, versPorteMonnaieId = null, date, note = '' }) {
  const transfert = type === 'transfert';
  return [type, montant, transfert ? null : categorieId, porteMonnaieId, transfert ? versPorteMonnaieId : null, date, note];
}

export function creerOperation(base, operation) {
  return base.ecrire(
    `INSERT INTO operation (type, montant, categorie_id, porte_monnaie_id, vers_porte_monnaie_id, date, note)
     VALUES (?, ?, ?, ?, ?, ?, ?)`, valeursOperation(operation)
  );
}

export function modifierOperation(base, id, operation) {
  base.ecrire(
    `UPDATE operation SET type = ?, montant = ?, categorie_id = ?, porte_monnaie_id = ?,
       vers_porte_monnaie_id = ?, date = ?, note = ?
     WHERE id = ?`, [...valeursOperation(operation), id]
  );
}

export function supprimerOperation(base, id) {
  base.ecrire('DELETE FROM operation WHERE id = ?', [id]);
}

// --- Import (D26) ---

// « Fast Food » et « Fast-food », « Électricité » et « electricite » désignent la même chose.
const cleNom = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Importe des opérations { type, montant, categorie, porteMonnaie, date, note } en une seule fois.
// Porte-monnaie et catégories sont retrouvés par leur nom, ou créés. Une opération déjà présente
// n'est pas ajoutée une seconde fois (les doubles réels du fichier sont gardés).
export function importerOperations(base, operations) {
  return base.lot(() => {
    const resume = { operations: 0, dejaPresentes: 0, porteMonnaieCrees: 0, categoriesCreees: 0, porteMonnaie: new Set() };
    const porteMonnaie = new Map(base.lire('SELECT id, nom FROM porte_monnaie').map((p) => [cleNom(p.nom), p.id]));
    const categories = new Map(base.lire('SELECT id, nom, type FROM categorie').map((c) => [c.type + cleNom(c.nom), c.id]));

    function idPorteMonnaie(nom) {
      if (!porteMonnaie.has(cleNom(nom))) {
        porteMonnaie.set(cleNom(nom), creerPorteMonnaie(base, { nom, soldeDepart: 0 }));
        resume.porteMonnaieCrees++;
      }
      return porteMonnaie.get(cleNom(nom));
    }

    function idCategorie(nom, type) {
      if (!categories.has(type + cleNom(nom))) {
        categories.set(type + cleNom(nom), creerCategorie(base, { nom, type }));
        resume.categoriesCreees++;
      }
      return categories.get(type + cleNom(nom));
    }

    // Nombre d'opérations déjà en base pour chaque contenu identique.
    const signature = (o) => [o.type, o.montant, o.categorieId, o.porteMonnaieId, o.date, o.note].join('|');
    const presentes = new Map();
    for (const o of base.lire(`SELECT type, montant, categorie_id AS categorieId, porte_monnaie_id AS porteMonnaieId, date, note
                               FROM operation WHERE type != 'transfert'`)) {
      presentes.set(signature(o), (presentes.get(signature(o)) ?? 0) + 1);
    }

    for (const o of operations) {
      const valeurs = {
        type: o.type, montant: o.montant, date: o.date, note: o.note,
        porteMonnaieId: idPorteMonnaie(o.porteMonnaie),
        categorieId: idCategorie(o.categorie, o.type),
      };
      resume.porteMonnaie.add(valeurs.porteMonnaieId);
      const s = signature(valeurs);
      if (presentes.get(s) > 0) {
        presentes.set(s, presentes.get(s) - 1);
        resume.dejaPresentes++;
      } else {
        creerOperation(base, valeurs);
        resume.operations++;
      }
    }
    return { ...resume, porteMonnaie: resume.porteMonnaie.size };
  });
}

// Opérations les plus récentes d'abord ; filtres facultatifs : porte-monnaie, période.
export function listerOperations(base, { porteMonnaieId = null, debut = null, fin = null } = {}) {
  const conditions = [];
  const params = [];
  if (porteMonnaieId !== null) {
    conditions.push('(o.porte_monnaie_id = ? OR o.vers_porte_monnaie_id = ?)');
    params.push(porteMonnaieId, porteMonnaieId);
  }
  if (debut) { conditions.push('o.date >= ?'); params.push(debut); }
  if (fin) { conditions.push('o.date <= ?'); params.push(fin); }
  const ou = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return base.lire(`SELECT ${CHAMPS_OPERATION} ${JOINTURES_OPERATION} ${ou} ORDER BY o.date DESC, o.id DESC`, params);
}
