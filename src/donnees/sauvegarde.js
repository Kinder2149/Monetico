// Sauvegarde dans le Google Drive de l'utilisateur (D13, étape 14), restauration comprise (D31).
// La connexion passe par le pont Android « GoogleDrive » (D33) ; le fichier est envoyé
// directement au Drive, jamais à un serveur de l'éditeur.
import { Capacitor, registerPlugin } from '@capacitor/core';
import { remplacerStockage } from './base.js';

const pont = registerPlugin('GoogleDrive');
const NOM_FICHIER = 'Moneta - sauvegarde.sqlite';
const API = 'https://www.googleapis.com';
const CLE_ETAT = 'moneta-sauvegarde';
const DELAI_ENVOI = 2000; // regroupe les modifications rapprochées en un seul envoi

// Disponible seulement dans l'appli Android (pas dans l'aperçu du navigateur).
export const disponible = Capacitor.isNativePlatform();

// connecte, fichierId, derniere (moment du dernier envoi réussi), enAttente
let etat = { connecte: false, fichierId: null, derniere: null, enAttente: false };
try { etat = { ...etat, ...JSON.parse(localStorage.getItem(CLE_ETAT)) }; } catch { /* état neuf */ }

let base = null;
let minuterie = null;
let envoiEnCours = false;
const abonnes = new Set();

function changer(modif) {
  etat = { ...etat, ...modif };
  try { localStorage.setItem(CLE_ETAT, JSON.stringify(etat)); } catch { /* sans effet sur les données */ }
  abonnes.forEach((f) => f(etat));
}

export const lireEtat = () => etat;

export function abonner(f) {
  abonnes.add(f);
  return () => abonnes.delete(f);
}

async function jeton(interactif = false) {
  const { jeton } = await pont.autoriser({ interactif });
  return jeton;
}

async function appeler(chemin, options = {}, acces) {
  const reponse = await fetch(API + chemin, {
    ...options,
    headers: { Authorization: `Bearer ${acces}`, ...options.headers },
  });
  if (!reponse.ok) {
    const erreur = new Error(`Drive : ${reponse.status}`);
    erreur.statut = reponse.status;
    throw erreur;
  }
  return reponse;
}

// Dernière sauvegarde Moneta présente dans le Drive : { id, date } ou null.
async function chercher(acces) {
  const q = encodeURIComponent(`name = '${NOM_FICHIER}' and trashed = false`);
  const reponse = await appeler(
    `/drive/v3/files?q=${q}&orderBy=modifiedTime desc&pageSize=1&fields=files(id,modifiedTime)`, {}, acces
  );
  const [fichier] = (await reponse.json()).files;
  return fichier ? { id: fichier.id, date: Date.parse(fichier.modifiedTime) } : null;
}

async function televerser(acces, contenu) {
  const corps = new Blob([contenu], { type: 'application/x-sqlite3' });
  if (etat.fichierId) {
    try {
      await appeler(`/upload/drive/v3/files/${etat.fichierId}?uploadType=media`, { method: 'PATCH', body: corps }, acces);
      return etat.fichierId;
    } catch (erreur) {
      if (erreur.statut !== 404) throw erreur; // fichier supprimé du Drive : on en recrée un
    }
  }
  const formulaire = new FormData();
  formulaire.append('metadata', new Blob([JSON.stringify({ name: NOM_FICHIER })], { type: 'application/json' }));
  formulaire.append('file', corps);
  const reponse = await appeler('/upload/drive/v3/files?uploadType=multipart&fields=id', { method: 'POST', body: formulaire }, acces);
  return (await reponse.json()).id;
}

// Envoie l'état actuel de la base ; en cas d'échec (hors connexion…), la modification reste « en attente ».
async function envoyer() {
  clearTimeout(minuterie);
  if (!etat.connecte || !etat.enAttente || envoiEnCours || !base) return;
  if (!navigator.onLine) return;
  envoiEnCours = true;
  try {
    const fichierId = await televerser(await jeton(), base.exporter());
    changer({ fichierId, derniere: Date.now(), enAttente: false });
  } catch {
    // Nouvel essai au retour du réseau, au retour dans l'appli ou à la prochaine modification.
  } finally {
    envoiEnCours = false;
  }
}

// Appelé à chaque modification des données (voir ouvrirBase).
export function signalerModification() {
  if (!etat.connecte) return;
  changer({ enAttente: true });
  clearTimeout(minuterie);
  minuterie = setTimeout(envoyer, DELAI_ENVOI);
}

// Branche la sauvegarde sur la base ouverte et relance un envoi resté en attente.
export function demarrer(baseOuverte) {
  base = baseOuverte;
  if (!disponible) return;
  window.addEventListener('online', envoyer);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) envoyer(); });
  envoyer();
}

// Étape 1 de la connexion : choix du compte Google, puis recherche d'une sauvegarde existante.
// Rien n'est encore enregistré : l'écran demande d'abord quoi faire (critères 14.5 et 14.6).
export async function connecter() {
  const acces = await jeton(true);
  return { sauvegarde: await chercher(acces) };
}

// Étape 2 : garder les données du téléphone ; elles remplacent la sauvegarde éventuelle du Drive.
export function garderCeTelephone(sauvegarde) {
  changer({ connecte: true, fichierId: sauvegarde?.id ?? null, enAttente: true });
  return envoyer();
}

// Sauvegarde du Drive à proposer depuis Réglages (critère 14.7).
export async function sauvegardeDuDrive() {
  return chercher(await jeton(true));
}

// Remplace les données du téléphone par la sauvegarde du Drive, puis relance l'appli.
export async function restaurer(sauvegarde) {
  const acces = await jeton(true);
  const reponse = await appeler(`/drive/v3/files/${sauvegarde.id}?alt=media`, {}, acces);
  const contenu = new Uint8Array(await reponse.arrayBuffer());
  // Un fichier de base de données commence toujours par « SQLite format 3 ».
  if (new TextDecoder().decode(contenu.slice(0, 15)) !== 'SQLite format 3') {
    throw new Error("Le fichier du Drive n'est pas une sauvegarde Moneta lisible.");
  }
  clearTimeout(minuterie);
  await remplacerStockage(contenu);
  changer({ connecte: true, fichierId: sauvegarde.id, derniere: sauvegarde.date, enAttente: false });
  window.location.reload();
}
