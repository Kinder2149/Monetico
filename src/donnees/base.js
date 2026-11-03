// Base de données locale : sql.js, conservée dans le stockage du téléphone (IndexedDB).

const MIGRATIONS = [
  `CREATE TABLE porte_monnaie (
     id INTEGER PRIMARY KEY,
     nom TEXT NOT NULL,
     solde_depart INTEGER NOT NULL DEFAULT 0
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
  migrer(db);
  return {
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
      enregistrer(db.export());
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
