import { useEffect, useState } from 'react';
import { Feuille, Champ, Message } from './Commun.jsx';
import { Pastille } from './Categories.jsx';
import { formaterEuros, lireMontant, montantPourSaisie, etatBudget } from '../logique/argent.js';
import { periodeBudget, libellePeriode, libelleJour } from '../logique/dates.js';
import {
  listerBudgets, listerCategories, creerBudget, modifierBudget, supprimerBudget,
  depensesDuBudget, exclureDuBudget,
} from '../donnees/depot.js';

// Budget avec sa période en cours, ses dépenses et son état (dépensé, part, dépassement).
export function budgetsEnCours(base) {
  return listerBudgets(base).map((b) => {
    const periode = periodeBudget(b.jourDepart);
    const depenses = depensesDuBudget(base, b.id, periode);
    return { ...b, periode, depenses, ...etatBudget(b.maximum, depenses) };
  });
}

// « dépensé / maximum » et la barre de progression, rouge en cas de dépassement (D22).
export function BarreBudget({ budget: b }) {
  return (
    <>
      <div className="ligne-budget">
        <span className="ligne-nom">{b.nom}</span>
        <span className={b.depasse ? 'negatif' : ''}>
          <strong>{formaterEuros(b.depense)}</strong>
          <span className="texte-2"> / {formaterEuros(b.maximum)}</span>
        </span>
      </div>
      <div className="piste" role="progressbar" aria-label={b.nom}
        aria-valuemin={0} aria-valuemax={b.maximum} aria-valuenow={b.depense}>
        <div className={'remplissage' + (b.depasse ? ' depasse' : '')} style={{ width: `${b.part * 100}%` }} />
      </div>
    </>
  );
}

function ChoixCategories({ base, choisies, choisir }) {
  const basculer = (id) => choisir(choisies.includes(id) ? choisies.filter((c) => c !== id) : [...choisies, id]);
  // Cocher une catégorie couvre ses sous-catégories : on ne les garde pas en double.
  const basculerCategorie = (c) => choisir(choisies.includes(c.id)
    ? choisies.filter((id) => id !== c.id)
    : [...choisies.filter((id) => !c.sous.some((s) => s.id === id)), c.id]);
  return (
    <fieldset className="champ choix-categories">
      <legend>Catégories suivies</legend>
      <div className="liste-choix">
        {listerCategories(base, 'depense').map((c) => (
          <div key={c.id}>
            <label className="case">
              <input type="checkbox" checked={choisies.includes(c.id)} onChange={() => basculerCategorie(c)} />
              <Pastille categorie={c} petite />
              {c.nom}
            </label>
            {c.sous.map((s) => (
              <label key={s.id} className="case sous">
                <input type="checkbox" checked={choisies.includes(c.id) || choisies.includes(s.id)}
                  disabled={choisies.includes(c.id)} onChange={() => basculer(s.id)} />
                <Pastille categorie={s} petite />
                {s.nom}
              </label>
            ))}
          </div>
        ))}
      </div>
    </fieldset>
  );
}

