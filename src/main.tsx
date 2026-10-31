import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { startCloudAuth } from './auth/cloudAuth';
import { reloadForUpdate } from './lib/lazyPage';

startCloudAuth();

// A tab left open across a new release: load the new one (src/lib/lazyPage.ts).
window.addEventListener('vite:preloadError', (e) => { if (reloadForUpdate()) e.preventDefault(); });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
