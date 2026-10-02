import { createRoot } from 'react-dom/client'
import '@fontsource-variable/bricolage-grotesque/opsz.css'
import '@fontsource/dm-sans/400.css'
import '@fontsource/dm-sans/500.css'
import '@fontsource/dm-sans/700.css'
import Admin from './Admin.jsx'
import './admin.css'

createRoot(document.getElementById('root')).render(<Admin />)
