import React from 'react';
import ReactDOM from 'react-dom/client';
import './i18n';
import './index.css';
import App from './App.tsx';
import { ThemeProvider } from './lib/theme-provider.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="access-url-extension-theme">
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
