import { useState } from 'react';
import { Feuille, Champ, Message } from './Commun.jsx';
import { Pastille } from './Categories.jsx';
import { lireMontant, montantPourSaisie } from '../logique/argent.js';
import { aujourdhui } from '../logique/dates.js';
import { listerCategories, creerOperation, modifierOperation, supprimerOperation } from '../donnees/depot.js';

function ChoixCategorie({ base, type, choisie, choisir }) {
  const [ouvert, setOuvert] = useState(!choisie);
  const categories = listerCategories(base, type);
  const toutes = categories.flatMap((c) => [c, ...c.sous]);
  const actuelle = toutes.find((c) => c.id === choisie);

  if (!ouvert && actuelle) {
    return (
      <div className="champ">
        <span>Catégorie</span>
        <button type="button" className="ligne choix-actuel" onClick={() => setOuvert(true)}>
          <Pastille categorie={actuelle} />
          <span className="ligne-nom">{actuelle.nom}</span>
          <span className="texte-2">Changer</span>
        </button>
      </div>
    );
  }

  return (
    <div className="champ">
      <span>Catégorie</span>
      <div className="liste-choix">
        {categories.map((c) => (
          <div key={c.id} className="groupe-choix">
            {[c, ...c.sous].map((x) => (
              <button key={x.id} type="button" className={'puce' + (x.id === choisie ? ' choisie' : '')}
                onClick={() => { choisir(x.id); setOuvert(false); }}>
                <Pastille categorie={x} petite />
                {x.nom}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ChoixPorteMonnaie({ libelle, porteMonnaie, valeur, choisir }) {
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
  const [confirmer, setConfirmer] = useState(false);

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
          <button className="bouton secondaire" onClick={() => setConfirmer(false)}>Annuler</button>
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
