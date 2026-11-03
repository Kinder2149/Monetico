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

// Entrées et sorties d'une liste d'opérations (les transferts ne comptent ni dans l'un ni dans l'autre).
export function entreesSorties(operations) {
  let entrees = 0;
  let sorties = 0;
  for (const o of operations) {
    if (o.type === 'revenu') entrees += o.montant;
    else if (o.type === 'depense') sorties += o.montant;
  }
  return { entrees, sorties };
}

// État d'un budget : dépensé (dépenses exclues non comptées), part du maximum, dépassement.
export function etatBudget(maximum, operations) {
  const depense = operations.reduce((somme, o) => somme + (o.exclue ? 0 : o.montant), 0);
  return { depense, part: Math.min(depense / maximum, 1), depasse: depense > maximum };
}

// Parts du camembert : les `nb` plus grosses catégories, le reste regroupé dans « Autres catégories ».
export function partsCamembert(categories, nb = 6) {
  const total = categories.reduce((somme, c) => somme + c.montant, 0);
  const gardees = categories.length > nb + 1 ? categories.slice(0, nb) : categories;
  const reste = categories.slice(gardees.length).reduce((somme, c) => somme + c.montant, 0);
  const parts = reste > 0 ? [...gardees, { id: 'autres', nom: 'Autres catégories', icone: null, montant: reste }] : gardees;
  return { total, parts: parts.map((p) => ({ ...p, part: total ? p.montant / total : 0 })) };
}

// Regroupe des opérations déjà triées par date en [{ jour, operations }].
export function parJour(operations) {
  const groupes = [];
  for (const o of operations) {
    const dernier = groupes.at(-1);
    if (dernier?.jour === o.date) dernier.operations.push(o);
    else groupes.push({ jour: o.date, operations: [o] });
  }
  return groupes;
}

// Recherche insensible aux majuscules et aux accents, dans la note et la catégorie.
export function rechercher(operations, texte) {
  const simplifier = (s) => (s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const cherche = simplifier(texte.trim());
  if (!cherche) return operations;
  return operations.filter((o) =>
    [o.note, o.categorie, o.categorieParent].some((champ) => simplifier(champ).includes(cherche))
  );
}
