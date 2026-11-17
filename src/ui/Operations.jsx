import { useEffect, useRef, useState } from 'react';
import { Pastille } from './Categories.jsx';
import { Feuille } from './Commun.jsx';
import { IconeTransfert } from './Icones.jsx';
import { formaterEuros, parJour, rechercher, entreesSorties } from '../logique/argent.js';
import {
  aujourdhui, bornesDuMois, decaler, decalerMois, jourPrevu, libelleJour, libelleOngletMois, moisDe, moisEntre,
} from '../logique/dates.js';
import { listerOperations, recurrentesAValider } from '../donnees/depot.js';

const DUREE_APPUI_LONG = 500; // millisecondes

// Toucher = `toucher` ; appui long (sans bouger le doigt) = `appuiLong` (D38).
function useAppuiLong(toucher, appuiLong) {
  const minuterie = useRef(null);
  const depart = useRef(null);
  const declenche = useRef(false);
  const arreter = () => { clearTimeout(minuterie.current); minuterie.current = null; };
  useEffect(() => arreter, []);
  if (!appuiLong) return { onClick: toucher };
  return {
    onPointerDown: (e) => {
      declenche.current = false;
      depart.current = [e.clientX, e.clientY];
      arreter();
      minuterie.current = setTimeout(() => { declenche.current = true; appuiLong(); }, DUREE_APPUI_LONG);
    },
    onPointerMove: (e) => {
      if (!depart.current) return;
      const [x, y] = depart.current;
      if (Math.abs(e.clientX - x) > 10 || Math.abs(e.clientY - y) > 10) arreter();
    },
    onPointerUp: arreter,
    onPointerCancel: arreter,
    onPointerLeave: arreter,
    onContextMenu: (e) => e.preventDefault(),
    onClick: () => { if (!declenche.current) toucher(); },
  };
}

function LigneOperation({ operation: o, ouvrir, menu }) {
  const appui = useAppuiLong(() => ouvrir(o), menu && (() => menu(o)));
  if (o.type === 'transfert') {
    return (
      <button className="ligne" {...appui}>
        <span className="pastille transfert" aria-hidden="true"><IconeTransfert /></span>
        <span className="ligne-nom">
          Transfert
          <small className="texte-2 detail">
            {[`${o.porteMonnaie} → ${o.versPorteMonnaie}`, o.note].filter(Boolean).join(' · ')}
          </small>
        </span>
        <span>{formaterEuros(o.montant)}</span>
      </button>
    );
  }
  const signe = o.type === 'revenu' ? '+' : '−';
  return (
    <button className="ligne" {...appui}>
      <Pastille categorie={{ nom: o.categorie ?? '?', icone: o.icone }} />
      <span className="ligne-nom">
        {o.categorie}
        <small className="texte-2 detail">
          {[o.categorieParent, o.note, o.porteMonnaie].filter(Boolean).join(' · ')}
        </small>
      </span>
      <span className={o.type === 'revenu' ? 'positif' : 'negatif'}>{signe} {formaterEuros(o.montant)}</span>
    </button>
  );
}

// Récurrente pas encore validée, affichée dans « À venir » à titre indicatif.
function LignePrevue({ prevue: r }) {
  const signe = r.type === 'revenu' ? '+' : '−';
  return (
    <div className="ligne prevue">
      <Pastille categorie={{ nom: r.categorie, icone: r.icone }} />
      <span className="ligne-nom">
        {r.categorie}
        <small className="texte-2 detail">{['Récurrente à valider', r.note, r.porteMonnaie].filter(Boolean).join(' · ')}</small>
      </span>
      <span className={r.type === 'revenu' ? 'positif' : 'negatif'}>{signe} {formaterEuros(r.montant)}</span>
    </div>
  );
}

// Appui long sur une opération : modifier ou supprimer (D38).
function MenuOperation({ operation: o, ouvrir, fermer }) {
  const titre = o.type === 'transfert' ? 'Transfert' : o.categorie;
  return (
    <Feuille titre={`${titre} · ${formaterEuros(o.montant)}`} fermer={fermer}>
      <p className="texte-2">{[libelleJour(o.date), o.note].filter(Boolean).join(' · ')}</p>
      <button className="bouton" onClick={() => { fermer(); ouvrir(o); }}>Modifier</button>
      <button className="bouton danger espace-haut" onClick={() => { fermer(); ouvrir({ ...o, aSupprimer: true }); }}>Supprimer</button>
      <button className="bouton secondaire espace-haut" onClick={fermer}>Annuler</button>
    </Feuille>
  );
}

