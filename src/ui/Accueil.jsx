import { ListeOperations } from './Operations.jsx';
import { formaterEuros, total, entreesSorties } from '../logique/argent.js';
import { aujourdhui, bornesDuMois, nomDuMois } from '../logique/dates.js';
import { listerOperations } from '../donnees/depot.js';

// Écran d'accueil : sélecteur de porte-monnaie, solde, carte du mois, opérations du jour.
export default function Accueil({ base, porteMonnaie, choix, choisir, chercher, ouvrir }) {
  const porteMonnaieId = choix === 'tous' ? null : choix;
  const affiches = choix === 'tous' ? porteMonnaie : porteMonnaie.filter((p) => p.id === choix);
  const jour = aujourdhui();
  const { debut, fin } = bornesDuMois(jour);
  const { entrees, sorties } = entreesSorties(listerOperations(base, { porteMonnaieId, debut, fin }));
  const duJour = listerOperations(base, { porteMonnaieId, debut: jour, fin: jour });

  return (
    <>
      <div className="haut-accueil">
        <label className="selecteur">
          <span className="sr">Porte-monnaie affiché</span>
          <select value={choix} onChange={(e) => choisir(e.target.value === 'tous' ? 'tous' : Number(e.target.value))}>
            <option value="tous">Tous les comptes</option>
            {porteMonnaie.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
          </select>
        </label>
        <button className="bouton-rond" onClick={chercher} aria-label="Rechercher une opération">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        </button>
      </div>

      <p className="texte-2 libelle-solde">Solde</p>
      <p className="solde">{formaterEuros(total(affiches))}</p>

      <div className="carte mois">
        <p className="titre-carte">{nomDuMois(jour)}</p>
        <div className="mois-colonnes">
          <div>
            <span className="texte-2">Entrées</span>
            <strong className="positif">+ {formaterEuros(entrees)}</strong>
          </div>
          <div>
            <span className="texte-2">Sorties</span>
            <strong className="negatif">− {formaterEuros(sorties)}</strong>
          </div>
        </div>
      </div>

      <ListeOperations operations={duJour} ouvrir={ouvrir} vide="Aucune opération aujourd'hui." />
    </>
  );
}
