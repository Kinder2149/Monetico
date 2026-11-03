// Base de données locale : sql.js, conservée dans le stockage du téléphone (IndexedDB).

// Liste de départ (PROJET_CONTEXTE, section 4.3) : un simple modèle, tout reste modifiable.
const MODELE = {
  depense: {
    'Alimentation': ['Courses', 'Restaurant', 'Fast-food', 'Café/Bar'],
    'Logement': ['Loyer', 'Électricité', 'Eau', 'Internet/Téléphone', 'Assurance'],
    'Transports': ['Transports en commun', 'Carburant', 'Stationnement', 'Entretien'],
    'Santé': [],
    'Shopping': ['Vêtements', 'Maison', 'Électronique', 'Hygiène'],
    'Loisirs': ['Sorties', 'Jeux', 'Sport', 'Vacances'],
    'Abonnements': [],
    'Cadeaux': [],
    'Frais bancaires': [],
    'Divers': [],
  },
  revenu: {
    'Salaire': [], 'Prime': [], 'Remboursement': [], 'Vente': [], 'Cadeau reçu': [], 'Autres': [],
  },
};

function modeleCategories() {
  const texte = (s) => `'${s.replace(/'/g, "''")}'`;
  const lignes = [];
  for (const [type, categories] of Object.entries(MODELE)) {
    for (const [nom, sous] of Object.entries(categories)) {
      lignes.push(`INSERT INTO categorie (nom, type) VALUES (${texte(nom)}, '${type}');`);
      for (const s of sous) {
        lignes.push(`INSERT INTO categorie (nom, type, parent_id) VALUES (${texte(s)}, '${type}', (SELECT MAX(id) FROM categorie WHERE parent_id IS NULL));`);
      }
    }
  }
  return lignes.join('\n');
}

// Icônes de départ des catégories du modèle (noms du catalogue de src/ui/Icones.jsx).
const ICONES_MODELE = {
  'Alimentation': 'utensils', 'Courses': 'shopping-cart', 'Restaurant': 'utensils', 'Fast-food': 'sandwich',
  'Café/Bar': 'coffee', 'Logement': 'house', 'Loyer': 'house', 'Électricité': 'zap', 'Eau': 'droplet',
  'Internet/Téléphone': 'wifi', 'Assurance': 'shield', 'Transports': 'car',
  'Transports en commun': 'bus', 'Carburant': 'fuel', 'Stationnement': 'parking', 'Entretien': 'wrench',
  'Santé': 'heart-pulse', 'Shopping': 'shopping-bag', 'Vêtements': 'shirt', 'Maison': 'sofa',
  'Électronique': 'smartphone', 'Hygiène': 'sparkles', 'Loisirs': 'party', 'Sorties': 'ticket',
  'Jeux': 'gamepad', 'Sport': 'dumbbell', 'Vacances': 'plane', 'Abonnements': 'repeat',
  'Cadeaux': 'gift', 'Frais bancaires': 'landmark', 'Divers': 'ellipsis', 'Salaire': 'briefcase',
  'Prime': 'trophy', 'Remboursement': 'rotate-ccw', 'Vente': 'tag', 'Cadeau reçu': 'hand-heart',
  'Autres': 'ellipsis',
};

function iconesParDefaut() {
  return Object.entries(ICONES_MODELE)
    .map(([nom, icone]) => `UPDATE categorie SET icone = '${icone}' WHERE nom = '${nom}' AND icone IS NULL;`)
    .join('\n');
}

