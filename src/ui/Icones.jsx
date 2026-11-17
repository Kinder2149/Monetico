// Pictogrammes au trait : barre du bas dessinée pour Moneta, catégories issues de Lucide.

import { ArrowLeftRight, ImagePlus, Settings } from 'lucide-react';
import { DESSINS } from './dessins.js';

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

export const IconeReglages = () => <Settings size={22} strokeWidth={2} aria-hidden="true" />;

export const IconePhoto = () => <ImagePlus size={20} strokeWidth={2} aria-hidden="true" />;

export const IconeTransfert = () => <ArrowLeftRight size={20} strokeWidth={2} aria-hidden="true" />;

export const IconePlus = () => (
  <Trait taille={28}><path d="M12 5v14" /><path d="M5 12h14" /></Trait>
);

// --- Icônes de catégories : dessins en couleur « Fluent Emoji Flat », licence MIT (D42) ---
// Seuls les dessins listés dans dessins.js sont intégrés à l'appli ; la clé est ce qui est enregistré en base.

export const ICONES_CATEGORIES = DESSINS;

// Catégorie sans icône choisie (créée par l'import) : dessin deviné d'après son nom, sinon un colis.
const MOTS = [
  ['bread', ['boulang', 'pain', 'pâtiss', 'patiss']], ['coffee', ['café', 'cafe', 'bar', 'thé']],
  ['sandwich', ['fast', 'snack']], ['utensils', ['resto', 'aliment', 'repas', 'cantine', 'nourri']],
  ['shopping-cart', ['course', 'supermarch', 'épicerie', 'epicerie']], ['house', ['loyer', 'logement', 'maison', 'habitat']],
  ['zap', ['électr', 'electr', 'énergie', 'energie']], ['droplet', ['eau']], ['flame', ['gaz', 'chauff']],
  ['smartphone', ['téléph', 'teleph', 'mobile', 'forfait']], ['wifi', ['internet', 'box']],
  ['car', ['voiture', 'auto', 'transport', 'péage', 'peage']], ['fuel', ['carbur', 'essence']], ['bus', ['bus', 'métro', 'metro', 'tram']],
  ['train', ['train', 'sncf']], ['plane', ['vacances', 'voyage', 'avion', 'hôtel', 'hotel']],
  ['heart-pulse', ['santé', 'sante', 'médec', 'medec', 'dentiste', 'mutuelle']], ['pill', ['pharma']],
  ['shirt', ['vêtement', 'vetement', 'habit']], ['shopping-bag', ['shopping', 'achat']], ['sofa', ['meuble', 'déco', 'deco']],
  ['gamepad', ['jeu', 'jeux']], ['film', ['cinéma', 'cinema', 'film']], ['music', ['musique', 'concert']],
  ['ticket', ['sortie', 'spectacle']], ['dumbbell', ['sport', 'salle']], ['gift', ['cadeau', 'don']],
  ['shield', ['assurance']], ['landmark', ['banque', 'bancaire', 'frais', 'impôt', 'impot', 'taxe']],
  ['repeat', ['abonnement']], ['book', ['livre', 'éducation', 'education', 'formation']], ['school', ['école', 'ecole', 'scolaire']],
  ['baby', ['enfant', 'bébé', 'bebe', 'crèche', 'creche']], ['dog', ['animaux', 'chien', 'véto', 'veto']],
  ['scissors', ['coiffeur', 'beauté', 'beaute']], ['sparkles', ['hygiène', 'hygiene']], ['wrench', ['entretien', 'répar', 'repar']],
  ['briefcase', ['salaire', 'travail', 'paie', 'revenu']], ['trophy', ['prime', 'bonus']], ['tag', ['vente']],
  ['rotate-ccw', ['rembours']], ['money-bag', ['épargne', 'epargne', 'solde', 'intérêt', 'interet']], ['cigarette', ['tabac', 'cigar']],
  ['beer', ['alcool', 'bière', 'biere']], ['hand-heart', ['aide', 'allocation']],
];

export function iconeParNom(nom = '') {
  const t = nom.toLowerCase();
  for (const [cle, mots] of MOTS) if (mots.some((m) => t.includes(m))) return cle;
  return 'ellipsis';
}

export function IconeCategorie({ nom, taille = 20 }) {
  const dessin = DESSINS[nom];
  return dessin
    ? <svg width={taille} height={taille} viewBox="0 0 32 32" aria-hidden="true" dangerouslySetInnerHTML={{ __html: dessin }} />
    : null;
}
