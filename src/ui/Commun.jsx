import { useEffect, useRef } from 'react';

// Éléments d'interface partagés entre les écrans.

// Bouton retour du téléphone : la partie Android (MainActivity) appelle monetaRetour().
// S'il reste un panneau ou un écran secondaire ouvert, on ferme le dernier ouvert et on
// répond true ; sinon false, et Android quitte l'appli comme d'habitude.
const ouverts = [];

window.monetaRetour = () => {
  const fermer = ouverts[ouverts.length - 1];
  if (!fermer) return false;
  fermer.current();
  return true;
};

export function useRetour(actif, fermer) {
  const refFermer = useRef(fermer);
  refFermer.current = fermer;
  useEffect(() => {
    if (!actif) return undefined;
    ouverts.push(refFermer);
    return () => ouverts.splice(ouverts.indexOf(refFermer), 1);
  }, [actif]);
}

// Panneau qui monte du bas de l'écran (formulaires, confirmations).
export function Feuille({ titre, fermer, children }) {
  useRetour(true, fermer);
  return (
    <div className="voile" onClick={fermer}>
      <div className="feuille" role="dialog" aria-label={titre} onClick={(e) => e.stopPropagation()}>
        <h2 className="titre-feuille">{titre}</h2>
        {children}
      </div>
    </div>
  );
}

export function Champ({ libelle, ...props }) {
  return (
    <label className="champ">
      <span>{libelle}</span>
      <input {...props} />
    </label>
  );
}

export function Message({ texte }) {
  return texte ? <p className="message">{texte}</p> : null;
}
