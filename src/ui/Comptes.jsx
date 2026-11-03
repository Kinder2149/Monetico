import { useState } from 'react';
import { Feuille, Champ, Message } from './Commun.jsx';
import { formaterEuros, lireMontant, montantPourSaisie, total } from '../logique/argent.js';
import { creerPorteMonnaie, modifierPorteMonnaie, supprimerPorteMonnaie } from '../donnees/depot.js';

function Formulaire({ base, porteMonnaie, fermer, rafraichir }) {
  const [nom, setNom] = useState(porteMonnaie?.nom ?? '');
  const [solde, setSolde] = useState(porteMonnaie ? montantPourSaisie(porteMonnaie.soldeDepart) : '');
  const [message, setMessage] = useState('');
  const [confirmer, setConfirmer] = useState(false);

  function enregistrer(e) {
    e.preventDefault();
    const soldeDepart = solde.trim() === '' ? 0 : lireMontant(solde);
    if (!nom.trim()) return setMessage('Donne un nom au porte-monnaie.');
    if (soldeDepart === null) return setMessage('Le solde de départ doit être un montant, par exemple 150,00.');
    const valeurs = { nom: nom.trim(), soldeDepart };
    if (porteMonnaie) modifierPorteMonnaie(base, porteMonnaie.id, valeurs);
    else creerPorteMonnaie(base, valeurs);
    rafraichir();
    fermer();
  }

  function supprimer() {
    supprimerPorteMonnaie(base, porteMonnaie.id);
    rafraichir();
    fermer();
  }

  if (confirmer) {
    return (
      <Feuille titre="Supprimer ce porte-monnaie ?" fermer={fermer}>
        <p className="texte-2">« {porteMonnaie.nom} » sera supprimé définitivement.</p>
        <div className="actions">
          <button className="bouton secondaire" onClick={() => setConfirmer(false)}>Annuler</button>
          <button className="bouton danger" onClick={supprimer}>Supprimer</button>
        </div>
      </Feuille>
    );
  }

  return (
    <Feuille titre={porteMonnaie ? 'Modifier le porte-monnaie' : 'Nouveau porte-monnaie'} fermer={fermer}>
      <form onSubmit={enregistrer}>
        <Champ libelle="Nom" value={nom} onChange={(e) => setNom(e.target.value)}
          placeholder="Compte courant, Espèces…" autoFocus={!porteMonnaie} />
        <Champ libelle="Solde de départ (€)" value={solde} onChange={(e) => setSolde(e.target.value)}
          inputMode="decimal" placeholder="0,00" />
        <Message texte={message} />
        <button className="bouton" type="submit">Enregistrer</button>
        {porteMonnaie && (
          <button className="bouton lien-danger" type="button" onClick={() => setConfirmer(true)}>
            Supprimer ce porte-monnaie
          </button>
        )}
      </form>
    </Feuille>
  );
}

export default function Comptes({ base, porteMonnaie, rafraichir }) {
  const [edition, setEdition] = useState(null); // null, 'nouveau' ou un porte-monnaie

  return (
    <>
      <div className="carte total">
        <span className="texte-2">Tous les comptes</span>
        <strong className="montant-total">{formaterEuros(total(porteMonnaie))}</strong>
      </div>

      {porteMonnaie.length === 0 ? (
        <p className="vide">Aucun porte-monnaie. Crée le premier ci-dessous.</p>
      ) : (
        <ul className="carte liste">
          {porteMonnaie.map((p) => (
            <li key={p.id}>
              <button className="ligne" onClick={() => setEdition(p)}>
                <span className="pastille" aria-hidden="true">{p.nom.charAt(0).toUpperCase()}</span>
                <span className="ligne-nom">{p.nom}</span>
                <span className={p.solde < 0 ? 'negatif' : ''}>{formaterEuros(p.solde)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <button className="bouton" onClick={() => setEdition('nouveau')}>Ajouter un porte-monnaie</button>

      {edition && (
        <Formulaire base={base} porteMonnaie={edition === 'nouveau' ? null : edition}
          fermer={() => setEdition(null)} rafraichir={rafraichir} />
      )}
    </>
  );
}
