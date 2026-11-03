import { useEffect, useState } from 'react';
import { IconeAccueil, IconeOperations, IconeBudgets, IconeComptes, IconePlus } from './Icones.jsx';
import Accueil from './Accueil.jsx';
import Operations from './Operations.jsx';
import Comptes from './Comptes.jsx';
import Categories from './Categories.jsx';
import Saisie from './Saisie.jsx';
import Budgets from './Budgets.jsx';
import Recurrentes from './Recurrentes.jsx';
import Prets from './Prets.jsx';
import Graphiques from './Graphiques.jsx';
import { useRetour } from './Commun.jsx';
import { listerPorteMonnaie } from '../donnees/depot.js';

// Écrans secondaires (Graphiques depuis l'accueil, les autres depuis l'onglet Comptes), avec leur titre.
const PAGES = { categories: 'Catégories', recurrentes: 'Opérations récurrentes', prets: 'Prêts', graphiques: 'Graphiques' };

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
  const [choix, setChoix] = useState('tous');
  const [saisie, setSaisie] = useState(null); // null, 'nouvelle' ou l'opération à modifier
  const [recherche, setRecherche] = useState(false);
  const [, setVersion] = useState(0);

  useRetour(page !== null, () => setPage(null));

  // Chaque écran relit la base à l'affichage ; on redessine après chaque modification.
  const rafraichir = () => setVersion((v) => v + 1);

  useEffect(() => {
    ouvrir().then(setBase).catch(() => setErreur("Impossible d'ouvrir les données de l'appli."));
  }, [ouvrir]);

  const porteMonnaie = base ? listerPorteMonnaie(base) : [];
  // Si le porte-monnaie affiché a été supprimé, on revient à « Tous les comptes ».
  const choixValide = choix === 'tous' || porteMonnaie.some((p) => p.id === choix) ? choix : 'tous';
  const porteMonnaieId = choixValide === 'tous' ? null : choixValide;

  function changerOnglet(id) {
    setActif(id);
    setPage(null);
    setRecherche(false);
  }

  let contenu;
  if (erreur) contenu = <p className="vide">{erreur}</p>;
  else if (!base) contenu = null;
  else if (page === 'categories') contenu = <Categories base={base} />;
  else if (page === 'graphiques') contenu = <Graphiques base={base} />;
  else if (page === 'prets') contenu = <Prets base={base} porteMonnaie={porteMonnaie} rafraichir={rafraichir} />;
  else if (page === 'recurrentes') contenu = <Recurrentes base={base} porteMonnaie={porteMonnaie} rafraichir={rafraichir} />;
  else if (actif === 'accueil') contenu = (
    <Accueil base={base} porteMonnaie={porteMonnaie} choix={choixValide} choisir={setChoix}
      ouvrir={setSaisie} chercher={() => { setActif('operations'); setRecherche(true); }}
      voirBudgets={() => changerOnglet('budgets')} voirGraphiques={() => setPage('graphiques')}
      rafraichir={rafraichir} />
  );
  else if (actif === 'operations') contenu = (
    <Operations base={base} porteMonnaieId={porteMonnaieId} ouvrir={setSaisie} rechercheInitiale={recherche} />
  );
  else if (actif === 'comptes') contenu = (
    <Comptes base={base} porteMonnaie={porteMonnaie} rafraichir={rafraichir}
      ouvrirCategories={() => setPage('categories')} ouvrirRecurrentes={() => setPage('recurrentes')}
      ouvrirPrets={() => setPage('prets')} />
  );
  else contenu = <Budgets base={base} rafraichir={rafraichir} />;

  return (
    <div className="appli">
      <main className="ecran">
        {page ? (
          <div className="entete">
            <button className="retour" onClick={() => setPage(null)} aria-label="Retour">‹</button>
            <h1 className="titre-ecran">{PAGES[page]}</h1>
          </div>
        ) : (
          <h1 className="titre-ecran">{ONGLETS[actif].titre}</h1>
        )}
        {contenu}
      </main>
      <nav className="barre">
        <Onglet id="accueil" actif={actif} choisir={changerOnglet} />
        <Onglet id="operations" actif={actif} choisir={changerOnglet} />
        <button className="plus" aria-label="Ajouter une opération" onClick={() => base && setSaisie('nouvelle')}>
          <IconePlus />
        </button>
        <Onglet id="budgets" actif={actif} choisir={changerOnglet} />
        <Onglet id="comptes" actif={actif} choisir={changerOnglet} />
      </nav>
      {saisie && (
        <Saisie base={base} porteMonnaie={porteMonnaie} rafraichir={rafraichir}
          operation={saisie === 'nouvelle' ? null : saisie} porteMonnaieParDefaut={porteMonnaieId}
          fermer={() => setSaisie(null)} />
      )}
    </div>
  );
}
