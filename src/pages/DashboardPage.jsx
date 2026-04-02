import { useEffect, useState } from 'react'
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

const kpis = [
  { label: 'Active items', value: 128, tone: 'text-blue-600' },
  { label: 'Completed', value: 94, tone: 'text-emerald-600' },
  { label: 'Pending', value: 34, tone: 'text-amber-600' },
  { label: 'Alerts', value: 7, tone: 'text-rose-600' },
]

const weeklyThroughput = [
  { day: 'Mon', completed: 12 },
  { day: 'Tue', completed: 17 },
  { day: 'Wed', completed: 14 },
  { day: 'Thu', completed: 19 },
  { day: 'Fri', completed: 22 },
  { day: 'Sat', completed: 10 },
  { day: 'Sun', completed: 9 },
]

const trendData = [
  { week: 'W1', active: 92, pending: 25 },
  { week: 'W2', active: 101, pending: 28 },
  { week: 'W3', active: 110, pending: 33 },
  { week: 'W4', active: 128, pending: 34 },
]

const pieData = [
  { name: 'Done', value: 57, color: '#10b981' },
  { name: 'Working', value: 31, color: '#f59e0b' },
  { name: 'Blocked', value: 12, color: '#ef4444' },
]

function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="h-7 w-48 animate-pulse rounded bg-slate-100" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white" />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white" />
      </section>
    )
  }

  if (!weeklyThroughput.length || !trendData.length || !pieData.length) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-soft">
        <h2 className="text-lg font-semibold text-slate-800">No dashboard data</h2>
        <p className="mt-1 text-sm text-slate-500">Connect a data source to populate analytics widgets.</p>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-600">Operational snapshot across active work, performance, and risk.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <article
            key={item.label}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft transition hover:-translate-y-0.5"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.label}</p>
            <p className={`mt-3 text-3xl font-semibold ${item.tone}`}>{item.value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft xl:col-span-2">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Weekly Completed Items</h2>
            <p className="text-xs text-slate-500">Mock throughput data</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyThroughput}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip />
                <Bar dataKey="completed" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Status Split</h2>
            <p className="text-xs text-slate-500">Current workload distribution</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label>
                  {pieData.map((entry) => (
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

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-800">Workload Trend</h2>
          <p className="text-xs text-slate-500">Active vs pending trend (mock)</p>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="week" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="active" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>
    </section>
  )
}

export default DashboardPage
