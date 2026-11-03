import { formaterEuros, total } from '../logique/argent.js';

// Sélecteur « Tous les comptes » / un porte-monnaie, et solde correspondant.
export default function Accueil({ porteMonnaie, choix, choisir }) {
  const affiches = choix === 'tous' ? porteMonnaie : porteMonnaie.filter((p) => p.id === choix);

  return (
    <>
      <label className="selecteur">
        <span className="sr">Porte-monnaie affiché</span>
        <select value={choix} onChange={(e) => choisir(e.target.value === 'tous' ? 'tous' : Number(e.target.value))}>
          <option value="tous">Tous les comptes</option>
          {porteMonnaie.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
        </select>
      </label>
      <p className="texte-2 libelle-solde">Solde</p>
      <p className="solde">{formaterEuros(total(affiches))}</p>
    </>
  );
}
