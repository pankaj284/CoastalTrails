import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './lib/theme';
import './index.css';
import 'leaflet/dist/leaflet.css';

// Dev-only render highlighter (react-scan) — gated so it never ships to production.
if (import.meta.env.DEV) {
  import('react-scan').then(({ scan }) => {
    scan({ enabled: true, log: false });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
);

