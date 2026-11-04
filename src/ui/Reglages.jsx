import { useEffect, useState } from 'react';
import { Feuille } from './Commun.jsx';
import { contientDonnees, importerOperations } from '../donnees/depot.js';
import * as sauvegarde from '../donnees/sauvegarde.js';
import { lireExportMoneyLover } from '../logique/importMoneyLover.js';
import { libelleDateHeure, libelleSauvegarde } from '../logique/dates.js';
import { version } from '../../package.json';

// Espace fine des milliers (quasi invisible en Manrope) remplacée par une espace insécable, comme pour les montants.
const pluriel = (n, mot) => `${n.toLocaleString('fr-FR').replace(/ /g, ' ')} ${mot}${n > 1 ? 's' : ''}`;

// Résultat de l'import Money Lover (D26).
function ResumeImport({ resultat, fermer }) {
  if (resultat.erreur) {
    return (
      <Feuille titre="Import impossible" fermer={fermer}>
        <p className="texte-2">{resultat.erreur}</p>
        <button className="bouton" onClick={fermer}>Compris</button>
      </Feuille>
    );
  }
  return (
    <Feuille titre="Import terminé" fermer={fermer}>
      <ul className="resume-import">
        <li>{pluriel(resultat.operations, 'opération')} importée{resultat.operations > 1 ? 's' : ''}</li>
        <li>{pluriel(resultat.porteMonnaie, 'porte-monnaie')}{resultat.porteMonnaieCrees > 0 ? ` (dont ${resultat.porteMonnaieCrees} créé${resultat.porteMonnaieCrees > 1 ? 's' : ''})` : ''}</li>
        <li>{pluriel(resultat.categoriesCreees, 'catégorie')} créée{resultat.categoriesCreees > 1 ? 's' : ''}</li>
        {resultat.dejaPresentes > 0 && <li>{pluriel(resultat.dejaPresentes, 'opération')} déjà présente{resultat.dejaPresentes > 1 ? 's' : ''}, non ajoutée{resultat.dejaPresentes > 1 ? 's' : ''}</li>}
        {resultat.aVenir > 0 && <li>{pluriel(resultat.aVenir, 'opération')} à venir, non importée{resultat.aVenir > 1 ? 's' : ''}</li>}
      </ul>
      <button className="bouton" onClick={fermer}>Compris</button>
    </Feuille>
  );
}

// Choix proposé quand une sauvegarde existe déjà dans le Drive (critères 14.5 et 14.6).
// `connexion` : on vient de se connecter (on peut aussi garder les données du téléphone).
function ChoixRestauration({ trouvee, connexion, telephoneRempli, fermer, agir }) {
  const date = libelleDateHeure(trouvee.date);
  return (
    <Feuille titre={`Restaurer la sauvegarde du ${date} ?`} fermer={fermer}>
      <p className="texte-2">
        {telephoneRempli
          ? 'Les données actuelles de ce téléphone seront remplacées par celles de la sauvegarde.'
          : "Porte-monnaie, opérations, catégories, budgets, récurrentes et prêts reviendront tels qu'ils étaient sauvegardés."}
      </p>
      <button className={'bouton' + (telephoneRempli ? ' danger' : '')} onClick={() => agir('restaurer')}>
        {telephoneRempli ? 'Restaurer et remplacer ce téléphone' : 'Restaurer'}
      </button>
      {connexion && telephoneRempli && (
        <>
          <p className="texte-2 choix-sauvegarde">Ou garder les données de ce téléphone : elles remplaceront la sauvegarde du Drive.</p>
          <button className="bouton secondaire" onClick={() => agir('garder')}>Garder ce téléphone</button>
        </>
      )}
      <button className="bouton secondaire choix-sauvegarde" onClick={fermer}>Annuler</button>
    </Feuille>
  );
}

