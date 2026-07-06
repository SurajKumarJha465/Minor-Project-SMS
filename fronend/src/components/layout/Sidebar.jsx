import { NavLink } from 'react-router-dom'
import { BookMarked } from 'lucide-react'

export default function Sidebar({ role }) {
  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 bg-white border-r border-paper-line flex flex-col">
      <div className="px-5 h-16 flex items-center gap-2 border-b border-paper-line">
        <BookMarked size={20} className="text-indigo" />
        <span className="font-display font-semibold text-lg">SMS Registry</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {role.nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === role.base}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-sm font-medium transition-colors
               ${isActive
                 ? 'bg-indigo-tint text-indigo'
                 : 'text-ink-soft hover:bg-paper-dim'}`
            }
          >
            <item.icon size={16} strokeWidth={2} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-paper-line">
        <span className="label-tab">{role.label} Console</span>
      </div>
    </aside>
  )
}
