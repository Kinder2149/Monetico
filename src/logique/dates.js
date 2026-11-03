// Dates au format AAAA-MM-JJ, en heure locale du téléphone.

export function aujourdhui(maintenant = new Date()) {
  const deux = (n) => String(n).padStart(2, '0');
  return `${maintenant.getFullYear()}-${deux(maintenant.getMonth() + 1)}-${deux(maintenant.getDate())}`;
}

function enDate(jour) {
  const [a, m, j] = jour.split('-').map(Number);
  return new Date(a, m - 1, j);
}

export function decaler(jour, nbJours) {
  const d = enDate(jour);
  d.setDate(d.getDate() + nbJours);
  return aujourdhui(d);
}

// Premier et dernier jour du mois contenant `jour`.
export function bornesDuMois(jour) {
  const d = enDate(jour);
  return {
    debut: aujourdhui(new Date(d.getFullYear(), d.getMonth(), 1)),
    fin: aujourdhui(new Date(d.getFullYear(), d.getMonth() + 1, 0)),
  };
}

const FORMAT_JOUR = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const FORMAT_JOUR_ANNEE = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

// « Aujourd'hui », « Hier », « lundi 2 novembre » (l'année n'apparaît que si elle diffère).
export function libelleJour(jour, reference = aujourdhui()) {
  if (jour === reference) return "Aujourd'hui";
  if (jour === decaler(reference, -1)) return 'Hier';
  const format = jour.slice(0, 4) === reference.slice(0, 4) ? FORMAT_JOUR : FORMAT_JOUR_ANNEE;
  const texte = format.format(enDate(jour));
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

export function nomDuMois(jour) {
  const texte = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(enDate(jour));
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}
