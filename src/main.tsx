import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/cormorant-garamond/latin-400.css';
import '@fontsource/cormorant-garamond/latin-400-italic.css';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/noto-sans-gurmukhi/gurmukhi-400.css';
import './styles.css';
import App from './App';

// Ensure the sacred symbol is drawn from a local font, even on devices without
// a Punjabi system font. All other UI fonts can load normally through CSS.
await document.fonts.load('40px "Noto Sans Gurmukhi"', 'ੴ').catch(() => undefined);
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
