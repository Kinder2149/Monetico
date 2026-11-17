import { useEffect, useState } from 'react';
import { Feuille, Champ, Message } from './Commun.jsx';
import { Pastille } from './Categories.jsx';
import { ChoixCategorie, ChoixPorteMonnaie } from './Saisie.jsx';
import { formaterEuros, lireMontant, montantPourSaisie } from '../logique/argent.js';
import { aujourdhui, jourPrevu, libelleJour } from '../logique/dates.js';
import {
  listerRecurrentes, creerRecurrente, modifierRecurrente, supprimerRecurrente,
  recurrentesAValider, validerRecurrente,
} from '../donnees/depot.js';

const signe = (r) => (r.type === 'revenu' ? '+' : '−');
const couleur = (r) => (r.type === 'revenu' ? 'positif' : 'negatif');

function Formulaire({ base, porteMonnaie, recurrente, fermer, rafraichir }) {
  const [type, setType] = useState(recurrente?.type ?? 'depense');
  const [montant, setMontant] = useState(recurrente ? montantPourSaisie(recurrente.montant) : '');
  const [categorieId, setCategorieId] = useState(recurrente?.categorieId ?? null);
  const [porteMonnaieId, setPorteMonnaieId] = useState(recurrente?.porteMonnaieId ?? porteMonnaie[0]?.id ?? null);
  const [jour, setJour] = useState(recurrente?.jour ?? 1);
  const [note, setNote] = useState(recurrente?.note ?? '');
  const [message, setMessage] = useState('');
  const [confirmer, setConfirmer] = useState(false);

  useEffect(() => setMessage(''), [type, montant, categorieId, porteMonnaieId, jour]);

  if (porteMonnaie.length === 0) {
    return (
      <Feuille titre="Nouvelle récurrente" fermer={fermer}>
        <p className="texte-2">Crée d'abord un porte-monnaie dans l'onglet Comptes.</p>
        <button className="bouton" onClick={fermer}>Compris</button>
      </Feuille>
    );
  }

  function changerType(nouveau) {
    if (nouveau !== type) setCategorieId(null);
    setType(nouveau);
  }

  function enregistrer(e) {
    e.preventDefault();
    const centimes = lireMontant(montant);
    if (centimes === null || centimes <= 0) return setMessage('Indique un montant, par exemple 12,50.');
    if (!categorieId) return setMessage('Choisis une catégorie.');
    const valeurs = { type, montant: centimes, categorieId, porteMonnaieId, jour, note: note.trim() };
    if (recurrente) modifierRecurrente(base, recurrente.id, valeurs);
    else creerRecurrente(base, valeurs);
    rafraichir();
    fermer();
  }

  function supprimer() {
    supprimerRecurrente(base, recurrente.id);
    rafraichir();
    fermer();
  }

  if (confirmer) {
    return (
      <Feuille titre="Supprimer cette récurrente ?" fermer={fermer}>
        <p className="texte-2">Elle ne sera plus proposée chaque mois. Les opérations déjà validées restent dans la liste.</p>
        <div className="actions">
          <button className="bouton secondaire" onClick={() => setConfirmer(false)}>Annuler</button>
          <button className="bouton danger" onClick={supprimer}>Supprimer</button>
        </div>
      </Feuille>
    );
  }

  return (
    <Feuille titre={recurrente ? 'Modifier la récurrente' : 'Nouvelle récurrente'} fermer={fermer}>
      <form onSubmit={enregistrer}>
        <div className="bascule" role="tablist">
          <button type="button" role="tab" aria-selected={type === 'depense'}
            className={type === 'depense' ? 'actif' : ''} onClick={() => changerType('depense')}>Dépense</button>
          <button type="button" role="tab" aria-selected={type === 'revenu'}
            className={type === 'revenu' ? 'actif' : ''} onClick={() => changerType('revenu')}>Revenu</button>
        </div>
        <Champ libelle="Montant (€)" value={montant} onChange={(e) => setMontant(e.target.value)}
          inputMode="decimal" placeholder="0,00" className="montant-saisie" />
        <ChoixCategorie key={type} base={base} type={type} choisie={categorieId} choisir={setCategorieId} />
        <ChoixPorteMonnaie libelle="Porte-monnaie" porteMonnaie={porteMonnaie} valeur={porteMonnaieId} choisir={setPorteMonnaieId} />
        <label className="champ">
          <span>Jour prévu chaque mois</span>
          <select value={jour} onChange={(e) => setJour(Number(e.target.value))}>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((j) => (
              <option key={j} value={j}>{j === 1 ? '1er' : `le ${j}`}</option>
            ))}
          </select>
        </label>
        <Champ libelle="Note (facultative)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Loyer, Salaire…" />
        <Message texte={message} />
        <button className="bouton" type="submit">Enregistrer</button>
        {recurrente && (
          <button className="bouton lien-danger" type="button" onClick={() => setConfirmer(true)}>
            Supprimer cette récurrente
          </button>
        )}
      </form>
    </Feuille>
  );
}

