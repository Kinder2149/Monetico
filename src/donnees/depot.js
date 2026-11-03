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
            ), 0) - COALESCE((
              SELECT SUM(pr.montant) FROM pret pr WHERE pr.porte_monnaie_id = p.id
            ), 0) + COALESCE((
              SELECT SUM(r.montant) FROM remboursement r WHERE r.porte_monnaie_id = p.id
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
    `SELECT 1 FROM operation WHERE porte_monnaie_id = ? OR vers_porte_monnaie_id = ?
     UNION SELECT 1 FROM recurrente WHERE porte_monnaie_id = ?
     UNION SELECT 1 FROM pret WHERE porte_monnaie_id = ?
     UNION SELECT 1 FROM remboursement WHERE porte_monnaie_id = ? LIMIT 1`, [id, id, id, id, id]
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
       OR categorie_id IN (SELECT id FROM categorie WHERE parent_id = ?)
     UNION SELECT 1 FROM recurrente WHERE categorie_id = ?
       OR categorie_id IN (SELECT id FROM categorie WHERE parent_id = ?) LIMIT 1`, [id, id, id, id]
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

// --- Budgets (D9) ---

export function listerBudgets(base) {
  const liens = base.lire('SELECT budget_id AS budgetId, categorie_id AS categorieId FROM budget_categorie');
  return base.lire('SELECT id, nom, maximum, jour_depart AS jourDepart FROM budget').sort(parNom)
    .map((b) => ({ ...b, categorieIds: liens.filter((l) => l.budgetId === b.id).map((l) => l.categorieId) }));
}

function lierCategories(base, budgetId, categorieIds) {
  base.ecrire('DELETE FROM budget_categorie WHERE budget_id = ?', [budgetId]);
  for (const id of categorieIds) {
    base.ecrire('INSERT INTO budget_categorie (budget_id, categorie_id) VALUES (?, ?)', [budgetId, id]);
  }
}

export function creerBudget(base, { nom, maximum, jourDepart = 1, categorieIds }) {
  return base.lot(() => {
    const id = base.ecrire('INSERT INTO budget (nom, maximum, jour_depart) VALUES (?, ?, ?)', [nom, maximum, jourDepart]);
    lierCategories(base, id, categorieIds);
    return id;
  });
}

export function modifierBudget(base, id, { nom, maximum, jourDepart, categorieIds }) {
  base.lot(() => {
    base.ecrire('UPDATE budget SET nom = ?, maximum = ?, jour_depart = ? WHERE id = ?', [nom, maximum, jourDepart, id]);
    lierCategories(base, id, categorieIds);
  });
}

export function supprimerBudget(base, id) {
  base.ecrire('DELETE FROM budget WHERE id = ?', [id]);
}

// Dépenses de la période dans les catégories du budget (et leurs sous-catégories), avec `exclue`.
export function depensesDuBudget(base, budgetId, { debut, fin }) {
  return base.lire(
    `SELECT ${CHAMPS_OPERATION},
            EXISTS (SELECT 1 FROM budget_exclusion e WHERE e.budget_id = ? AND e.operation_id = o.id) AS exclue
     ${JOINTURES_OPERATION}
     WHERE o.type = 'depense' AND o.date >= ? AND o.date <= ?
       AND (o.categorie_id IN (SELECT categorie_id FROM budget_categorie WHERE budget_id = ?)
            OR c.parent_id IN (SELECT categorie_id FROM budget_categorie WHERE budget_id = ?))
     ORDER BY o.date DESC, o.id DESC`, [budgetId, debut, fin, budgetId, budgetId]
  ).map((o) => ({ ...o, exclue: o.exclue === 1 }));
}

// Exclut une dépense du calcul d'un budget, ou l'y remet.
export function exclureDuBudget(base, budgetId, operationId, exclue) {
  base.ecrire(exclue
    ? 'INSERT OR IGNORE INTO budget_exclusion (budget_id, operation_id) VALUES (?, ?)'
    : 'DELETE FROM budget_exclusion WHERE budget_id = ? AND operation_id = ?', [budgetId, operationId]);
}

// --- Récurrentes (D10) ---

export function listerRecurrentes(base) {
  return base.lire(
    `SELECT r.id, r.type, r.montant, r.jour, r.note,
            r.categorie_id AS categorieId, c.nom AS categorie, c.icone AS icone, parent.nom AS categorieParent,
            r.porte_monnaie_id AS porteMonnaieId, p.nom AS porteMonnaie
     FROM recurrente r
     JOIN categorie c ON c.id = r.categorie_id
     LEFT JOIN categorie parent ON parent.id = c.parent_id
     JOIN porte_monnaie p ON p.id = r.porte_monnaie_id
     ORDER BY r.jour, c.nom`
  );
}

const valeursRecurrente = ({ type, montant, categorieId, porteMonnaieId, jour, note = '' }) =>
  [type, montant, categorieId, porteMonnaieId, jour, note];

export function creerRecurrente(base, recurrente) {
  return base.ecrire(
    `INSERT INTO recurrente (type, montant, categorie_id, porte_monnaie_id, jour, note)
     VALUES (?, ?, ?, ?, ?, ?)`, valeursRecurrente(recurrente)
  );
}

export function modifierRecurrente(base, id, recurrente) {
  base.ecrire(
    `UPDATE recurrente SET type = ?, montant = ?, categorie_id = ?, porte_monnaie_id = ?, jour = ?, note = ?
     WHERE id = ?`, [...valeursRecurrente(recurrente), id]
  );
}

// Les opérations déjà validées restent dans la liste.
export function supprimerRecurrente(base, id) {
  base.ecrire('DELETE FROM recurrente WHERE id = ?', [id]);
}

// Récurrentes pas encore validées pour le mois `mois` (« AAAA-MM »).
export function recurrentesAValider(base, mois) {
  const validees = new Set(base.lire('SELECT recurrente_id AS id FROM recurrente_validation WHERE mois = ?', [mois]).map((v) => v.id));
  return listerRecurrentes(base).filter((r) => !validees.has(r.id));
}

// Valider = créer l'opération à la date réelle d'encaissement ; c'est seulement là que le solde change.
export function validerRecurrente(base, recurrente, mois, date) {
  return base.lot(() => {
    const operationId = creerOperation(base, {
      type: recurrente.type, montant: recurrente.montant, categorieId: recurrente.categorieId,
      porteMonnaieId: recurrente.porteMonnaieId, date, note: recurrente.note,
    });
    base.ecrire('INSERT INTO recurrente_validation (recurrente_id, mois, operation_id) VALUES (?, ?, ?)',
      [recurrente.id, mois, operationId]);
    return operationId;
  });
}

// --- Prêts (D8, D28) ---

// Prêts avec leurs remboursements et le reste dû ; ceux encore dus d'abord, puis les plus récents.
export function listerPrets(base) {
  const remboursements = base.lire(
    `SELECT r.id, r.pret_id AS pretId, r.montant, r.date, r.porte_monnaie_id AS porteMonnaieId, p.nom AS porteMonnaie
     FROM remboursement r JOIN porte_monnaie p ON p.id = r.porte_monnaie_id
     ORDER BY r.date DESC, r.id DESC`
  );
  return base.lire(
    `SELECT pr.id, pr.personne, pr.montant, pr.date, pr.note, pr.porte_monnaie_id AS porteMonnaieId, p.nom AS porteMonnaie
     FROM pret pr JOIN porte_monnaie p ON p.id = pr.porte_monnaie_id`
  ).map((pr) => {
    const siens = remboursements.filter((r) => r.pretId === pr.id);
    const rembourse = siens.reduce((somme, r) => somme + r.montant, 0);
    return { ...pr, remboursements: siens, rembourse, resteDu: pr.montant - rembourse };
  }).sort((a, b) => (a.resteDu === 0) - (b.resteDu === 0) || b.date.localeCompare(a.date) || b.id - a.id);
}

const valeursPret = ({ personne, montant, date, porteMonnaieId, note = '' }) => [personne, montant, date, porteMonnaieId, note];

export function creerPret(base, pret) {
  return base.ecrire('INSERT INTO pret (personne, montant, date, porte_monnaie_id, note) VALUES (?, ?, ?, ?, ?)', valeursPret(pret));
}

export function modifierPret(base, id, pret) {
  base.ecrire('UPDATE pret SET personne = ?, montant = ?, date = ?, porte_monnaie_id = ?, note = ? WHERE id = ?', [...valeursPret(pret), id]);
}

// Supprime le prêt et ses remboursements : les soldes reviennent comme avant le prêt.
export function supprimerPret(base, id) {
  base.ecrire('DELETE FROM pret WHERE id = ?', [id]);
}

export function ajouterRemboursement(base, pretId, { montant, date, porteMonnaieId }) {
  return base.ecrire('INSERT INTO remboursement (pret_id, montant, date, porte_monnaie_id) VALUES (?, ?, ?, ?)',
    [pretId, montant, date, porteMonnaieId]);
}

export function supprimerRemboursement(base, id) {
  base.ecrire('DELETE FROM remboursement WHERE id = ?', [id]);
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
