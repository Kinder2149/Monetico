import { useState } from 'react';
import { Pastille } from './Categories.jsx';
import { Feuille } from './Commun.jsx';
import { formaterEuros, partsCamembert, entreesSorties } from '../logique/argent.js';
import { aujourdhui, bornesDuMois, decalerMois, libelleJour, moisCourt, nomDuMois } from '../logique/dates.js';
import { depensesParCategorie, soldeTotalAu, listerOperations } from '../donnees/depot.js';

// Couleurs des parts : la couleur principale de la charte puis des teintes bien distinctes ; gris pour « Autres ».
const COULEURS = ['#0F766E', '#F59E0B', '#6366F1', '#EC4899', '#14B8A6', '#84CC16'];
const GRIS = '#94A3B8';
const couleur = (part, i) => (part.id === 'autres' ? GRIS : COULEURS[i % COULEURS.length]);

const pourcentage = (part) => `${Math.round(part * 100).toLocaleString('fr-FR')} %`;

// Arc d'anneau entre deux fractions du tour (0 = en haut, sens des aiguilles d'une montre).
function arc(debut, fin, r = 80, epaisseur = 28) {
  const point = (f, rayon) => {
    const angle = 2 * Math.PI * f - Math.PI / 2;
    return [100 + rayon * Math.cos(angle), 100 + rayon * Math.sin(angle)];
  };
  const grand = fin - debut > 0.5 ? 1 : 0;
  const ri = r - epaisseur;
  const [x1, y1] = point(debut, r);
  const [x2, y2] = point(fin, r);
  const [x3, y3] = point(fin, ri);
  const [x4, y4] = point(debut, ri);
  return `M${x1} ${y1} A${r} ${r} 0 ${grand} 1 ${x2} ${y2} L${x3} ${y3} A${ri} ${ri} 0 ${grand} 0 ${x4} ${y4} Z`;
}

