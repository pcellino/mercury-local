import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import ShortcutsHelp from './ShortcutsHelp'
import CommandPalette from './CommandPalette'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'

export default function Layout() {
  useKeyboardShortcuts()

  return (
    <>
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1200px] mx-auto p-8">
          <Outlet />
        </div>
      </main>
      <ShortcutsHelp />
      <CommandPalette />
    </>
  )
}
