import { Activity, AlertTriangle, ArrowRight, Bot, CalendarClock, CheckCircle2, LayoutGrid, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { usePulseWorkspace } from '../context/PulseWorkspaceContext'

const focusOptions = [
  { id: 'overview', label: 'Overview' },
  { id: 'risk', label: 'Risk' },
  { id: 'teams', label: 'Teams' },
]

const kpiIcons = {
  'total-items': LayoutGrid,
  completed: CheckCircle2,
  blocked: AlertTriangle,
  overdue: CalendarClock,
  'due-soon': Activity,
  'active-automations': Bot,
}

function getRiskBadgeClass(label) {
  if (label === 'Blocked') return 'border-rose-200 bg-rose-50 text-rose-700'
  if (label === 'Overdue') return 'border-orange-200 bg-orange-50 text-orange-700'
  return 'border-sky-200 bg-sky-50 text-sky-700'
}

function getBoardHealthTone(board) {
  if (board.blocked || board.overdue) return 'text-rose-700'
  if (board.dueSoon) return 'text-amber-700'
  return 'text-emerald-700'
}

function ProgressBar({ value, tone = 'bg-blue-500' }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }} />
    </div>
  )
}

function DashboardPage() {
  const navigate = useNavigate()
  const { dashboardData, boards } = usePulseWorkspace()
  const [focus, setFocus] = useState('overview')

  const topBoard = dashboardData.boardHealth[0]
  const healthSummary = useMemo(() => {
    if (!dashboardData.totalItems) return 'No tracked work yet'
    if (dashboardData.blockedItems || dashboardData.overdueItems.length) {
      return `${dashboardData.blockedItems + dashboardData.overdueItems.length} items need attention`
    }
    if (dashboardData.dueSoonItems.length) return `${dashboardData.dueSoonItems.length} items due this week`
    return 'Workspace is on track'
  }, [dashboardData])

  if (!dashboardData.totalItems) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-soft">
        <h2 className="text-lg font-semibold text-slate-800">No dashboard data</h2>
        <p className="mt-1 text-sm text-slate-500">Create boards and items to populate your workspace analytics.</p>
      </section>
    )
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Pulse command center</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
          <p className="max-w-3xl text-sm text-slate-600">
            Track portfolio health across {boards.length} boards, identify work that needs attention, and jump directly into the board or record behind each signal.
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-soft">
          {focusOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFocus(option.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                focus === option.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-500">Current signal</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">{healthSummary}</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Completion is at {dashboardData.completionRate}%. {dashboardData.activeItems} items remain active across the workspace.
              </p>
            </div>
            <Link
              to={topBoard ? `/app/boards/${topBoard.slug}` : '/app/boards'}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Open highest-risk board
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Completion</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{dashboardData.completionRate}%</p>
              <div className="mt-3">
                <ProgressBar value={dashboardData.completionRate} tone="bg-emerald-500" />
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Risk load</p>
              <p className="mt-2 text-2xl font-semibold text-rose-700">{dashboardData.blockedItems + dashboardData.overdueItems.length}</p>
              <p className="mt-3 text-xs text-slate-500">Blocked plus overdue items</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Automation coverage</p>
              <p className="mt-2 text-2xl font-semibold text-amber-700">{dashboardData.activeAutomations}</p>
              <p className="mt-3 text-xs text-slate-500">Active workspace automations</p>
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-900">Workload leaders</h2>
          </div>
          <div className="mt-4 space-y-3">
            {dashboardData.ownerWorkload.slice(0, 4).map((owner) => (
              <div key={owner.owner} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-medium text-slate-700">{owner.owner}</span>
                  <span className="text-xs text-slate-500">{owner.active} active</span>
                </div>
                <ProgressBar value={Math.min(owner.active * 12, 100)} tone={owner.blocked || owner.overdue ? 'bg-rose-500' : 'bg-blue-500'} />
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {dashboardData.kpis.map((item) => {
          const Icon = kpiIcons[item.key] || Activity

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => navigate(`/app/dashboard/${item.key}`)}
              className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-slate-300"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.label}</p>
                <Icon size={17} className="text-slate-400" />
              </div>
              <p className={`mt-3 text-3xl font-semibold ${item.tone}`}>{item.value}</p>
              <p className="mt-2 text-xs text-slate-500">{item.helper}</p>
            </button>
          )
        })}
      </div>

      {focus !== 'teams' && (
        <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">Priority queue</h2>
                <p className="text-xs text-slate-500">Blocked, overdue, and due-soon work sorted by urgency</p>
              </div>
              <Link to="/app/dashboard/blocked" className="text-xs font-semibold text-slate-500 transition hover:text-slate-900">
                View all
              </Link>
            </div>
            <div className="space-y-2">
              {dashboardData.priorityItems.length ? (
                dashboardData.priorityItems.map((item) => (
                  <Link
                    key={item.id}
                    to={`/app/boards/${item.boardSlug}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 transition hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{item.name || 'Untitled item'}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">{item.boardName}{item.owner ? ` - ${item.owner}` : ''}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${getRiskBadgeClass(item.riskLabel)}`}>
                      {item.riskLabel}
                    </span>
                  </Link>
                ))
              ) : (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  No blocked, overdue, or due-soon items right now.
                </p>
              )}
            </div>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-slate-800">Board health</h2>
              <p className="text-xs text-slate-500">Boards ranked by blocked, overdue, and upcoming work</p>
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              {dashboardData.boardHealth.map((board) => (
                <Link
                  key={board.id}
                  to={`/app/boards/${board.slug}`}
                  className="grid grid-cols-[1fr_auto] gap-3 border-b border-slate-200 p-3 text-sm last:border-b-0 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{board.name}</p>
                    <div className="mt-2">
                      <ProgressBar value={board.completionRate} tone={board.blocked || board.overdue ? 'bg-rose-500' : 'bg-emerald-500'} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${getBoardHealthTone(board)}`}>{board.completionRate}%</p>
                    <p className="mt-1 text-xs text-slate-500">{board.blocked} blocked - {board.overdue} overdue</p>
                  </div>
                </Link>
              ))}
            </div>
          </article>
        </div>
      )}

      {focus !== 'risk' && (
        <div className="grid gap-4 xl:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft xl:col-span-2">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-slate-800">Weekly completed items</h2>
              <p className="text-xs text-slate-500">Completed work during the latest seven-day window</p>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardData.weeklyThroughput}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="completed" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-slate-800">Status split</h2>
              <p className="text-xs text-slate-500">Current state distribution</p>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dashboardData.pieData} cx="50%" cy="50%" outerRadius={88} dataKey="value" label>
                    {dashboardData.pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </article>
        </div>
      )}

      {focus !== 'risk' && (
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Workload trend</h2>
            <p className="text-xs text-slate-500">Six-week comparison of active work versus completed work</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardData.trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="week" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="active" stroke="#2563eb" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
      )}
    </section>
  )
}

export default DashboardPage
