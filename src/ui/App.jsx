import { useState } from 'react';
import { IconeAccueil, IconeOperations, IconeBudgets, IconeComptes, IconePlus } from './Icones.jsx';

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

export default function App() {
  const [actif, setActif] = useState('accueil');

  return (
    <div className="appli">
      <main className="ecran">
        <h1 className="titre-ecran">{ONGLETS[actif].titre}</h1>
        <p className="vide">Rien pour l'instant.</p>
      </main>
      <nav className="barre">
        <Onglet id="accueil" actif={actif} choisir={setActif} />
        <Onglet id="operations" actif={actif} choisir={setActif} />
        <button className="plus" aria-label="Ajouter">
          <IconePlus />
        </button>
        <Onglet id="budgets" actif={actif} choisir={setActif} />
        <Onglet id="comptes" actif={actif} choisir={setActif} />
      </nav>
    </div>
  );
}