// Liste d'opérations regroupées par jour, réutilisée par l'accueil.
// `prevues` : récurrentes à valider, mêlées aux opérations (onglet « À venir ») ; `croissant` : plus proches d'abord.
export function ListeOperations({ operations, ouvrir, vide, prevues = [], croissant = false }) {
  const [menu, setMenu] = useState(null);
  const elements = [
    ...operations,
    ...prevues.map((r) => ({ ...r, prevue: true })),
  ].sort((a, b) => (croissant ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)));
  if (elements.length === 0) return <p className="vide">{vide}</p>;
  return (
    <>
      {parJour(elements).map(({ jour, operations: duJour }) => (
        <section key={jour}>
          <h2 className="titre-section">{libelleJour(jour)}</h2>
          <ul className="carte liste">
            {duJour.map((o) => (
              <li key={o.prevue ? `prevue-${o.id}-${o.date}` : o.id}>
                {o.prevue ? <LignePrevue prevue={o} /> : <LigneOperation operation={o} ouvrir={ouvrir} menu={setMenu} />}
              </li>
            ))}
          </ul>
        </section>
      ))}
      {menu && <MenuOperation operation={menu} ouvrir={ouvrir} fermer={() => setMenu(null)} />}
    </>
  );
}

// Entrées, sorties et total de la période affichée.
function ResumePeriode({ elements }) {
  const { entrees, sorties } = entreesSorties(elements);
  const solde = entrees - sorties;
  return (
    <div className="carte resume-periode">
      <div><span className="texte-2">Entrées</span><strong className="positif">+ {formaterEuros(entrees)}</strong></div>
      <div><span className="texte-2">Sorties</span><strong className="negatif">− {formaterEuros(sorties)}</strong></div>
      <div className="total-periode">
        <span>Total</span>
        <strong className={solde < 0 ? 'negatif' : ''}>{solde < 0 ? '− ' : ''}{formaterEuros(Math.abs(solde))}</strong>
      </div>
    </div>
  );
}

// Récurrentes pas encore validées, ce mois-ci et le mois prochain, datées au plus tôt demain.
function recurrentesPrevues(base, porteMonnaieId, jour) {
  const demain = decaler(jour, 1);
  return [jour, decalerMois(`${moisDe(jour)}-01`, 1)].flatMap((dansLeMois) =>
    recurrentesAValider(base, moisDe(dansLeMois))
      .filter((r) => porteMonnaieId === null || r.porteMonnaieId === porteMonnaieId)
      .map((r) => {
        const prevu = jourPrevu(r.jour, dansLeMois);
        return { ...r, date: prevu < demain ? demain : prevu };
      }));
}

const A_VENIR = 'avenir';

// Onglet Opérations (D37) : un onglet par mois, du plus ancien à « Ce mois-ci », puis « À venir ».
export default function Operations({ base, porteMonnaieId, ouvrir, rechercheInitiale = false }) {
  const jour = aujourdhui();
  const [recherche, setRecherche] = useState('');
  const [periode, setPeriode] = useState(moisDe(jour));
  const ongletActif = useRef(null);

  const toutes = listerOperations(base, { porteMonnaieId });
  const plusAncienne = toutes.at(-1)?.date ?? jour;
  const mois = moisEntre(plusAncienne < jour ? plusAncienne : jour, jour);

  useEffect(() => {
    ongletActif.current?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [periode]);

  let contenu;
  if (recherche.trim()) {
    contenu = (
      <ListeOperations operations={rechercher(toutes, recherche)} ouvrir={ouvrir} vide="Aucune opération ne correspond." />
    );
  } else if (periode === A_VENIR) {
    const operations = toutes.filter((o) => o.date > jour);
    const prevues = recurrentesPrevues(base, porteMonnaieId, jour);
    contenu = (
      <>
        <ResumePeriode elements={[...operations, ...prevues]} />
        <ListeOperations operations={operations} prevues={prevues} croissant ouvrir={ouvrir}
          vide="Rien de prévu : ni opération datée après aujourd'hui, ni récurrente à valider." />
      </>
    );
  } else {
    const { debut, fin } = bornesDuMois(`${periode}-01`);
    const operations = toutes.filter((o) => o.date >= debut && o.date <= (fin < jour ? fin : jour));
    contenu = (
      <>
        <ResumePeriode elements={operations} />
        <ListeOperations operations={operations} ouvrir={ouvrir}
          vide={toutes.length ? 'Aucune opération ce mois-là.' : 'Aucune opération pour le moment. Touche « + » pour en ajouter une.'} />
      </>
    );
  }

  return (
    <>
      <label className="champ recherche">
        <span className="sr">Rechercher</span>
        <input type="search" value={recherche} onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher une note ou une catégorie" autoFocus={rechercheInitiale} />
      </label>
      {!recherche.trim() && (
        <div className="onglets-mois" role="tablist">
          {[...mois, A_VENIR].map((m) => (
            <button key={m} role="tab" aria-selected={periode === m} ref={periode === m ? ongletActif : null}
              className={periode === m ? 'actif' : ''} onClick={() => setPeriode(m)}>
              {m === A_VENIR ? 'À venir' : libelleOngletMois(m, jour)}
            </button>
          ))}
        </div>
      )}
      {contenu}
    </>
  );
}
