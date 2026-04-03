import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <>
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1200px] mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </>
  )
}