// Partie Sauvegarde de Réglages : connexion Google, état de l'envoi, restauration (étape 14).
function Sauvegarde({ base }) {
  const [etat, setEtat] = useState(sauvegarde.lireEtat);
  const [, setHorloge] = useState(0);
  const [choix, setChoix] = useState(null); // { trouvee, connexion }
  const [message, setMessage] = useState(null);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => sauvegarde.abonner(setEtat), []);
  // « il y a 2 min » avance tout seul tant que l'écran est ouvert.
  useEffect(() => {
    const minuterie = setInterval(() => setHorloge((h) => h + 1), 30_000);
    return () => clearInterval(minuterie);
  }, []);

  if (!sauvegarde.disponible) {
    return <p className="texte-2 carte">La sauvegarde Google Drive est disponible dans l'appli Android.</p>;
  }

  async function occuper(faire) {
    setEnCours(true);
    setMessage(null);
    try {
      await faire();
    } catch (erreur) {
      setMessage(erreur.code === 'annule' ? null : `La connexion au Drive a échoué. Vérifie le réseau et réessaie. (${erreur.message})`);
    } finally {
      setEnCours(false);
    }
  }

  const seConnecter = () => occuper(async () => {
    const { sauvegarde: trouvee } = await sauvegarde.connecter();
    if (trouvee) setChoix({ trouvee, connexion: true });
    else await sauvegarde.garderCeTelephone(null);
  });

  const chercherPourRestaurer = () => occuper(async () => {
    const trouvee = await sauvegarde.sauvegardeDuDrive();
    if (trouvee) setChoix({ trouvee, connexion: false });
    else setMessage("Aucune sauvegarde Moneta dans ton Drive pour l'instant.");
  });

  const agir = (action) => {
    const { trouvee } = choix;
    setChoix(null);
    occuper(() => (action === 'restaurer' ? sauvegarde.restaurer(trouvee) : sauvegarde.garderCeTelephone(trouvee)));
  };

  let statut;
  if (etat.enAttente) statut = navigator.onLine ? 'Envoi en cours…' : 'En attente du réseau';
  else if (etat.derniere) statut = libelleSauvegarde(etat.derniere);
  else statut = '—';

  return (
    <>
      {!etat.connecte ? (
        <div className="carte">
          <p className="texte-2 intro-sauvegarde">
            Tes données restent sur ce téléphone. Connecte-toi à Google pour les sauvegarder automatiquement dans ton Drive.
          </p>
          <button className={'bouton' + (enCours ? ' occupe' : '')} disabled={enCours} onClick={seConnecter}>
            {enCours ? 'Connexion…' : 'Se connecter à Google'}
          </button>
        </div>
      ) : (
        <>
          <div className="carte ligne lien">
            <span className="ligne-nom">Dernière sauvegarde</span>
            <span className={etat.enAttente ? 'texte-2' : 'statut-sauvegarde'}>{statut}</span>
          </div>
          <button className={'carte ligne lien bouton-ligne' + (enCours ? ' occupe' : '')} disabled={enCours}
            onClick={chercherPourRestaurer}>
            <span className="ligne-nom">{enCours ? 'Recherche…' : 'Restaurer depuis le Drive'}</span>
            <span aria-hidden="true">›</span>
          </button>
        </>
      )}
      {message && <p className="message message-sauvegarde">{message}</p>}
      {choix && (
        <ChoixRestauration trouvee={choix.trouvee} connexion={choix.connexion} telephoneRempli={contientDonnees(base)}
          fermer={() => setChoix(null)} agir={agir} />
      )}
    </>
  );
}

// Écran Réglages (roue dentée de l'onglet Comptes, D27) : import Money Lover, sauvegarde et version de l'appli.
export default function Reglages({ base, rafraichir }) {
  const [resultat, setResultat] = useState(null);
  const [enCours, setEnCours] = useState(false);

  async function importer(e) {
    const fichier = e.target.files[0];
    e.target.value = '';
    if (!fichier) return;
    setEnCours(true);
    try {
      const { operations, aVenir } = lireExportMoneyLover(await fichier.text());
      setResultat({ ...importerOperations(base, operations), aVenir });
      rafraichir();
    } catch (erreur) {
      setResultat({ erreur: erreur.message });
    } finally {
      setEnCours(false);
    }
  }

  return (
    <>
      <h2 className="titre-section first">Import</h2>
      <label className={'carte ligne lien' + (enCours ? ' occupe' : '')}>
        <span className="ligne-nom">{enCours ? 'Import en cours…' : 'Importer depuis Money Lover'}</span>
        <span aria-hidden="true">›</span>
        <input type="file" accept=".csv,text/csv,text/comma-separated-values,text/plain" hidden
          disabled={enCours} onChange={importer} />
      </label>

      <h2 className="titre-section">Sauvegarde</h2>
      <Sauvegarde base={base} />

      <h2 className="titre-section">À propos</h2>
      <div className="carte ligne lien">
        <span className="ligne-nom">Version de Moneta</span>
        <span className="texte-2">{version}</span>
      </div>

      {resultat && <ResumeImport resultat={resultat} fermer={() => setResultat(null)} />}
    </>
  );
}
