import { useCallback, useEffect, useState } from 'react';
import { IconeAccueil, IconeOperations, IconeBudgets, IconeComptes, IconePlus } from './Icones.jsx';
import Accueil from './Accueil.jsx';
import Comptes from './Comptes.jsx';
import Categories from './Categories.jsx';
import { listerPorteMonnaie } from '../donnees/depot.js';

const ONGLETS = {
  accueil: { titre: 'Accueil', Icone: IconeAccueil },
  operations: { titre: 'Opérations', Icone: IconeOperations },
  budgets: { titre: 'Budgets', Icone: IconeBudgets },
  comptes: { titre: 'Comptes', Icone: IconeComptes },
};

function Onglet({ id, actif, choisir }) {
  const { titre, Icone } = ONGLETS[id];
  return (
    <button className={'onglet' + (actif === id ? ' actif' : '')} onClick={() => choisir(id)}>
      <Icone />
      {titre}
    </button>
  );
}

export default function App({ ouvrir }) {
  const [base, setBase] = useState(null);
  const [erreur, setErreur] = useState('');
  const [actif, setActif] = useState('accueil');
  const [page, setPage] = useState(null); // écran secondaire ouvert depuis un onglet
  const [porteMonnaie, setPorteMonnaie] = useState([]);
  const [choix, setChoix] = useState('tous');

  const rafraichir = useCallback((b = base) => setPorteMonnaie(listerPorteMonnaie(b)), [base]);

  useEffect(() => {
    ouvrir()
      .then((b) => { setBase(b); setPorteMonnaie(listerPorteMonnaie(b)); })
      .catch(() => setErreur("Impossible d'ouvrir les données de l'appli."));
  }, [ouvrir]);

  // Si le porte-monnaie affiché a été supprimé, on revient à « Tous les comptes ».
  const choixValide = choix === 'tous' || porteMonnaie.some((p) => p.id === choix) ? choix : 'tous';

  function changerOnglet(id) {
    setActif(id);
    setPage(null);
  }

  let contenu;
  if (erreur) contenu = <p className="vide">{erreur}</p>;
  else if (!base) contenu = null;
  else if (page === 'categories') contenu = <Categories base={base} />;
  else if (actif === 'accueil') contenu = <Accueil porteMonnaie={porteMonnaie} choix={choixValide} choisir={setChoix} />;
  else if (actif === 'comptes') contenu = (
    <Comptes base={base} porteMonnaie={porteMonnaie} rafraichir={() => rafraichir()}
      ouvrirCategories={() => setPage('categories')} />
  );
  else contenu = <p className="vide">Rien pour l'instant.</p>;

  return (
    <div className="appli">
      <main className="ecran">
        {page ? (
          <div className="entete">
            <button className="retour" onClick={() => setPage(null)} aria-label="Retour">‹</button>
            <h1 className="titre-ecran">Catégories</h1>
          </div>
        ) : (
          <h1 className="titre-ecran">{ONGLETS[actif].titre}</h1>
        )}
        {contenu}
      </main>
      <nav className="barre">
        <Onglet id="accueil" actif={actif} choisir={changerOnglet} />
        <Onglet id="operations" actif={actif} choisir={changerOnglet} />
        <button className="plus" aria-label="Ajouter">
          <IconePlus />
        </button>
        <Onglet id="budgets" actif={actif} choisir={changerOnglet} />
        <Onglet id="comptes" actif={actif} choisir={changerOnglet} />
      </nav>
    </div>
  );
}
