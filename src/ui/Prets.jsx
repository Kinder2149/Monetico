import { useEffect, useState } from 'react';
import { Feuille, Champ, Message } from './Commun.jsx';
import { ChoixPorteMonnaie } from './Saisie.jsx';
import { formaterEuros, lireMontant, montantPourSaisie } from '../logique/argent.js';
import { aujourdhui, libelleJour } from '../logique/dates.js';
import {
  listerPrets, creerPret, modifierPret, supprimerPret, ajouterRemboursement, supprimerRemboursement,
} from '../donnees/depot.js';

function SansPorteMonnaie({ titre, fermer }) {
  return (
    <Feuille titre={titre} fermer={fermer}>
      <p className="texte-2">Crée d'abord un porte-monnaie dans l'onglet Comptes.</p>
      <button className="bouton" onClick={fermer}>Compris</button>
    </Feuille>
  );
}

function FormulairePret({ base, porteMonnaie, pret, fermer, rafraichir }) {
  const [personne, setPersonne] = useState(pret?.personne ?? '');
  const [montant, setMontant] = useState(pret ? montantPourSaisie(pret.montant) : '');
  const [date, setDate] = useState(pret?.date ?? aujourdhui());
  const [porteMonnaieId, setPorteMonnaieId] = useState(pret?.porteMonnaieId ?? porteMonnaie[0]?.id ?? null);
  const [note, setNote] = useState(pret?.note ?? '');
  const [message, setMessage] = useState('');

  useEffect(() => setMessage(''), [personne, montant, date]);

  if (porteMonnaie.length === 0) return <SansPorteMonnaie titre="Nouveau prêt" fermer={fermer} />;

  function enregistrer(e) {
    e.preventDefault();
    const centimes = lireMontant(montant);
    if (!personne.trim()) return setMessage('Indique à qui tu as prêté.');
    if (centimes === null || centimes <= 0) return setMessage('Indique un montant, par exemple 50,00.');
    if (pret && centimes < pret.rembourse) {
      return setMessage(`Le montant ne peut pas être inférieur aux remboursements déjà reçus (${formaterEuros(pret.rembourse)}).`);
    }
    if (!date) return setMessage('Choisis une date.');
    const valeurs = { personne: personne.trim(), montant: centimes, date, porteMonnaieId, note: note.trim() };
    if (pret) modifierPret(base, pret.id, valeurs);
    else creerPret(base, valeurs);
    rafraichir();
    fermer();
  }

  return (
    <Feuille titre={pret ? 'Modifier le prêt' : 'Nouveau prêt'} fermer={fermer}>
      <form onSubmit={enregistrer}>
        <Champ libelle="Personne" value={personne} onChange={(e) => setPersonne(e.target.value)}
          placeholder="À qui as-tu prêté ?" autoFocus={!pret} />
        <Champ libelle="Montant prêté (€)" value={montant} onChange={(e) => setMontant(e.target.value)}
          inputMode="decimal" placeholder="0,00" />
        <Champ libelle="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <ChoixPorteMonnaie libelle="L'argent part de" porteMonnaie={porteMonnaie} valeur={porteMonnaieId} choisir={setPorteMonnaieId} />
        <Champ libelle="Note (facultative)" value={note} onChange={(e) => setNote(e.target.value)} />
        <Message texte={message} />
        <button className="bouton" type="submit">Enregistrer</button>
      </form>
    </Feuille>
  );
}

function FormulaireRemboursement({ base, porteMonnaie, pret, fermer, rafraichir }) {
  const [montant, setMontant] = useState(montantPourSaisie(pret.resteDu));
  const [date, setDate] = useState(aujourdhui());
  const [porteMonnaieId, setPorteMonnaieId] = useState(pret.porteMonnaieId);
  const [message, setMessage] = useState('');

  useEffect(() => setMessage(''), [montant, date]);

  function enregistrer(e) {
    e.preventDefault();
    const centimes = lireMontant(montant);
    if (centimes === null || centimes <= 0) return setMessage('Indique un montant, par exemple 20,00.');
    if (centimes > pret.resteDu) return setMessage(`Le remboursement dépasse le reste dû (${formaterEuros(pret.resteDu)}).`);
    if (!date) return setMessage('Choisis une date.');
    ajouterRemboursement(base, pret.id, { montant: centimes, date, porteMonnaieId });
    rafraichir();
    fermer();
  }

  return (
    <Feuille titre={`Remboursement de ${pret.personne}`} fermer={fermer}>
      <form onSubmit={enregistrer}>
        <Champ libelle="Montant reçu (€)" value={montant} onChange={(e) => setMontant(e.target.value)} inputMode="decimal" />
        <Champ libelle="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <ChoixPorteMonnaie libelle="L'argent arrive sur" porteMonnaie={porteMonnaie} valeur={porteMonnaieId} choisir={setPorteMonnaieId} />
        <Message texte={message} />
        <button className="bouton" type="submit">Enregistrer</button>
      </form>
    </Feuille>
  );
}