const MIGRATIONS = [
  `CREATE TABLE porte_monnaie (
     id INTEGER PRIMARY KEY,
     nom TEXT NOT NULL,
     solde_depart INTEGER NOT NULL DEFAULT 0
   )`,
  `CREATE TABLE categorie (
     id INTEGER PRIMARY KEY,
     nom TEXT NOT NULL,
     type TEXT NOT NULL CHECK (type IN ('depense', 'revenu')),
     parent_id INTEGER REFERENCES categorie(id) ON DELETE CASCADE,
     icone TEXT
   );
   ${modeleCategories()}`,
  iconesParDefaut(),
  // Montant toujours positif ; le type dit s'il entre ou sort. Date au format AAAA-MM-JJ.
  `CREATE TABLE operation (
     id INTEGER PRIMARY KEY,
     type TEXT NOT NULL,
     montant INTEGER NOT NULL CHECK (montant > 0),
     categorie_id INTEGER REFERENCES categorie(id) ON DELETE RESTRICT,
     porte_monnaie_id INTEGER NOT NULL REFERENCES porte_monnaie(id) ON DELETE RESTRICT,
     date TEXT NOT NULL,
     note TEXT NOT NULL DEFAULT ''
   );
   CREATE INDEX operation_date ON operation (date)`,
  // Transfert : l'argent sort de porte_monnaie_id et entre dans vers_porte_monnaie_id.
  `ALTER TABLE operation ADD COLUMN vers_porte_monnaie_id INTEGER REFERENCES porte_monnaie(id) ON DELETE RESTRICT`,
  // Budgets (D9) : catégories suivies (une catégorie cochée inclut ses sous-catégories) et dépenses exclues.
  `CREATE TABLE budget (
     id INTEGER PRIMARY KEY,
     nom TEXT NOT NULL,
     maximum INTEGER NOT NULL CHECK (maximum > 0),
     jour_depart INTEGER NOT NULL DEFAULT 1 CHECK (jour_depart BETWEEN 1 AND 31)
   );
   CREATE TABLE budget_categorie (
     budget_id INTEGER NOT NULL REFERENCES budget(id) ON DELETE CASCADE,
     categorie_id INTEGER NOT NULL REFERENCES categorie(id) ON DELETE CASCADE,
     PRIMARY KEY (budget_id, categorie_id)
   );
   CREATE TABLE budget_exclusion (
     budget_id INTEGER NOT NULL REFERENCES budget(id) ON DELETE CASCADE,
     operation_id INTEGER NOT NULL REFERENCES operation(id) ON DELETE CASCADE,
     PRIMARY KEY (budget_id, operation_id)
   )`,
  // Récurrentes (D10) : une par opération mensuelle ; chaque mois validé garde l'opération créée.
  // Supprimer cette opération remet le mois « À valider ».
  `CREATE TABLE recurrente (
     id INTEGER PRIMARY KEY,
     type TEXT NOT NULL CHECK (type IN ('depense', 'revenu')),
     montant INTEGER NOT NULL CHECK (montant > 0),
     categorie_id INTEGER NOT NULL REFERENCES categorie(id) ON DELETE RESTRICT,
     porte_monnaie_id INTEGER NOT NULL REFERENCES porte_monnaie(id) ON DELETE RESTRICT,
     jour INTEGER NOT NULL CHECK (jour BETWEEN 1 AND 31),
     note TEXT NOT NULL DEFAULT ''
   );
   CREATE TABLE recurrente_validation (
     recurrente_id INTEGER NOT NULL REFERENCES recurrente(id) ON DELETE CASCADE,
     mois TEXT NOT NULL,
     operation_id INTEGER NOT NULL REFERENCES operation(id) ON DELETE CASCADE,
     PRIMARY KEY (recurrente_id, mois)
   )`,
];

export function migrer(db) {
  const version = db.exec('PRAGMA user_version')[0].values[0][0];
  for (let i = version; i < MIGRATIONS.length; i++) {
    db.run(MIGRATIONS[i]);
    db.run(`PRAGMA user_version = ${i + 1}`);
  }
}

// Enveloppe la base sql.js ; `enregistrer` reçoit le contenu complet après chaque modification.
export function creerBase(db, enregistrer = () => {}) {
  db.run('PRAGMA foreign_keys = ON');
  migrer(db);
  let enLot = false;
  return {
    // Exécute `faire` en une seule fois (tout ou rien), avec un seul enregistrement à la fin.
    lot(faire) {
      enLot = true;
      db.run('BEGIN');
      try {
        const resultat = faire();
        db.run('COMMIT');
        enLot = false;
        enregistrer(db.export());
        return resultat;
      } catch (erreur) {
        db.run('ROLLBACK');
        enLot = false;
        throw erreur;
      }
    },
    lire(sql, params = []) {
      const requete = db.prepare(sql);
      requete.bind(params);
      const lignes = [];
      while (requete.step()) lignes.push(requete.getAsObject());
      requete.free();
      return lignes;
    },
    ecrire(sql, params = []) {
      db.run(sql, params);
      const id = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
      if (!enLot) enregistrer(db.export());
      return id;
    },
  };
}

// --- Stockage dans le téléphone ---

const NOM_STOCKAGE = 'moneta';
const CLE = 'base';

let stockageOuvert;

function ouvrirStockage() {
  return stockageOuvert ??= new Promise((resoudre, rejeter) => {
    const demande = indexedDB.open(NOM_STOCKAGE, 1);
    demande.onupgradeneeded = () => demande.result.createObjectStore('fichiers');
    demande.onsuccess = () => resoudre(demande.result);
    demande.onerror = () => rejeter(demande.error);
  });
}

async function lireStockage() {
  const stockage = await ouvrirStockage();
  return new Promise((resoudre, rejeter) => {
    const demande = stockage.transaction('fichiers').objectStore('fichiers').get(CLE);
    demande.onsuccess = () => resoudre(demande.result);
    demande.onerror = () => rejeter(demande.error);
  });
}

async function ecrireStockage(contenu) {
  const stockage = await ouvrirStockage();
  stockage.transaction('fichiers', 'readwrite').objectStore('fichiers').put(contenu, CLE);
}

// Ouvre la base enregistrée sur l'appareil (ou une base neuve la première fois).
export async function ouvrirBase(initSqlJs, urlWasm) {
  const SQL = await initSqlJs({ locateFile: () => urlWasm });
  const contenu = await lireStockage();
  const db = new SQL.Database(contenu);
  return creerBase(db, ecrireStockage);
}
