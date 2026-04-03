import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Restore saved theme on load
try {
  const saved = localStorage.getItem('atlas-theme')
  if (saved === 'light') {
    document.documentElement.setAttribute('data-theme', 'light')
  }
} catch {
  // ignore
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
