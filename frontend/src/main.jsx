import React from 'react'
import { createRoot } from 'react-dom/client'
// Using a HashRouter instead of BrowserRouter makes the
// application work reliably on static hosts (like Render or GitHub Pages)
// that don't automatically redirect unknown paths back to index.html.
import { HashRouter } from 'react-router-dom'
import App from './App'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/*
      Switch from BrowserRouter to HashRouter so the router works when
      deployed as a static site. HashRouter uses URL fragments (e.g.
      #/products) which means the browser never makes a separate HTTP
      request for internal routes, avoiding 404 responses from hosts
      that don’t support client‑side routing.
    */}
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)
