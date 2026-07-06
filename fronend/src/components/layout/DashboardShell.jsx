import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'

/**
 * DashboardShell — the shared frame every role's dashboard renders inside.
 * Feature pages only ever provide title/subtitle/actions + their own body.
 */
export default function DashboardShell({ role, title, subtitle, actions, user, children }) {
  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar role={role} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar title={title} subtitle={subtitle} actions={actions} user={user} />
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  )
}