// Écran des récurrentes (onglet Comptes) : liste, ajout, modification, suppression.
export default function Recurrentes({ base, porteMonnaie, rafraichir }) {
  const [edition, setEdition] = useState(null); // null, 'nouvelle' ou une récurrente
  const recurrentes = listerRecurrentes(base);

  return (
    <>
      {recurrentes.length === 0 ? (
        <p className="vide">Aucune opération récurrente. Ajoute par exemple ton loyer ou ton salaire.</p>
      ) : (
        <ul className="carte liste">
          {recurrentes.map((r) => (
            <li key={r.id}>
              <button className="ligne" onClick={() => setEdition(r)}>
                <Pastille categorie={{ nom: r.categorie, icone: r.icone }} />
                <span className="ligne-nom">
                  {r.categorie}
                  <small className="texte-2 detail">
                    {[r.jour === 1 ? 'Le 1er du mois' : `Le ${r.jour} du mois`, r.note, r.porteMonnaie].filter(Boolean).join(' · ')}
                  </small>
                </span>
                <span className={couleur(r)}>{signe(r)} {formaterEuros(r.montant)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <button className="bouton" onClick={() => setEdition('nouvelle')}>Ajouter une récurrente</button>
      {edition && (
        <Formulaire base={base} porteMonnaie={porteMonnaie} recurrente={edition === 'nouvelle' ? null : edition}
          fermer={() => setEdition(null)} rafraichir={rafraichir} />
      )}
    </>
  );
}

// Validation avec la date réelle d'encaissement (jour prévu proposé).
function Validation({ base, recurrente: r, mois, fermer, rafraichir }) {
  const [date, setDate] = useState(jourPrevu(r.jour));
  const [message, setMessage] = useState('');

  function valider(e) {
    e.preventDefault();
    if (!date) return setMessage('Choisis une date.');
    validerRecurrente(base, r, mois, date);
    rafraichir();
    fermer();
  }

  return (
    <Feuille titre={`Valider : ${r.categorie}`} fermer={fermer}>
      <form onSubmit={valider}>
        <p className="texte-2">
          {r.type === 'revenu' ? 'Revenu' : 'Dépense'} de {formaterEuros(r.montant)} sur {r.porteMonnaie}.
          Le solde change une fois validé.
        </p>
        <Champ libelle="Date réelle d'encaissement" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Message texte={message} />
        <button className="bouton" type="submit">Valider</button>
      </form>
    </Feuille>
  );
}

// Cartes « À valider » de l'accueil : récurrentes du mois en cours pas encore validées.
export function AValider({ base, rafraichir }) {
  const [enValidation, setEnValidation] = useState(null);
  const mois = aujourdhui().slice(0, 7);
  const aValider = recurrentesAValider(base, mois);
  if (aValider.length === 0) return null;

  return (
    <>
      {aValider.map((r) => (
        <div key={r.id} className="carte a-valider">
          <p className="titre-carte">À valider</p>
          <div className="ligne">
            <Pastille categorie={{ nom: r.categorie, icone: r.icone }} />
            <span className="ligne-nom">
              {r.categorie}
              <small className="texte-2 detail">{[`Prévu ${libelleJour(jourPrevu(r.jour)).toLowerCase()}`, r.note].filter(Boolean).join(' · ')}</small>
            </span>
            <span className={couleur(r)}>{signe(r)} {formaterEuros(r.montant)}</span>
          </div>
          <button className="bouton" onClick={() => setEnValidation(r)}>Valider</button>
        </div>
      ))}
      {enValidation && (
        <Validation base={base} recurrente={enValidation} mois={mois}
          fermer={() => setEnValidation(null)} rafraichir={rafraichir} />
      )}
    </>
  );
}
