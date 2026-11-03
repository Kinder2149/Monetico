// Éléments d'interface partagés entre les écrans.

// Panneau qui monte du bas de l'écran (formulaires, confirmations).
export function Feuille({ titre, fermer, children }) {
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