function Formulaire({ base, budget, fermer, rafraichir }) {
  const [nom, setNom] = useState(budget?.nom ?? '');
  const [maximum, setMaximum] = useState(budget ? montantPourSaisie(budget.maximum) : '');
  const [jourDepart, setJourDepart] = useState(budget?.jourDepart ?? 1);
  const [categorieIds, setCategorieIds] = useState(budget?.categorieIds ?? []);
  const [message, setMessage] = useState('');
  const [confirmer, setConfirmer] = useState(false);

  useEffect(() => setMessage(''), [nom, maximum, categorieIds]);

  function enregistrer(e) {
    e.preventDefault();
    const centimes = lireMontant(maximum);
    if (!nom.trim()) return setMessage('Donne un nom au budget.');
    if (centimes === null || centimes <= 0) return setMessage('Indique un montant maximum, par exemple 300,00.');
    if (categorieIds.length === 0) return setMessage('Coche au moins une catégorie.');
    const valeurs = { nom: nom.trim(), maximum: centimes, jourDepart, categorieIds };
    if (budget) modifierBudget(base, budget.id, valeurs);
    else creerBudget(base, valeurs);
    rafraichir();
    fermer();
  }

  function supprimer() {
    supprimerBudget(base, budget.id);
    rafraichir();
    fermer();
  }

  if (confirmer) {
    return (
      <Feuille titre="Supprimer ce budget ?" fermer={fermer}>
        <p className="texte-2">« {budget.nom} » sera supprimé. Les opérations ne changent pas.</p>
        <div className="actions">
          <button className="bouton secondaire" onClick={() => setConfirmer(false)}>Annuler</button>
          <button className="bouton danger" onClick={supprimer}>Supprimer</button>
        </div>
      </Feuille>
    );
  }

  return (
    <Feuille titre={budget ? 'Modifier le budget' : 'Nouveau budget'} fermer={fermer}>
      <form onSubmit={enregistrer}>
        <Champ libelle="Nom" value={nom} onChange={(e) => setNom(e.target.value)}
          placeholder="Courses, Sorties…" autoFocus={!budget} />
        <Champ libelle="Montant maximum (€)" value={maximum} onChange={(e) => setMaximum(e.target.value)}
          inputMode="decimal" placeholder="0,00" />
        <label className="champ">
          <span>Le budget repart chaque mois le</span>
          <select value={jourDepart} onChange={(e) => setJourDepart(Number(e.target.value))}>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((j) => (
              <option key={j} value={j}>{j === 1 ? '1er' : j}</option>
            ))}
          </select>
        </label>
        <ChoixCategories base={base} choisies={categorieIds} choisir={setCategorieIds} />
        <Message texte={message} />
        <button className="bouton" type="submit">Enregistrer</button>
        {budget && (
          <button className="bouton lien-danger" type="button" onClick={() => setConfirmer(true)}>
            Supprimer ce budget
          </button>
        )}
      </form>
    </Feuille>
  );
}

// Détail d'un budget : les dépenses comptées, chacune excluable (D9).
function Detail({ base, budget: b, modifier, fermer, rafraichir }) {
  function basculer(o) {
    exclureDuBudget(base, b.id, o.id, !o.exclue);
    rafraichir();
  }

  return (
    <Feuille titre={b.nom} fermer={fermer}>
      <p className="texte-2 periode">{libellePeriode(b.periode)}</p>
      <BarreBudget budget={b} />
      <button className="bouton secondaire espace" onClick={modifier}>Modifier le budget</button>
      <h3 className="titre-section">Dépenses de la période</h3>
      {b.depenses.length === 0 ? (
        <p className="texte-2">Aucune dépense dans ces catégories pour l'instant.</p>
      ) : (
        <ul className="liste depenses-budget">
          {b.depenses.map((o) => (
            <li key={o.id} className={o.exclue ? 'exclue' : ''}>
              <span className="ligne-nom">
                {o.categorie}
                <small className="texte-2 detail">{[libelleJour(o.date), o.note].filter(Boolean).join(' · ')}</small>
              </span>
              <span className="montant-budget">{formaterEuros(o.montant)}</span>
              <button className="bouton-petit" onClick={() => basculer(o)}>
                {o.exclue ? 'Réintégrer' : 'Exclure'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Feuille>
  );
}

export default function Budgets({ base, rafraichir }) {
  const [ouvert, setOuvert] = useState(null); // id du budget affiché
  const [edition, setEdition] = useState(null); // null, 'nouveau' ou un budget
  const budgets = budgetsEnCours(base);
  const affiche = budgets.find((b) => b.id === ouvert);

  return (
    <>
      {budgets.length === 0 ? (
        <p className="vide">Aucun budget. Crée le premier ci-dessous.</p>
      ) : (
        budgets.map((b) => (
          <button key={b.id} className="carte budget" onClick={() => setOuvert(b.id)}>
            <BarreBudget budget={b} />
            <span className="texte-2 periode">{libellePeriode(b.periode)}</span>
          </button>
        ))
      )}

      <button className="bouton" onClick={() => setEdition('nouveau')}>Créer un budget</button>

      {affiche && !edition && (
        <Detail base={base} budget={affiche} rafraichir={rafraichir}
          modifier={() => setEdition(affiche)} fermer={() => setOuvert(null)} />
      )}
      {edition && (
        <Formulaire base={base} budget={edition === 'nouveau' ? null : edition}
          fermer={() => setEdition(null)} rafraichir={rafraichir} />
      )}
    </>
  );
}
