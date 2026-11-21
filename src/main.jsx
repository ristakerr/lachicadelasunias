import { createRoot, hydrateRoot } from 'react-dom/client'
import '@fontsource-variable/archivo/wdth.css'
import App from './App.jsx'
import './App.css'
const root = document.getElementById('root')
// si el HTML llegó prerenderizado se "hidrata"; en desarrollo se renderiza desde cero
if (root.hasChildNodes()) hydrateRoot(root, <App />)
else createRoot(root).render(<App />)
