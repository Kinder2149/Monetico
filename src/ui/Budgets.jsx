import { useEffect, useState } from 'react';
import { Feuille, Champ, Message, useRetour } from './Commun.jsx';
import { Pastille, ChoixIcone } from './Categories.jsx';
import {
  formaterEuros, lireMontant, montantPourSaisie, etatBudget, historiqueBudget, argentDisponible, repartitionBudgets,
} from '../logique/argent.js';
import { periodeBudget, libellePeriode, libelleJour, aujourdhui, decalerMois } from '../logique/dates.js';
import {
  listerBudgets, listerCategories, creerBudget, modifierBudget, supprimerBudget,
  depensesDuBudget, exclureDuBudget, soldeTotalAu,
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
        {b.icone && <Pastille categorie={{ icone: b.icone, nom: b.nom }} petite />}
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

// Choix des catégories suivies en fenêtre pleine page (D46) : plusieurs cases ;
// une catégorie cochée couvre ses sous-catégories.
function FenetreCategories({ base, choisies, choisir, fermer }) {
  useRetour(true, fermer);
  const [recherche, setRecherche] = useState('');
  const mot = recherche.trim().toLowerCase();
  const categories = listerCategories(base, 'depense');
  const basculer = (id) => choisir(choisies.includes(id) ? choisies.filter((c) => c !== id) : [...choisies, id]);
  const basculerCategorie = (c) => choisir(choisies.includes(c.id)
    ? choisies.filter((id) => id !== c.id)
    : [...choisies.filter((id) => !c.sous.some((s) => s.id === id)), c.id]);
  const filtrees = categories
    .map((c) => (!mot || c.nom.toLowerCase().includes(mot)
      ? c
      : { ...c, sous: c.sous.filter((x) => x.nom.toLowerCase().includes(mot)), masquee: true }))
    .filter((c) => !c.masquee || c.sous.length > 0);
  return (
    <div className="fenetre-plein" role="dialog" aria-label="Catégories suivies">
      <div className="entete-plein">
        <button type="button" className="retour" aria-label="Fermer" onClick={fermer}>←</button>
        <h2>Catégories suivies</h2>
      </div>
      <label className="champ recherche">
        <span className="sr">Rechercher une catégorie</span>
        <input type="search" value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher" />
      </label>
      <ul className="liste-categories">
        {filtrees.map((c) => (
          <li key={c.id}>
            {!c.masquee && (
              <button type="button" className={'option' + (choisies.includes(c.id) ? ' choisie' : '')}
                aria-pressed={choisies.includes(c.id)} onClick={() => basculerCategorie(c)}>
                <Pastille categorie={c} />
                <span className="ligne-nom">{c.nom}</span>
                <span className="coche" aria-hidden="true">{choisies.includes(c.id) ? '✓' : ''}</span>
              </button>
            )}
            {c.sous.map((s) => {
              const coche = choisies.includes(c.id) || choisies.includes(s.id);
              return (
                <button key={s.id} type="button" className={'option sous' + (coche ? ' choisie' : '')}
                  aria-pressed={coche} disabled={choisies.includes(c.id)} onClick={() => basculer(s.id)}>
                  <Pastille categorie={s} petite />
                  <span className="ligne-nom">{c.masquee ? `${c.nom} › ${s.nom}` : s.nom}</span>
                  <span className="coche" aria-hidden="true">{coche ? '✓' : ''}</span>
                </button>
              );
            })}
          </li>
        ))}
        {filtrees.length === 0 && <li className="vide">Aucune catégorie ne correspond.</li>}
      </ul>
      <div className="pied-plein">
        <button type="button" className="bouton" onClick={fermer}>
          Valider{choisies.length > 0 ? ` (${choisies.length})` : ''}
        </button>
      </div>
    </div>
  );
}

function ChoixCategories({ base, choisies, choisir }) {
  const [ouvert, setOuvert] = useState(false);
  const noms = listerCategories(base, 'depense').flatMap((c) => [c, ...c.sous])
    .filter((c) => choisies.includes(c.id)).map((c) => c.nom);
  const resume = choisies.length === 0 ? 'Choisir des catégories'
    : choisies.length === 1 ? noms[0] : `${choisies.length} catégories`;
  return (
    <div className="champ">
      <span>Catégories suivies</span>
      <button type="button" className="ligne choix-actuel" aria-haspopup="dialog" onClick={() => setOuvert(true)}>
        <span className="ligne-nom">{resume}</span>
        <span className="fleche" aria-hidden="true">›</span>
      </button>
      {choisies.length > 1 && <small className="texte-2">{noms.join(', ')}</small>}
      {ouvert && <FenetreCategories base={base} choisies={choisies} choisir={choisir} fermer={() => setOuvert(false)} />}
    </div>
  );
}

// « Argent disponible » (D46) : solde actuel + salaire + lignes « Autre », comparé au total des budgets.
const CLE_APPORT = 'moneta-apport-budget';
function lireApport() {
  try { return { salaire: '', autres: [], ...JSON.parse(localStorage.getItem(CLE_APPORT)) }; } catch { return { salaire: '', autres: [] }; }
}

function Apport({ solde, autresBudgets, maximum }) {
  const [apport, setApport] = useState(lireApport);
  const changer = (modif) => {
    const suite = { ...apport, ...modif };
    setApport(suite);
    try { localStorage.setItem(CLE_APPORT, JSON.stringify(suite)); } catch { /* sans effet */ }
  };
  const lignes = [{ montant: lireMontant(apport.salaire) ?? 0 }, ...apport.autres.map((l) => ({ montant: lireMontant(l.montant) ?? 0 }))];
  const disponible = argentDisponible(solde, lignes);
  const { total, libre, depasse } = repartitionBudgets(disponible, [...autresBudgets, lireMontant(maximum) ?? 0]);
  const majAutre = (i, modif) => changer({ autres: apport.autres.map((l, k) => (k === i ? { ...l, ...modif } : l)) });
  return (
    <fieldset className="champ apport">
      <legend>Argent disponible</legend>
      <div className="ligne-apport"><span>Solde actuel</span><strong>{formaterEuros(solde)}</strong></div>
      <Champ libelle="Salaire (€)" value={apport.salaire} onChange={(e) => changer({ salaire: e.target.value })}
        inputMode="decimal" placeholder="0,00" />
      {apport.autres.map((l, i) => (
        <div key={i} className="ligne-autre">
          <Champ libelle="Autre" value={l.nom} onChange={(e) => majAutre(i, { nom: e.target.value })} placeholder="Prime, aide…" />
          <Champ libelle="Montant (€)" value={l.montant} onChange={(e) => majAutre(i, { montant: e.target.value })}
            inputMode="decimal" placeholder="0,00" />
          <button type="button" className="bouton-petit" aria-label="Retirer cette ligne"
            onClick={() => changer({ autres: apport.autres.filter((_, k) => k !== i) })}>×</button>
        </div>
      ))}
      <button type="button" className="bouton secondaire" onClick={() => changer({ autres: [...apport.autres, { nom: '', montant: '' }] })}>
        + Autre
      </button>
      <div className="ligne-apport somme"><span>Argent disponible</span><strong>{formaterEuros(disponible)}</strong></div>
      <div className="ligne-apport"><span>Total des budgets</span><strong>{formaterEuros(total)}</strong></div>
      <div className={'ligne-apport' + (depasse ? ' negatif' : '')}>
        <span>{depasse ? "Les budgets dépassent de" : "Reste libre"}</span>
        <strong>{formaterEuros(depasse ? Math.abs(libre) : libre)}</strong>
      </div>
    </fieldset>
  );
}

function Formulaire({ base, budget, fermer, rafraichir }) {
  const [nom, setNom] = useState(budget?.nom ?? '');
  const [maximum, setMaximum] = useState(budget ? montantPourSaisie(budget.maximum) : '');
  const [jourDepart, setJourDepart] = useState(budget?.jourDepart ?? 1);
  const [categorieIds, setCategorieIds] = useState(budget?.categorieIds ?? []);
  const [icone, setIcone] = useState(budget?.icone ?? null);
  const [message, setMessage] = useState('');
  const [confirmer, setConfirmer] = useState(false);

  useEffect(() => setMessage(''), [nom, maximum, categorieIds]);

  function enregistrer(e) {
    e.preventDefault();
    const centimes = lireMontant(maximum);
    if (!nom.trim()) return setMessage('Donne un nom au budget.');
    if (centimes === null || centimes <= 0) return setMessage('Indique un montant maximum, par exemple 300,00.');
    if (categorieIds.length === 0) return setMessage('Choisis au moins une catégorie.');
    const valeurs = { nom: nom.trim(), maximum: centimes, jourDepart, categorieIds, icone };
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
        {!budget && (
          <Apport solde={soldeTotalAu(base, aujourdhui())} maximum={maximum}
            autresBudgets={listerBudgets(base).map((b) => b.maximum)} />
        )}
        <label className="champ">
          <span>Le budget repart chaque mois le</span>
          <select value={jourDepart} onChange={(e) => setJourDepart(Number(e.target.value))}>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((j) => (
              <option key={j} value={j}>{j === 1 ? '1er' : j}</option>
            ))}
          </select>
        </label>
        <ChoixCategories base={base} choisies={categorieIds} choisir={setCategorieIds} />
        <ChoixIcone choisie={icone} choisir={setIcone} />
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

// Les 12 derniers mois du budget (mois en cours compris), jusqu'au plus ancien mois ayant des dépenses.
function moisDuBudget(base, b) {
  const mois = Array.from({ length: 12 }, (_, k) => {
    const periode = periodeBudget(b.jourDepart, decalerMois(aujourdhui(), -k));
    return { periode, depenses: depensesDuBudget(base, b.id, periode) };
  });
  const dernier = mois.map((m) => m.depenses.some((o) => !o.exclue)).lastIndexOf(true);
  return mois.slice(0, Math.max(dernier, 0) + 1);
}

// Détail d'un budget : les dépenses comptées (chacune excluable, D9) et l'historique mois par mois (D46).
function Detail({ base, budget: b, modifier, fermer, rafraichir }) {
  const historique = historiqueBudget(b.maximum, moisDuBudget(base, b));

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
      <h3 className="titre-section">Historique mois par mois</h3>
      <ul className="liste historique-budget">
        {historique.map((h) => (
          <li key={h.periode.debut}>
            <span className="ligne-nom">
              {libellePeriode(h.periode)}
              <small className="texte-2 detail">
                {h.depenses.filter((o) => !o.exclue).length} dépense(s)
                {h.variation !== null && h.variation !== 0 &&
                  ` · ${h.variation > 0 ? '+' : '−'}${formaterEuros(Math.abs(h.variation))} vs mois précédent`}
              </small>
            </span>
            <span className={h.depasse ? 'negatif' : ''}>
              <strong>{formaterEuros(h.depense)}</strong>
              <span className="texte-2"> / {formaterEuros(b.maximum)}</span>
            </span>
          </li>
        ))}
      </ul>
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
