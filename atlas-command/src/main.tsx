import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Restore saved theme on load — supports 'light', 'dark', or 'system'
try {
  const saved = localStorage.getItem('atlas-theme')
  if (saved === 'light') {
    document.documentElement.setAttribute('data-theme', 'light')
  } else if (saved === 'system' || !saved) {
    // Respect OS preference when set to 'system' or on first visit
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
  } else {
    // 'dark' or any unknown value → dark (default)
    document.documentElement.removeAttribute('data-theme')
  }
} catch {
  // localStorage unavailable — stay on default dark
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
