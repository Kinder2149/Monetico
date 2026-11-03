// Montants : stockés en centimes, affichés au format français.

const FORMAT = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', useGrouping: 'always' });

// L'espace fine des milliers (U+202F) est quasi invisible en Manrope : on met une espace insécable.
export function formaterEuros(centimes) {
  return FORMAT.format(centimes / 100).replace(/ /g, ' ');
}

// « 12,5 », « -1 234,56 », « 12.50 € » → centimes ; null si la saisie n'est pas un montant.
export function lireMontant(texte) {
  const propre = String(texte).replace(/[\s  €]/g, '').replace(',', '.');
  if (!/^-?\d+(\.\d{1,2})?$/.test(propre)) return null;
  return Math.round(Number(propre) * 100);
}

// Centimes → texte modifiable dans un champ (« 1234,5 » → « 1234,50 »).
export function montantPourSaisie(centimes) {
  return (centimes / 100).toFixed(2).replace('.', ',');
}

export function total(porteMonnaie) {
  return porteMonnaie.reduce((somme, p) => somme + p.solde, 0);
}
