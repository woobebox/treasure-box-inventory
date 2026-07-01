import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { AuthProvider } from './services/auth';
import { HouseholdProvider } from './services/householdContext';
import { ToastProvider } from './components/toast/ToastProvider';
import { cacheAppShell } from './pwa/workbox';
import { registerServiceWorker } from './pwa/registerServiceWorker';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider><HouseholdProvider><ToastProvider><App /></ToastProvider></HouseholdProvider></AuthProvider>
  </StrictMode>
);

registerServiceWorker();
void cacheAppShell();
