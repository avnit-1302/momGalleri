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

// Canvas signs need their locally bundled typefaces before textures are drawn.
await Promise.all([
  document.fonts.load('40px "Noto Sans Gurmukhi"', 'ੴ'),
  document.fonts.load('40px "Cormorant Garamond"'),
  document.fonts.load('40px "DM Sans"'),
]).catch(() => undefined);
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
