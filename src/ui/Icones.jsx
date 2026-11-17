// Pictogrammes au trait : barre du bas dessinée pour Moneta, catégories issues de Lucide.

import {
  ShoppingCart, Utensils, Sandwich, Coffee, Pizza, Beer, Wine, House, Zap, Droplet, Wifi, Shield,
  Bus, TrainFront, Car, Fuel, SquareParking, Wrench, Bike, Plane, Luggage, HeartPulse, Pill,
  Stethoscope, ShoppingBag, Shirt, Sofa, Smartphone, Sparkles, Scissors, PartyPopper, Gamepad2,
  Dumbbell, Music, Film, Tv, Ticket, BookOpen, GraduationCap, Baby, Dog, Cat, Repeat, Gift,
  Landmark, Receipt, Ellipsis, Hammer, PaintRoller, Lightbulb, Flame, Umbrella, Store,
  BriefcaseBusiness, Trophy, RotateCcw, Tag, HandCoins, PiggyBank, Banknote, Wallet, HandHeart,
  Cigarette, ArrowLeftRight, ImagePlus, Settings,
} from 'lucide-react';

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

// --- Icônes de catégories (bibliothèque Lucide, D24) ---
// Seules les icônes listées ici sont intégrées à l'appli.

export const ICONES_CATEGORIES = {
  'shopping-cart': ShoppingCart, utensils: Utensils, sandwich: Sandwich, coffee: Coffee, pizza: Pizza,
  beer: Beer, wine: Wine, house: House, zap: Zap, droplet: Droplet, wifi: Wifi, shield: Shield,
  bus: Bus, train: TrainFront, car: Car, fuel: Fuel, parking: SquareParking, wrench: Wrench, bike: Bike,
  plane: Plane, luggage: Luggage, 'heart-pulse': HeartPulse, pill: Pill, stethoscope: Stethoscope,
  'shopping-bag': ShoppingBag, shirt: Shirt, sofa: Sofa, smartphone: Smartphone, sparkles: Sparkles,
  scissors: Scissors, party: PartyPopper, gamepad: Gamepad2, dumbbell: Dumbbell, music: Music,
  film: Film, tv: Tv, ticket: Ticket, book: BookOpen, school: GraduationCap, baby: Baby, dog: Dog,
  cat: Cat, repeat: Repeat, gift: Gift, landmark: Landmark, receipt: Receipt, hammer: Hammer,
  paint: PaintRoller, lightbulb: Lightbulb, flame: Flame, umbrella: Umbrella, store: Store,
  briefcase: BriefcaseBusiness, trophy: Trophy, 'rotate-ccw': RotateCcw, tag: Tag,
  'hand-coins': HandCoins, 'piggy-bank': PiggyBank, banknote: Banknote, wallet: Wallet,
  'hand-heart': HandHeart, cigarette: Cigarette, ellipsis: Ellipsis,
};

// Couleur vive de la pastille ronde de chaque icône (D35) : pictogramme blanc sur fond coloré,
// contraste d'au moins 3:1 avec le blanc. Même icône = même couleur partout dans l'appli.
const ROUGE = '#E03131', ORANGE = '#E8590C', AMBRE = '#C27C0E', VERT = '#2B8A3E', SARCELLE = '#0C8599',
  BLEU = '#1C7ED6', INDIGO = '#4263EB', VIOLET = '#7048E8', ROSE = '#D6336C', BRUN = '#A0522D', ARDOISE = '#495057';

const COULEURS_ICONES = {
  'shopping-cart': ORANGE, utensils: ROUGE, sandwich: AMBRE, coffee: BRUN, pizza: ORANGE, beer: AMBRE, wine: ROSE,
  house: SARCELLE, zap: AMBRE, droplet: BLEU, wifi: INDIGO, shield: ARDOISE,
  bus: BLEU, train: BLEU, car: INDIGO, fuel: ROUGE, parking: BLEU, wrench: ARDOISE, bike: VERT, plane: SARCELLE, luggage: BRUN,
  'heart-pulse': ROUGE, pill: ROSE, stethoscope: SARCELLE,
  'shopping-bag': VIOLET, shirt: INDIGO, sofa: BRUN, smartphone: ARDOISE, sparkles: VIOLET, scissors: ROSE,
  party: VIOLET, gamepad: INDIGO, dumbbell: ORANGE, music: ROSE, film: ARDOISE, tv: BLEU, ticket: ORANGE,
  book: BRUN, school: INDIGO, baby: ROSE, dog: BRUN, cat: AMBRE,
  repeat: VIOLET, gift: ROSE, landmark: ARDOISE, receipt: SARCELLE, hammer: BRUN, paint: ORANGE, lightbulb: AMBRE,
  flame: ROUGE, umbrella: BLEU, store: VERT, briefcase: VERT, trophy: AMBRE, 'rotate-ccw': SARCELLE, tag: VIOLET,
  'hand-coins': VERT, 'piggy-bank': ROSE, banknote: VERT, wallet: BRUN, 'hand-heart': ROSE, cigarette: ARDOISE,
  ellipsis: ARDOISE,
};

const PALETTE = [ROUGE, ORANGE, AMBRE, VERT, SARCELLE, BLEU, INDIGO, VIOLET, ROSE, BRUN];

// Couleur d'une catégorie : celle de son icône, sinon une couleur stable tirée de son nom
// (catégories créées par l'import, sans icône).
export function couleurCategorie({ icone, nom = '' }) {
  if (COULEURS_ICONES[icone]) return COULEURS_ICONES[icone];
  let somme = 0;
  for (const lettre of nom) somme = (somme * 31 + lettre.codePointAt(0)) % 9973;
  return PALETTE[somme % PALETTE.length];
}

export function IconeCategorie({ nom, taille = 20 }) {
  const Icone = ICONES_CATEGORIES[nom];
  return Icone ? <Icone size={taille} strokeWidth={2} aria-hidden="true" /> : null;
}
