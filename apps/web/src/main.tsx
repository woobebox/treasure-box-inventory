import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { AuthProvider } from './services/auth';
import { cacheAppShell } from './pwa/workbox';
import { registerServiceWorker } from './pwa/registerServiceWorker';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider><App /></AuthProvider>
  </StrictMode>
);

registerServiceWorker();
void cacheAppShell();
