import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Chemins relatifs : nécessaire pour que l'appli Android trouve ses fichiers.
  base: './',
});
