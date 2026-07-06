export default function Topbar({ title, subtitle, actions, user }) {
  return (
    <header className="h-16 border-b border-paper-line bg-paper/80 backdrop-blur-sm sticky top-0 z-10
                        flex items-center justify-between px-6">
      <div>
        <h1 className="font-display text-xl leading-none">{title}</h1>
        {subtitle && <p className="text-xs text-ink-faint mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        {user && (
          <div className="flex items-center gap-2 pl-3 border-l border-paper-line">
            <div className="w-8 h-8 rounded-full bg-indigo-tint text-indigo font-mono text-xs
                            flex items-center justify-center font-semibold">
              {user.initials}
            </div>
            <div className="leading-tight">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-[11px] text-ink-faint">{user.role}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
