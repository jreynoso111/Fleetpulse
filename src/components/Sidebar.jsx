import { Bot, LayoutDashboard, PanelsTopLeft, Settings } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'

const navItems = [
  { label: 'Dashboard', to: '/app/dashboard', icon: LayoutDashboard },
  { label: 'Boards', to: '/app/boards', icon: PanelsTopLeft },
  { label: 'Automations', to: '/app/automations', icon: Bot },
  { label: 'Settings', to: '/app/settings', icon: Settings },
]

function SidebarContent({ collapsed, onNavigate }) {
  return (
    <>
      <div className="border-b border-slate-100 px-4 py-5">
        <Link
          to="/app/dashboard"
          onClick={onNavigate}
          className="group flex items-center gap-3 rounded-xl transition hover:opacity-90"
          aria-label="Go to dashboard"
        >
          <div className="pulse-logo-mark">
            P
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-semibold text-slate-900">Pulse</p>
              <p className="text-xs font-medium text-slate-500">Operations Platform</p>
            </div>
          )}
        </Link>
      </div>

      <nav className="space-y-1 p-3">
        {navItems.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>
    </>
  )
}

function Sidebar({ collapsed, mobileOpen = false, onCloseMobile }) {
  return (
    <>
      <aside
        className={`hidden border-r border-slate-200 bg-white transition-all duration-200 md:sticky md:top-0 md:flex md:h-screen md:self-start md:flex-col md:overflow-y-auto ${
          collapsed ? 'w-[84px]' : 'w-64'
        }`}
      >
        <SidebarContent collapsed={collapsed} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/35 backdrop-blur-[1px]"
            onClick={onCloseMobile}
            aria-label="Close navigation"
          />
          <aside className="absolute left-0 top-0 flex h-full w-[290px] flex-col border-r border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
            <SidebarContent collapsed={false} onNavigate={onCloseMobile} />
          </aside>
        </div>
      )}
    </>
  )
}

export default Sidebar