// Fiche d'un prêt : prêté, remboursé, reste dû, remboursements ; ajout, modification, suppression.
function Detail({ base, pret: p, rembourser, modifier, fermer, rafraichir }) {
  const [aSupprimer, setASupprimer] = useState(null); // 'pret' ou un remboursement

  function supprimer() {
    if (aSupprimer === 'pret') {
      supprimerPret(base, p.id);
      fermer();
    } else {
      supprimerRemboursement(base, aSupprimer.id);
      setASupprimer(null);
    }
    rafraichir();
  }

  if (aSupprimer) {
    return (
      <Feuille titre={aSupprimer === 'pret' ? 'Supprimer ce prêt ?' : 'Supprimer ce remboursement ?'} fermer={() => setASupprimer(null)}>
        <p className="texte-2">
          {aSupprimer === 'pret'
            ? 'Le prêt et ses remboursements seront supprimés ; les soldes reviendront comme avant le prêt.'
            : `Le remboursement de ${formaterEuros(aSupprimer.montant)} sera supprimé et le reste dû remontera d'autant.`}
        </p>
        <div className="actions">
          <button className="bouton secondaire" onClick={() => setASupprimer(null)}>Annuler</button>
          <button className="bouton danger" onClick={supprimer}>Supprimer</button>
        </div>
      </Feuille>
    );
  }

  return (
    <Feuille titre={p.personne} fermer={fermer}>
      <p className="texte-2">
        {[`Prêté ${libelleJour(p.date).toLowerCase()} depuis ${p.porteMonnaie}`, p.note].filter(Boolean).join(' · ')}
      </p>
      <div className="chiffres-pret">
        <div><span className="texte-2">Prêté</span><strong>{formaterEuros(p.montant)}</strong></div>
        <div><span className="texte-2">Remboursé</span><strong className="positif">{formaterEuros(p.rembourse)}</strong></div>
        <div>
          <span className="texte-2">Reste dû</span>
          {p.resteDu === 0 ? <strong className="badge-rembourse">Remboursé</strong> : <strong>{formaterEuros(p.resteDu)}</strong>}
        </div>
      </div>
      {p.resteDu > 0 && <button className="bouton" onClick={rembourser}>Ajouter un remboursement</button>}

      <h3 className="titre-section">Remboursements reçus</h3>
      {p.remboursements.length === 0 ? (
        <p className="texte-2">Aucun pour l'instant.</p>
      ) : (
        <ul className="liste depenses-budget">
          {p.remboursements.map((r) => (
            <li key={r.id}>
              <span className="ligne-nom">
                {libelleJour(r.date)}
                <small className="texte-2 detail">Sur {r.porteMonnaie}</small>
              </span>
              <span className="positif">+ {formaterEuros(r.montant)}</span>
              <button className="bouton-petit" onClick={() => setASupprimer(r)}>Supprimer</button>
            </li>
          ))}
        </ul>
      )}

      <div className="actions">
        <button className="bouton secondaire" onClick={modifier}>Modifier</button>
        <button className="bouton secondaire texte-danger" onClick={() => setASupprimer('pret')}>Supprimer</button>
      </div>
    </Feuille>
  );
}

// Écran des prêts (onglet Comptes, D27) : l'argent qu'on me doit.
export default function Prets({ base, porteMonnaie, rafraichir }) {
  const [ouvert, setOuvert] = useState(null); // id du prêt affiché
  const [fenetre, setFenetre] = useState(null); // 'nouveau', 'modifier' ou 'rembourser'
  const prets = listerPrets(base);
  const affiche = prets.find((p) => p.id === ouvert);
  const fermerFenetre = () => setFenetre(null);
  const totalDu = prets.reduce((somme, p) => somme + p.resteDu, 0);

  return (
    <>
      <div className="carte total">
        <span className="texte-2">On me doit</span>
        <strong className="montant-total">{formaterEuros(totalDu)}</strong>
      </div>

      {prets.length === 0 ? (
        <p className="vide">Aucun prêt en cours.</p>
      ) : (
        <ul className="carte liste">
          {prets.map((p) => (
            <li key={p.id}>
              <button className="ligne" onClick={() => setOuvert(p.id)}>
                <span className="pastille" aria-hidden="true">{p.personne.charAt(0).toUpperCase()}</span>
                <span className="ligne-nom">
                  {p.personne}
                  <small className="texte-2 detail">
                    Prêté : {formaterEuros(p.montant)} · {libelleJour(p.date)}
                  </small>
                </span>
                {p.resteDu === 0
                  ? <span className="badge-rembourse">Remboursé</span>
                  : <span>{formaterEuros(p.resteDu)}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}

      <button className="bouton" onClick={() => setFenetre('nouveau')}>Ajouter un prêt</button>

      {affiche && !fenetre && (
        <Detail base={base} pret={affiche} rafraichir={rafraichir} fermer={() => setOuvert(null)}
          rembourser={() => setFenetre('rembourser')} modifier={() => setFenetre('modifier')} />
      )}
      {fenetre === 'nouveau' && (
        <FormulairePret base={base} porteMonnaie={porteMonnaie} fermer={fermerFenetre} rafraichir={rafraichir} />
      )}
      {fenetre === 'modifier' && affiche && (
        <FormulairePret base={base} porteMonnaie={porteMonnaie} pret={affiche} fermer={fermerFenetre} rafraichir={rafraichir} />
      )}
      {fenetre === 'rembourser' && affiche && (
        <FormulaireRemboursement base={base} porteMonnaie={porteMonnaie} pret={affiche} fermer={fermerFenetre} rafraichir={rafraichir} />
      )}
    </>
  );
}
