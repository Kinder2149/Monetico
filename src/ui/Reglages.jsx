import { useState } from 'react';
import { Feuille } from './Commun.jsx';
import { importerOperations } from '../donnees/depot.js';
import { lireExportMoneyLover } from '../logique/importMoneyLover.js';
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

// Écran Réglages (roue dentée de l'onglet Comptes, D27) : import Money Lover et version de l'appli.
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

      <h2 className="titre-section">À propos</h2>
      <div className="carte ligne lien">
        <span className="ligne-nom">Version de Moneta</span>
        <span className="texte-2">{version}</span>
      </div>

      {resultat && <ResumeImport resultat={resultat} fermer={() => setResultat(null)} />}
    </>
  );
}
