import { useEffect, useState } from 'react';
import { Feuille, Champ, Message } from './Commun.jsx';
import { Pastille } from './Categories.jsx';
import { lireMontant, montantPourSaisie } from '../logique/argent.js';
import { aujourdhui } from '../logique/dates.js';
import { listerCategories, creerOperation, modifierOperation, supprimerOperation } from '../donnees/depot.js';

// Menu déroulant des catégories (D36) : le champ montre la catégorie choisie ; ouvert, il liste
// les catégories, et la flèche d'une catégorie déplie ses sous-catégories.
export function ChoixCategorie({ base, type, choisie, choisir }) {
  const categories = listerCategories(base, type);
  const actuelle = categories.flatMap((c) => [c, ...c.sous]).find((c) => c.id === choisie);
  const parent = categories.find((c) => c.sous.some((s) => s.id === choisie));
  const [ouvert, setOuvert] = useState(false);
  const [deplie, setDeplie] = useState(parent?.id ?? null);

  function prendre(id) {
    choisir(id);
    setOuvert(false);
  }

  return (
    <div className="champ">
      <span>Catégorie</span>
      <button type="button" className={'ligne choix-actuel' + (ouvert ? ' ouvert' : '')} aria-expanded={ouvert}
        onClick={() => setOuvert(!ouvert)}>
        {actuelle ? <Pastille categorie={actuelle} petite /> : null}
        <span className="ligne-nom">
          {actuelle ? (parent ? `${parent.nom} › ${actuelle.nom}` : actuelle.nom) : 'Choisir une catégorie'}
        </span>
        <span className="fleche" aria-hidden="true">{ouvert ? '▴' : '▾'}</span>
      </button>
      {ouvert && (
        <ul className="liste-deroulante">
          {categories.map((c) => (
            <li key={c.id}>
              <div className="option-categorie">
                <button type="button" className={'option' + (c.id === choisie ? ' choisie' : '')} onClick={() => prendre(c.id)}>
                  <Pastille categorie={c} petite />
                  <span className="ligne-nom">{c.nom}</span>
                </button>
                {c.sous.length > 0 && (
                  <button type="button" className="deplier" aria-expanded={deplie === c.id}
                    aria-label={`${deplie === c.id ? 'Replier' : 'Déplier'} les sous-catégories de ${c.nom}`}
                    onClick={() => setDeplie(deplie === c.id ? null : c.id)}>
                    {c.sous.length} {deplie === c.id ? '▴' : '▾'}
                  </button>
                )}
              </div>
              {deplie === c.id && c.sous.map((x) => (
                <button key={x.id} type="button" className={'option sous' + (x.id === choisie ? ' choisie' : '')}
                  onClick={() => prendre(x.id)}>
                  <Pastille categorie={x} petite />
                  <span className="ligne-nom">{x.nom}</span>
                </button>
              ))}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ChoixPorteMonnaie({ libelle, porteMonnaie, valeur, choisir }) {
  return (
    <label className="champ">
      <span>{libelle}</span>
      <select value={valeur ?? ''} onChange={(e) => choisir(Number(e.target.value))}>
        {porteMonnaie.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
      </select>
    </label>
  );
}

// Saisie ou modification d'une dépense, d'un revenu ou d'un transfert.
export default function Saisie({ base, porteMonnaie, operation, porteMonnaieParDefaut, fermer, rafraichir }) {
  const [type, setType] = useState(operation?.type ?? 'depense');
  const [montant, setMontant] = useState(operation ? montantPourSaisie(operation.montant) : '');
  const [categorieId, setCategorieId] = useState(operation?.categorieId ?? null);
  const [porteMonnaieId, setPorteMonnaieId] = useState(
    operation?.porteMonnaieId ?? porteMonnaieParDefaut ?? porteMonnaie[0]?.id ?? null
  );
  const [versId, setVersId] = useState(
    operation?.versPorteMonnaieId ?? porteMonnaie.find((p) => p.id !== porteMonnaieId)?.id ?? null
  );
  const [date, setDate] = useState(operation?.date ?? aujourdhui());
  const [note, setNote] = useState(operation?.note ?? '');
  const [message, setMessage] = useState('');
  // Venu de l'appui long « Supprimer » (D38) : on ouvre directement la confirmation.
  const [confirmer, setConfirmer] = useState(Boolean(operation?.aSupprimer));

  // Le message d'erreur disparaît dès que l'utilisateur corrige le formulaire.
  useEffect(() => setMessage(''), [type, montant, categorieId, porteMonnaieId, versId, date]);

  if (porteMonnaie.length === 0) {
    return (
      <Feuille titre="Nouvelle opération" fermer={fermer}>
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
    const transfert = type === 'transfert';
    if (centimes === null || centimes <= 0) return setMessage('Indique un montant, par exemple 12,50.');
    if (!transfert && !categorieId) return setMessage('Choisis une catégorie.');
    if (transfert && (!versId || versId === porteMonnaieId)) return setMessage('Choisis deux porte-monnaie différents.');
    if (!date) return setMessage('Choisis une date.');
    const valeurs = { type, montant: centimes, categorieId, porteMonnaieId, versPorteMonnaieId: versId, date, note: note.trim() };
    if (operation) modifierOperation(base, operation.id, valeurs);
    else creerOperation(base, valeurs);
    rafraichir();
    fermer();
  }

  function supprimer() {
    supprimerOperation(base, operation.id);
    rafraichir();
    fermer();
  }

  if (confirmer) {
    return (
      <Feuille titre="Supprimer cette opération ?" fermer={fermer}>
        <p className="texte-2">Elle sera supprimée définitivement et les soldes seront recalculés.</p>
        <div className="actions">
          <button className="bouton secondaire" onClick={() => (operation.aSupprimer ? fermer() : setConfirmer(false))}>Annuler</button>
          <button className="bouton danger" onClick={supprimer}>Supprimer</button>
        </div>
      </Feuille>
    );
  }

  return (
    <Feuille titre={operation ? "Modifier l'opération" : 'Nouvelle opération'} fermer={fermer}>
      <form onSubmit={enregistrer}>
        <div className="bascule" role="tablist">
          <button type="button" role="tab" aria-selected={type === 'depense'}
            className={type === 'depense' ? 'actif' : ''} onClick={() => changerType('depense')}>Dépense</button>
          <button type="button" role="tab" aria-selected={type === 'revenu'}
            className={type === 'revenu' ? 'actif' : ''} onClick={() => changerType('revenu')}>Revenu</button>
          <button type="button" role="tab" aria-selected={type === 'transfert'}
            className={type === 'transfert' ? 'actif' : ''} onClick={() => changerType('transfert')}>Transfert</button>
        </div>

        <Champ libelle="Montant (€)" value={montant} onChange={(e) => setMontant(e.target.value)}
          inputMode="decimal" placeholder="0,00" className="montant-saisie" autoFocus={!operation} />

        {type === 'transfert' ? (
          <>
            <ChoixPorteMonnaie libelle="Depuis" porteMonnaie={porteMonnaie} valeur={porteMonnaieId} choisir={setPorteMonnaieId} />
            <ChoixPorteMonnaie libelle="Vers" porteMonnaie={porteMonnaie} valeur={versId} choisir={setVersId} />
          </>
        ) : (
          <>
            <ChoixCategorie key={type} base={base} type={type} choisie={categorieId} choisir={setCategorieId} />
            <ChoixPorteMonnaie libelle="Porte-monnaie" porteMonnaie={porteMonnaie} valeur={porteMonnaieId} choisir={setPorteMonnaieId} />
          </>
        )}

        <Champ libelle="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Champ libelle="Note (facultative)" value={note} onChange={(e) => setNote(e.target.value)} />

        <Message texte={message} />
        <button className="bouton" type="submit">Enregistrer</button>
        {operation && (
          <button className="bouton lien-danger" type="button" onClick={() => setConfirmer(true)}>
            Supprimer cette opération
          </button>
        )}
      </form>
    </Feuille>
  );
}
