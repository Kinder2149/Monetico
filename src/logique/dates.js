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

// Jour `j` du mois (ramené au dernier jour pour les mois plus courts : le 31 devient le 30 en avril).
function jourDuMois(annee, mois, j) {
  return new Date(annee, mois, Math.min(j, new Date(annee, mois + 1, 0).getDate()));
}

// Période en cours d'un budget qui repart chaque mois le `jourDepart` (D9).
export function periodeBudget(jourDepart, jour = aujourdhui()) {
  const d = enDate(jour);
  let debut = jourDuMois(d.getFullYear(), d.getMonth(), jourDepart);
  if (debut > d) debut = jourDuMois(d.getFullYear(), d.getMonth() - 1, jourDepart);
  const fin = jourDuMois(debut.getFullYear(), debut.getMonth() + 1, jourDepart);
  fin.setDate(fin.getDate() - 1);
  return { debut: aujourdhui(debut), fin: aujourdhui(fin) };
}

// Jour prévu d'une récurrente dans le mois de `jour` (le 31 devient le 30 en avril).
export function jourPrevu(jourDuMoisPrevu, jour = aujourdhui()) {
  const d = enDate(jour);
  return aujourdhui(jourDuMois(d.getFullYear(), d.getMonth(), jourDuMoisPrevu));
}

// Même jour décalé de `nbMois` mois (le jour est ramené au dernier du mois si besoin).
export function decalerMois(jour, nbMois) {
  const d = enDate(jour);
  return aujourdhui(jourDuMois(d.getFullYear(), d.getMonth() + nbMois, d.getDate()));
}

const FORMAT_MOIS_COURT = new Intl.DateTimeFormat('fr-FR', { month: 'short' });

// « nov. », « déc. »
export function moisCourt(jour) {
  return FORMAT_MOIS_COURT.format(enDate(jour));
}

const FORMAT_COURT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });

// « du 1 nov. au 30 nov. »
export function libellePeriode({ debut, fin }) {
  return `du ${FORMAT_COURT.format(enDate(debut))} au ${FORMAT_COURT.format(enDate(fin))}`;
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
