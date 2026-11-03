// Pictogrammes au trait dessinés pour Moneta (aucune bibliothèque externe).

function Trait({ children, taille = 24 }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const IconeAccueil = () => (
  <Trait><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h14V9.5" /><path d="M10 20v-5h4v5" /></Trait>
);

export const IconeOperations = () => (
  <Trait><path d="M8 6h12" /><path d="M8 12h12" /><path d="M8 18h12" /><circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" /></Trait>
);

export const IconeBudgets = () => (
  <Trait><path d="M12 3a9 9 0 1 0 9 9h-9z" /><path d="M15 3.5A9 9 0 0 1 20.5 9H15z" /></Trait>
);

export const IconeComptes = () => (
  <Trait><rect x="3" y="6" width="18" height="13" rx="3" /><path d="M3 10h18" /><path d="M16 15h2" /></Trait>
);

export const IconePlus = () => (
  <Trait taille={28}><path d="M12 5v14" /><path d="M5 12h14" /></Trait>
);
