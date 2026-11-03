import { useState } from 'react';
import { Pastille } from './Categories.jsx';
import { formaterEuros, partsCamembert } from '../logique/argent.js';
import { aujourdhui, bornesDuMois, decalerMois, moisCourt, nomDuMois } from '../logique/dates.js';
import { depensesParCategorie, soldeTotalAu } from '../donnees/depot.js';

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

function Camembert({ base }) {
  const [mois, setMois] = useState(aujourdhui());
  const { total, parts } = partsCamembert(depensesParCategorie(base, bornesDuMois(mois)));
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
              ? <circle cx="100" cy="100" r="66" fill="none" stroke={couleur(parts[0], 0)} strokeWidth="28" />
              : parts.map((p, i) => {
                const d = arc(cumul, cumul + p.part);
                cumul += p.part;
                return <path key={p.id} d={d} fill={couleur(p, i)} stroke="#fff" strokeWidth="2" />;
              })}
            <text x="100" y="96" textAnchor="middle" className="camembert-libelle">Dépenses</text>
            <text x="100" y="116" textAnchor="middle" className="camembert-total">{formaterEuros(total)}</text>
          </svg>
          <ul className="legende">
            {parts.map((p, i) => (
              <li key={p.id}>
                <span className="puce-couleur" style={{ background: couleur(p, i) }} aria-hidden="true" />
                <Pastille categorie={p.id === 'autres' ? { nom: '…', icone: 'ellipsis' } : p} petite />
                <span className="ligne-nom">{p.nom}</span>
                <span className="texte-2">{pourcentage(p.part)}</span>
                <strong>{formaterEuros(p.montant)}</strong>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

// Solde total à la fin de chacun des 12 derniers mois (D22).
function CourbeSolde({ base }) {
  const jour = aujourdhui();
  const points = Array.from({ length: 12 }, (_, i) => {
    const mois = decalerMois(jour, i - 11);
    return { mois, solde: soldeTotalAu(base, bornesDuMois(mois).fin) };
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
            <circle cx={x(i)} cy={y(p.solde)} r={i === 11 ? 5 : 3.5} className={p.solde < 0 ? 'point negatif-point' : 'point'} />
            <text x={x(i)} y={hauteur + 16} textAnchor="middle" className="mois-courbe">{moisCourt(p.mois).replace('.', '')}</text>
          </g>
        ))}
      </svg>
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
