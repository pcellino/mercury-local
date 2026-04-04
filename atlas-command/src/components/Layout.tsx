import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import ShortcutsHelp from './ShortcutsHelp'
import CommandPalette from './CommandPalette'
import HeaderBar from './HeaderBar'
import ActivityDrawer from './ActivityDrawer'
import NotificationsPopover from './NotificationsPopover'
import ErrorBoundary from './ErrorBoundary'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'

export default function Layout() {
  useKeyboardShortcuts()
  const [activityOpen, setActivityOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <HeaderBar
          onOpenActivity={() => { setActivityOpen(true); setNotificationsOpen(false) }}
          onToggleNotifications={() => { setNotificationsOpen(prev => !prev); setActivityOpen(false) }}
          notificationsOpen={notificationsOpen}
        />
        <main className="flex-1 overflow-y-auto relative">
          <ErrorBoundary>
          <div className="max-w-[1120px] mx-auto px-8 py-6">
            <Outlet />
          </div>
          {/* Notifications popover - anchored to the header bell */}
          <NotificationsPopover
            open={notificationsOpen}
            onClose={() => setNotificationsOpen(false)}
          />
          </ErrorBoundary>
        </main>
      </div>

      {/* Activity slide-over */}
      <ActivityDrawer open={activityOpen} onClose={() => setActivityOpen(false)} />

      <ShortcutsHelp />
      <CommandPalette />
    </>
  )
}
