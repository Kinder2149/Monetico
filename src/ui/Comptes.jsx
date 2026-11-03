import { useState } from 'react';
import { Feuille, Champ, Message } from './Commun.jsx';
import { formaterEuros, lireMontant, montantPourSaisie, total } from '../logique/argent.js';
import { creerPorteMonnaie, modifierPorteMonnaie, supprimerPorteMonnaie, porteMonnaieUtilise, importerOperations } from '../donnees/depot.js';
import { lireExportMoneyLover } from '../logique/importMoneyLover.js';

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

  function demanderSuppression() {
    if (porteMonnaieUtilise(base, porteMonnaie.id)) {
      setMessage('Ce porte-monnaie contient des opérations : supprime-les ou change-les de porte-monnaie avant de le supprimer.');
    } else {
      setConfirmer(true);
    }
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
          <button className="bouton lien-danger" type="button" onClick={demanderSuppression}>
            Supprimer ce porte-monnaie
          </button>
        )}
      </form>
    </Feuille>
  );
}

// Espace fine des milliers (quasi invisible en Manrope) remplacée par une espace insécable, comme pour les montants.
const pluriel = (n, mot) => `${n.toLocaleString('fr-FR').replace(/ /g, ' ')} ${mot}${n > 1 ? 's' : ''}`;

// Résultat de l'import Money Lover (D26).
function ResumeImport({ resultat, fermer }) {
  if (resultat.erreur) {
    return (
      <Feuille titre="Import impossible" fermer={fermer}>
        <p className="texte-2">{resultat.erreur}</p>
        <button className="bouton" onClick={fermer}>Compris</button>
      </Feuille>
    );
  }
  return (
    <Feuille titre="Import terminé" fermer={fermer}>
      <ul className="resume-import">
        <li>{pluriel(resultat.operations, 'opération')} importée{resultat.operations > 1 ? 's' : ''}</li>
        <li>{pluriel(resultat.porteMonnaie, 'porte-monnaie')}{resultat.porteMonnaieCrees > 0 ? ` (dont ${resultat.porteMonnaieCrees} créé${resultat.porteMonnaieCrees > 1 ? 's' : ''})` : ''}</li>
        <li>{pluriel(resultat.categoriesCreees, 'catégorie')} créée{resultat.categoriesCreees > 1 ? 's' : ''}</li>
        {resultat.dejaPresentes > 0 && <li>{pluriel(resultat.dejaPresentes, 'opération')} déjà présente{resultat.dejaPresentes > 1 ? 's' : ''}, non ajoutée{resultat.dejaPresentes > 1 ? 's' : ''}</li>}
        {resultat.aVenir > 0 && <li>{pluriel(resultat.aVenir, 'opération')} à venir, non importée{resultat.aVenir > 1 ? 's' : ''}</li>}
      </ul>
      <button className="bouton" onClick={fermer}>Compris</button>
    </Feuille>
  );
}

export default function Comptes({ base, porteMonnaie, rafraichir, ouvrirCategories }) {
  const [edition, setEdition] = useState(null); // null, 'nouveau' ou un porte-monnaie
  const [resultat, setResultat] = useState(null);
  const [enCours, setEnCours] = useState(false);

  async function importer(e) {
    const fichier = e.target.files[0];
    e.target.value = '';
    if (!fichier) return;
    setEnCours(true);
    try {
      const { operations, aVenir } = lireExportMoneyLover(await fichier.text());
      setResultat({ ...importerOperations(base, operations), aVenir });
      rafraichir();
    } catch (erreur) {
      setResultat({ erreur: erreur.message });
    } finally {
      setEnCours(false);
    }
  }

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

      <h2 className="titre-section">Catégories</h2>
      <button className="carte ligne lien" onClick={ouvrirCategories}>
        <span className="ligne-nom">Gérer les catégories de dépenses et de revenus</span>
        <span aria-hidden="true">›</span>
      </button>

      <h2 className="titre-section">Import</h2>
      <label className={'carte ligne lien' + (enCours ? ' occupe' : '')}>
        <span className="ligne-nom">{enCours ? 'Import en cours…' : 'Importer depuis Money Lover'}</span>
        <span aria-hidden="true">›</span>
        <input type="file" accept=".csv,text/csv,text/comma-separated-values,text/plain" hidden
          disabled={enCours} onChange={importer} />
      </label>

      {edition && (
        <Formulaire base={base} porteMonnaie={edition === 'nouveau' ? null : edition}
          fermer={() => setEdition(null)} rafraichir={rafraichir} />
      )}
      {resultat && <ResumeImport resultat={resultat} fermer={() => setResultat(null)} />}
    </>
  );
}
