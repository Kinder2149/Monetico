import { useState } from 'react';
import { Pastille } from './Categories.jsx';
import { IconeTransfert } from './Icones.jsx';
import { formaterEuros, parJour, rechercher } from '../logique/argent.js';
import { libelleJour } from '../logique/dates.js';
import { listerOperations } from '../donnees/depot.js';

function LigneOperation({ operation: o, ouvrir }) {
  if (o.type === 'transfert') {
    return (
      <button className="ligne" onClick={() => ouvrir(o)}>
        <span className="pastille transfert" aria-hidden="true"><IconeTransfert /></span>
        <span className="ligne-nom">
          Transfert
          <small className="texte-2 detail">
            {[`${o.porteMonnaie} → ${o.versPorteMonnaie}`, o.note].filter(Boolean).join(' · ')}
          </small>
        </span>
        <span>{formaterEuros(o.montant)}</span>
      </button>
    );
  }
  const signe = o.type === 'revenu' ? '+' : '−';
  return (
    <button className="ligne" onClick={() => ouvrir(o)}>
      <Pastille categorie={{ nom: o.categorie ?? '?', icone: o.icone }} />
      <span className="ligne-nom">
        {o.categorie}
        <small className="texte-2 detail">
          {[o.categorieParent, o.note, o.porteMonnaie].filter(Boolean).join(' · ')}
        </small>
      </span>
      <span className={o.type === 'revenu' ? 'positif' : 'negatif'}>{signe} {formaterEuros(o.montant)}</span>
    </button>
  );
}

// Liste d'opérations regroupées par jour, réutilisée par l'accueil.
export function ListeOperations({ operations, ouvrir, vide }) {
  if (operations.length === 0) return <p className="vide">{vide}</p>;
  return parJour(operations).map(({ jour, operations: duJour }) => (
    <section key={jour}>
      <h2 className="titre-section">{libelleJour(jour)}</h2>
      <ul className="carte liste">
        {duJour.map((o) => <li key={o.id}><LigneOperation operation={o} ouvrir={ouvrir} /></li>)}
      </ul>
    </section>
  ));
}

export default function Operations({ base, porteMonnaieId, ouvrir, rechercheInitiale = false }) {
  const [recherche, setRecherche] = useState('');
  const operations = rechercher(listerOperations(base, { porteMonnaieId }), recherche);

  return (
    <>
      <label className="champ recherche">
        <span className="sr">Rechercher</span>
        <input type="search" value={recherche} onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher une note ou une catégorie" autoFocus={rechercheInitiale} />
      </label>
      <ListeOperations operations={operations} ouvrir={ouvrir}
        vide={recherche ? 'Aucune opération ne correspond.' : 'Aucune opération pour le moment. Touche « + » pour en ajouter une.'} />
    </>
  );
}