// Liste en lecture seule des opérations derrière un graphique (D46), avec leur total.
function DetailOperations({ titre, operations, fermer }) {
  const { entrees, sorties } = entreesSorties(operations);
  return (
    <Feuille titre={titre} fermer={fermer}>
      <p className="texte-2">
        {operations.length} opération(s) · {entrees > 0 && `+ ${formaterEuros(entrees)} `}{sorties > 0 && `− ${formaterEuros(sorties)}`}
      </p>
      {operations.length === 0 ? <p className="vide">Aucune opération.</p> : (
        <ul className="liste depenses-budget">
          {operations.map((o) => (
            <li key={o.id}>
              <span className="ligne-nom">
                {o.type === 'transfert' ? 'Transfert' : o.categorie}
                <small className="texte-2 detail">{[libelleJour(o.date), o.note, o.porteMonnaie].filter(Boolean).join(' · ')}</small>
              </span>
              <span className={o.type === 'revenu' ? 'positif' : o.type === 'depense' ? 'negatif' : ''}>
                {o.type === 'revenu' ? '+ ' : o.type === 'depense' ? '− ' : ''}{formaterEuros(o.montant)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Feuille>
  );
}

export function Camembert({ base }) {
  const [mois, setMois] = useState(aujourdhui());
  const [detail, setDetail] = useState(null); // part touchée
  const categories = depensesParCategorie(base, bornesDuMois(mois));
  const { total, parts } = partsCamembert(categories);
  let cumul = 0;

  return (
    <div className="carte">
      <div className="choix-mois">
        <button className="bouton-rond" aria-label="Mois précédent" onClick={() => setMois(decalerMois(mois, -1))}>‹</button>
        <p className="titre-carte">{nomDuMois(mois)}</p>
        <button className="bouton-rond" aria-label="Mois suivant" onClick={() => setMois(decalerMois(mois, 1))}>›</button>
      </div>
      <p className="texte-2 sous-titre-graphique">Où part mon argent</p>

      {total === 0 ? (
        <p className="vide">Aucune dépense ce mois-ci.</p>
      ) : (
        <>
          <svg className="camembert" viewBox="0 0 200 200" role="img"
            aria-label={`Dépenses de ${nomDuMois(mois)} : ${formaterEuros(total)}`}>
            {parts.length === 1
              ? <circle cx="100" cy="100" r="66" fill="none" stroke={couleur(parts[0], 0)} strokeWidth="28"
                className="part-cliquable" role="button" aria-label={`${parts[0].nom} : voir les opérations`}
                onClick={() => setDetail(parts[0])} />
              : parts.map((p, i) => {
                const d = arc(cumul, cumul + p.part);
                cumul += p.part;
                return (
                  <path key={p.id} d={d} fill={couleur(p, i)} stroke="#fff" strokeWidth="2" className="part-cliquable"
                    role="button" aria-label={`${p.nom} : voir les opérations`} onClick={() => setDetail(p)} />
                );
              })}
            <text x="100" y="96" textAnchor="middle" className="camembert-libelle">Dépenses</text>
            <text x="100" y="116" textAnchor="middle" className="camembert-total">{formaterEuros(total)}</text>
          </svg>
          <ul className="legende">
            {parts.map((p, i) => (
              <li key={p.id}>
                <button type="button" className="ligne-legende" onClick={() => setDetail(p)}>
                  <span className="puce-couleur" style={{ background: couleur(p, i) }} aria-hidden="true" />
                  <Pastille categorie={p.id === 'autres' ? { nom: '…', icone: 'ellipsis' } : p} petite />
                  <span className="ligne-nom">{p.nom}</span>
                  <span className="texte-2">{pourcentage(p.part)}</span>
                  <strong>{formaterEuros(p.montant)}</strong>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {detail && (
        <DetailOperations titre={`${detail.nom} · ${nomDuMois(mois)}`} fermer={() => setDetail(null)}
          operations={listerOperations(base, bornesDuMois(mois)).filter((o) => {
            if (o.type !== 'depense') return false;
            const groupe = o.categorieParentId ?? o.categorieId;
            return detail.id === 'autres' ? !parts.some((p) => p.id === groupe) : groupe === detail.id;
          })} />
      )}
    </div>
  );
}

// Solde total à la fin de chacun des 12 derniers mois (D22).
export function CourbeSolde({ base }) {
  const jour = aujourdhui();
  const [choisi, setChoisi] = useState(11); // point touché (11 = mois en cours)
  const [detail, setDetail] = useState(false);
  const points = Array.from({ length: 12 }, (_, i) => {
    const mois = decalerMois(jour, i - 11);
    const { fin } = bornesDuMois(mois);
    return { mois, solde: soldeTotalAu(base, fin < jour ? fin : jour) }; // mois en cours : solde d'aujourd'hui (D41)
  });
  const valeurs = points.map((p) => p.solde);
  const min = Math.min(0, ...valeurs);
  const max = Math.max(0, ...valeurs);
  const ecart = max - min || 1;
  const largeur = 320;
  const hauteur = 140;
  const x = (i) => 16 + (i * (largeur - 32)) / 11;
  const y = (v) => 12 + ((max - v) * (hauteur - 24)) / ecart;
  const dernier = points.at(-1);
  const pointChoisi = points[choisi];
  const bornes = bornesDuMois(pointChoisi.mois);
  const operationsMois = listerOperations(base, { debut: bornes.debut, fin: bornes.fin < jour ? bornes.fin : jour });
  const variationMois = (() => { const { entrees, sorties } = entreesSorties(operationsMois); return entrees - sorties; })();

  return (
    <div className="carte">
      <p className="titre-carte">Évolution du solde</p>
      <p className="texte-2 sous-titre-graphique">Solde total en fin de mois, sur 12 mois</p>
      <p className="valeur-courbe">{formaterEuros(dernier.solde)}</p>
      <svg className="courbe" viewBox={`0 0 ${largeur} ${hauteur + 22}`} role="img"
        aria-label={`Solde total : ${points.map((p) => `${moisCourt(p.mois)} ${formaterEuros(p.solde)}`).join(', ')}`}>
        {min < 0 && <line x1="0" x2={largeur} y1={y(0)} y2={y(0)} className="ligne-zero" />}
        <polyline points={points.map((p, i) => `${x(i)},${y(p.solde)}`).join(' ')} className="trace" />
        {points.map((p, i) => (
          <g key={p.mois}>
            <circle cx={x(i)} cy={y(p.solde)} r={i === choisi ? 6 : 3.5} className={(p.solde < 0 ? 'point negatif-point' : 'point') + (i === choisi ? ' point-choisi' : '')} />
            <circle cx={x(i)} cy={y(p.solde)} r="14" className="zone-point" role="button"
              aria-label={`${nomDuMois(p.mois)} : ${formaterEuros(p.solde)}`} onClick={() => setChoisi(i)} />
            <text x={x(i)} y={hauteur + 16} textAnchor="middle" className="mois-courbe">{moisCourt(p.mois).replace('.', '')}</text>
          </g>
        ))}
      </svg>
      <div className="releve-courbe" aria-live="polite">
        <span className="texte-2">{nomDuMois(pointChoisi.mois)}{choisi === 11 ? " (aujourd'hui)" : ' (fin de mois)'}</span>
        <strong className={pointChoisi.solde < 0 ? 'negatif' : ''}>{pointChoisi.solde < 0 ? '− ' : ''}{formaterEuros(Math.abs(pointChoisi.solde))}</strong>
        <span className="texte-2">Variation du mois : {variationMois < 0 ? '− ' : '+ '}{formaterEuros(Math.abs(variationMois))}</span>
        <button type="button" className="bouton secondaire" onClick={() => setDetail(true)}>Voir les opérations du mois</button>
      </div>
      {detail && <DetailOperations titre={nomDuMois(pointChoisi.mois)} operations={operationsMois} fermer={() => setDetail(false)} />}
    </div>
  );
}

// Écran Graphiques (ouvert depuis la carte du mois de l'accueil, D27) : seulement ces deux graphiques (D11).
export default function Graphiques({ base }) {
  return (
    <>
      <Camembert base={base} />
      <CourbeSolde base={base} />
    </>
  );
}
