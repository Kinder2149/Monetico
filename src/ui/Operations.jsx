import { useEffect, useRef, useState } from 'react';
import { Pastille } from './Categories.jsx';
import { Feuille } from './Commun.jsx';
import { FenetreCategories } from './Saisie.jsx';
import { IconeTransfert } from './Icones.jsx';
import { formaterEuros, parJour, rechercher, entreesSorties } from '../logique/argent.js';
import {
  aujourdhui, bornesDuMois, decaler, decalerMois, jourPrevu, libelleJour, libelleOngletMois, moisDe, moisEntre,
} from '../logique/dates.js';
import { listerOperations, listerPorteMonnaie, listerCategories, recurrentesAValider } from '../donnees/depot.js';

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

// Appui long sur une opération : modifier, dupliquer (D46) ou supprimer (D38).
function MenuOperation({ operation: o, ouvrir, fermer }) {
  const titre = o.type === 'transfert' ? 'Transfert' : o.categorie;
  return (
    <Feuille titre={`${titre} · ${formaterEuros(o.montant)}`} fermer={fermer}>
      <p className="texte-2">{[libelleJour(o.date), o.note].filter(Boolean).join(' · ')}</p>
      <button className="bouton" onClick={() => { fermer(); ouvrir(o); }}>Modifier</button>
      <button className="bouton secondaire espace-haut" onClick={() => { fermer(); ouvrir({ ...o, dupliquer: true }); }}>Dupliquer</button>
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

const eurosSignes = (v) => `${v < 0 ? '− ' : ''}${formaterEuros(Math.abs(v))}`;

// Résumé de la période (D44) : le solde du compte en grand au centre, puis entrées, sorties et variation.
// `solde` : solde du compte à la fin de la période ; `legende` : d'où il vient.
function ResumePeriode({ elements, titre, solde, legende, libelleVariation }) {
  const { entrees, sorties } = entreesSorties(elements);
  const variation = entrees - sorties;
  return (
    <div className="carte resume-periode">
      {solde !== null && (
        <div className="solde-hero">
          <span className="texte-2">{titre}</span>
          <strong className={'solde-grand' + (solde < 0 ? ' negatif' : '')}>{eurosSignes(solde)}</strong>
          {legende && <small className="texte-2">{legende}</small>}
        </div>
      )}
      <div><span className="texte-2">Entrées</span><strong className="positif">+ {formaterEuros(entrees)}</strong></div>
      <div><span className="texte-2">Sorties</span><strong className="negatif">− {formaterEuros(sorties)}</strong></div>
      <div className="total-periode">
        <span>{libelleVariation}</span>
        <strong className={variation < 0 ? 'negatif' : ''}>{eurosSignes(variation)}</strong>
      </div>
    </div>
  );
}

// Solde des porte-monnaie affichés au soir du jour donné.
const soldeAu = (base, porteMonnaieId, date) =>
  listerPorteMonnaie(base, date).filter((p) => porteMonnaieId === null || p.id === porteMonnaieId)
    .reduce((somme, p) => somme + p.solde, 0);

// Glisser le doigt à l'horizontale change de période (D44), en carrousel (D46) : le contenu suit le doigt,
// puis sort d'un côté pendant que le suivant arrive de l'autre. Vers la gauche = plus tard, vers la droite = plus tôt.
function useGlisser(peutPlusTard, peutPlusTot, versPlusTard, versPlusTot) {
  const zone = useRef(null);
  const depart = useRef(null);
  const horizontal = useRef(false);
  const occupe = useRef(false);

  const poser = (x, animer) => {
    const el = zone.current;
    if (!el) return;
    el.style.transition = animer ? 'transform .2s ease-out, opacity .2s ease-out' : 'none';
    el.style.transform = x ? `translateX(${x}px)` : '';
    el.style.opacity = x ? String(Math.max(0.3, 1 - Math.abs(x) / (el.offsetWidth * 1.3))) : '';
  };
  const permis = (dx) => (dx < 0 ? peutPlusTard : peutPlusTot);

  return {
    ref: zone,
    onTouchStart: (e) => {
      if (occupe.current) return;
      depart.current = [e.touches[0].clientX, e.touches[0].clientY];
      horizontal.current = false;
    },
    onTouchMove: (e) => {
      if (!depart.current) return;
      const dx = e.touches[0].clientX - depart.current[0];
      const dy = e.touches[0].clientY - depart.current[1];
      if (!horizontal.current) {
        if (Math.abs(dx) > 12 && Math.abs(dx) > 1.4 * Math.abs(dy)) horizontal.current = true;
        else return;
      }
      poser(permis(dx) ? dx : dx * 0.25, false);
    },
    onTouchEnd: (e) => {
      if (!depart.current) return;
      const dx = e.changedTouches[0].clientX - depart.current[0];
      const etaitHorizontal = horizontal.current;
      depart.current = null;
      horizontal.current = false;
      if (!etaitHorizontal) return;
      const largeur = zone.current?.offsetWidth ?? 360;
      if (Math.abs(dx) < 80 || !permis(dx)) return poser(0, true);
      occupe.current = true;
      poser(dx < 0 ? -largeur : largeur, true);
      setTimeout(() => {
        (dx < 0 ? versPlusTard : versPlusTot)();
        poser(dx < 0 ? largeur : -largeur, false);
        zone.current?.offsetWidth; // fixe la position de départ avant l'arrivée
        poser(0, true);
        occupe.current = false;
      }, 190);
    },
    onTouchCancel: () => { depart.current = null; horizontal.current = false; poser(0, true); },
  };
}

// Récurrentes pas encore validées, ce mois-ci et le mois prochain, datées au plus tôt demain.
function recurrentesPrevues(base, compteId, jour) {
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

  const [filtre, setFiltre] = useState({ compte: null, categorie: null }); // D46
  const [fenetre, setFenetre] = useState(null); // 'compte' ou 'categorie'
  const comptes = listerPorteMonnaie(base);
  const compteId = filtre.compte ?? porteMonnaieId;
  const categories = [...listerCategories(base, 'depense'), ...listerCategories(base, 'revenu')];
  const categorieFiltree = categories.flatMap((c) => [c, ...c.sous]).find((c) => c.id === filtre.categorie);
  const toutes = listerOperations(base, { porteMonnaieId: compteId })
    .filter((o) => !filtre.categorie || o.categorieId === filtre.categorie || o.categorieParentId === filtre.categorie);
  const plusAncienne = toutes.at(-1)?.date ?? jour;
  const mois = moisEntre(plusAncienne < jour ? plusAncienne : jour, jour);

  useEffect(() => {
    ongletActif.current?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [periode]);

  const periodes = [...mois, A_VENIR];
  const position = periodes.indexOf(periode);
  const glisser = useGlisser(
    position < periodes.length - 1, position > 0,
    () => setPeriode(periodes[position + 1]),
    () => setPeriode(periodes[position - 1]),
  );

  let contenu;
  if (recherche.trim()) {
    contenu = (
      <ListeOperations operations={rechercher(toutes, recherche)} ouvrir={ouvrir} vide="Aucune opération ne correspond." />
    );
  } else if (periode === A_VENIR) {
    const operations = toutes.filter((o) => o.date > jour);
    const prevues = recurrentesPrevues(base, compteId, jour);
    // Solde prévu = solde d'aujourd'hui + opérations datées plus tard + récurrentes encore à valider.
    const actuel = soldeAu(base, compteId, jour);
    const { entrees, sorties } = entreesSorties([...operations, ...prevues]);
    const soldePrevu = soldeAu(base, compteId, '9999-12-31') + entreesSorties(prevues).entrees - entreesSorties(prevues).sorties;
    const legende = operations.length + prevues.length === 0
      ? "Rien de prévu : le solde prévu est le solde d'aujourd'hui."
      : `Aujourd'hui ${eurosSignes(actuel)} ${entrees - sorties < 0 ? '−' : '+'} à venir ${formaterEuros(Math.abs(entrees - sorties))}`;
    contenu = (
      <>
        <ResumePeriode elements={[...operations, ...prevues]} titre="Solde prévu" solde={filtre.categorie ? null : soldePrevu}
          legende={legende} libelleVariation="Total à venir" />
        <ListeOperations operations={operations} prevues={prevues} croissant ouvrir={ouvrir}
          vide="Rien de prévu : ni opération datée après aujourd'hui, ni récurrente à valider." />
      </>
    );
  } else {
    const { debut, fin } = bornesDuMois(`${periode}-01`);
    const operations = toutes.filter((o) => o.date >= debut && o.date <= (fin < jour ? fin : jour));
    const soldeFin = soldeAu(base, compteId, fin < jour ? fin : jour);
    contenu = (
      <>
        <ResumePeriode elements={operations} titre={fin >= jour ? "Solde aujourd'hui" : 'Solde en fin de mois'} solde={filtre.categorie ? null : soldeFin}
          legende="Solde du compte, tout l'historique compris" libelleVariation="Variation du mois (entrées − sorties)" />
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
      <div className="filtres">
        <button className={'puce' + (filtre.compte ? ' active' : '')} onClick={() => setFenetre('compte')}>
          {filtre.compte ? comptes.find((p) => p.id === filtre.compte)?.nom : 'Tous les comptes'} ▾
        </button>
        <button className={'puce' + (filtre.categorie ? ' active' : '')} onClick={() => setFenetre('categorie')}>
          {categorieFiltree ? categorieFiltree.nom : 'Toutes les catégories'} ▾
        </button>
        {(filtre.compte || filtre.categorie) && (
          <button className="puce" onClick={() => setFiltre({ compte: null, categorie: null })}>× Effacer</button>
        )}
      </div>
      {fenetre === 'compte' && (
        <Feuille titre="Filtrer par compte" fermer={() => setFenetre(null)}>
          <button className="bouton secondaire espace-haut" onClick={() => { setFiltre({ ...filtre, compte: null }); setFenetre(null); }}>Tous les comptes</button>
          {comptes.map((p) => (
            <button key={p.id} className="bouton secondaire espace-haut"
              onClick={() => { setFiltre({ ...filtre, compte: p.id }); setFenetre(null); }}>{p.nom}</button>
          ))}
        </Feuille>
      )}
      {fenetre === 'categorie' && (
        <FenetreCategories categories={categories} choisie={filtre.categorie}
          prendre={(id) => { setFiltre({ ...filtre, categorie: id }); setFenetre(null); }} fermer={() => setFenetre(null)} />
      )}
      {!recherche.trim() && (
        <div className="onglets-mois" role="tablist">
          {periodes.map((m) => (
            <button key={m} role="tab" aria-selected={periode === m} ref={periode === m ? ongletActif : null}
              className={periode === m ? 'actif' : ''} onClick={() => setPeriode(m)}>
              {m === A_VENIR ? 'À venir' : libelleOngletMois(m, jour)}
            </button>
          ))}
        </div>
      )}
      <div className="cadre-glisser">
        <div className="zone-glisser" {...(recherche.trim() ? {} : glisser)}>{contenu}</div>
      </div>
    </>
  );
}
