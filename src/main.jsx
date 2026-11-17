import { createRoot } from 'react-dom/client';
import initSqlJs from 'sql.js';
import urlWasm from 'sql.js/dist/sql-wasm.wasm?url';
import App from './ui/App.jsx';
import { ouvrirBase } from './donnees/base.js';
import { demarrer, signalerModification } from './donnees/sauvegarde.js';
import './style.css';

const ouvrir = async () => {
  const base = await ouvrirBase(initSqlJs, urlWasm, signalerModification);
  demarrer(base);
  return base;
};

createRoot(document.getElementById('racine')).render(<App ouvrir={ouvrir} />);
