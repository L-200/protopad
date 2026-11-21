/**
 * @fileoverview Ponto de entrada da aplicação React do protótipo de redesign do Wattpad (TP2 IHC 2026).
 * Inicializa a árvore DOM raiz e carrega os tokens visuais e estilos globais acessíveis (R22).
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/tokens.css';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
