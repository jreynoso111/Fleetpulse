import { Bot, LayoutDashboard, PanelsTopLeft, Settings } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Boards', to: '/boards', icon: PanelsTopLeft },
  { label: 'Automations', to: '/automations', icon: Bot },
  { label: 'Settings', to: '/settings', icon: Settings },
]

function Sidebar({ collapsed }) {
  return (
    <aside
      className={`hidden border-r border-slate-200 bg-white transition-all duration-200 md:flex md:flex-col ${
        collapsed ? 'w-[84px]' : 'w-64'
      }`}
    >
      <div className="border-b border-slate-100 px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
            F
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-semibold text-slate-900">FleetOS UI</p>
              <p className="text-xs text-slate-500">Operations Platform</p>
            </div>
          )}
        </div>
      </div>

      <nav className="space-y-1 p-3">
        {navItems.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
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
    </aside>
  )
}

export default Sidebar
