import { useState } from 'react';
import { Feuille, Champ, Message } from './Commun.jsx';
import { ICONES_CATEGORIES, IconeCategorie } from './Icones.jsx';
import { listerCategories, creerCategorie, modifierCategorie, supprimerCategorie } from '../donnees/depot.js';

export function Pastille({ categorie, petite }) {
  return (
    <span className={'pastille' + (petite ? ' petite' : '')} aria-hidden="true">
      {categorie.icone
        ? <IconeCategorie nom={categorie.icone} taille={petite ? 16 : 20} />
        : categorie.nom.charAt(0).toUpperCase()}
    </span>
  );
}

function ChoixIcone({ choisie, choisir }) {
  return (
    <fieldset className="choix-icone">
      <legend>Icône</legend>
      <div className="grille-icones">
        {Object.keys(ICONES_CATEGORIES).map((nom) => (
          <button key={nom} type="button" aria-label={nom} aria-pressed={choisie === nom}
            className={'pastille' + (choisie === nom ? ' choisie' : '')} onClick={() => choisir(nom)}>
            <IconeCategorie nom={nom} />
          </button>
        ))}
      </div>
    </fieldset>
  );
}

// Panneau d'une catégorie ou sous-catégorie : renommer, ajouter une sous-catégorie, supprimer.
// `edition` = { categorie } pour modifier, ou { type, parent } pour créer.
function Formulaire({ base, edition, fermer, rafraichir }) {
  const { categorie, parent } = edition;
  const [nom, setNom] = useState(categorie?.nom ?? '');
  const [icone, setIcone] = useState(categorie?.icone ?? parent?.icone ?? null);
  const [message, setMessage] = useState('');
  const [confirmer, setConfirmer] = useState(false);

  const estSous = categorie ? categorie.parentId !== null : Boolean(parent);
  const genre = estSous ? 'sous-catégorie' : 'catégorie';

  function enregistrer(e) {
    e.preventDefault();
    if (!nom.trim()) return setMessage(`Donne un nom à la ${genre}.`);
    const valeurs = { nom: nom.trim(), icone };
    if (categorie) modifierCategorie(base, categorie.id, valeurs);
    else creerCategorie(base, { ...valeurs, type: edition.type, parentId: parent?.id ?? null });
    rafraichir();
    fermer();
  }

  function supprimer() {
    supprimerCategorie(base, categorie.id);
    rafraichir();
    fermer();
  }

  if (confirmer) {
    const nbSous = categorie.sous?.length ?? 0;
    return (
      <Feuille titre={`Supprimer cette ${genre} ?`} fermer={fermer}>
        <p className="texte-2">
          « {categorie.nom} » sera supprimée définitivement
          {nbSous > 0 && `, avec ses ${nbSous} sous-catégories`}.
        </p>
        <div className="actions">
          <button className="bouton secondaire" onClick={() => setConfirmer(false)}>Annuler</button>
          <button className="bouton danger" onClick={supprimer}>Supprimer</button>
        </div>
      </Feuille>
    );
  }

  const titre = categorie
    ? `Modifier la ${genre}`
    : estSous ? `Nouvelle sous-catégorie de « ${parent.nom} »` : 'Nouvelle catégorie';

  return (
    <Feuille titre={titre} fermer={fermer}>
      <form onSubmit={enregistrer}>
        <Champ libelle="Nom" value={nom} onChange={(e) => setNom(e.target.value)} autoFocus={!categorie} />
        <ChoixIcone choisie={icone} choisir={setIcone} />
        <Message texte={message} />
        <button className="bouton" type="submit">Enregistrer</button>
        {categorie && (
          <button className="bouton lien-danger" type="button" onClick={() => setConfirmer(true)}>
            Supprimer cette {genre}
          </button>
        )}
      </form>
    </Feuille>
  );
}

export default function Categories({ base }) {
  const [type, setType] = useState('depense');
  const [, setVersion] = useState(0);
  const [edition, setEdition] = useState(null);
  const rafraichir = () => setVersion((v) => v + 1);
  const categories = listerCategories(base, type);

  return (
    <>
      <div className="bascule" role="tablist">
        <button role="tab" aria-selected={type === 'depense'} className={type === 'depense' ? 'actif' : ''}
          onClick={() => setType('depense')}>Dépenses</button>
        <button role="tab" aria-selected={type === 'revenu'} className={type === 'revenu' ? 'actif' : ''}
          onClick={() => setType('revenu')}>Revenus</button>
      </div>

      <ul className="carte liste">
        {categories.map((c) => (
          <li key={c.id}>
            <button className="ligne" onClick={() => setEdition({ categorie: c })}>
              <Pastille categorie={c} />
              <span className="ligne-nom">{c.nom}</span>
            </button>
            {c.sous.map((s) => (
              <button key={s.id} className="ligne sous" onClick={() => setEdition({ categorie: s })}>
                <Pastille categorie={s} petite />
                <span className="ligne-nom">{s.nom}</span>
              </button>
            ))}
            <button className="ligne sous ajout" onClick={() => setEdition({ type, parent: c })}>
              + Sous-catégorie
            </button>
          </li>
        ))}
      </ul>

      <button className="bouton" onClick={() => setEdition({ type })}>Ajouter une catégorie</button>

      {edition && (
        <Formulaire base={base} edition={edition} fermer={() => setEdition(null)} rafraichir={rafraichir} />
      )}
    </>
  );
}
