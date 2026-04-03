import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const SHORTCUTS: Record<string, string> = {
  h: '/',           // Home / Newsroom
  e: '/editorial',  // Editorial Calendar
  c: '/content',    // Content
  i: '/intel',      // Intel
  n: '/posts/new',  // New Post
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate()

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Skip if user is typing in an input, textarea, select, or contenteditable
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) return

      // Only fire on bare key (no Ctrl/Cmd/Alt modifiers) except Shift is ok
      if (e.ctrlKey || e.metaKey || e.altKey) return

      const path = SHORTCUTS[e.key.toLowerCase()]
      if (path) {
        e.preventDefault()
        navigate(path)
      }

      // ? key opens shortcut help overlay (dispatches custom event)
      if (e.key === '?') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('toggle-shortcuts-help'))
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate])
}

export const SHORTCUT_MAP = SHORTCUTS
