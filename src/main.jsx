import { createRoot } from 'react-dom/client';
import initSqlJs from 'sql.js';
import urlWasm from 'sql.js/dist/sql-wasm.wasm?url';
import App from './ui/App.jsx';
import { ouvrirBase } from './donnees/base.js';
import './style.css';

const ouvrir = () => ouvrirBase(initSqlJs, urlWasm);

createRoot(document.getElementById('racine')).render(<App ouvrir={ouvrir} />);
