import { ArrowLeft } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { usePulseWorkspace } from '../context/PulseWorkspaceContext'

const metricConfig = {
  'total-items': {
    title: 'Total items',
    description: 'Every item currently visible across your accessible boards.',
  },
  completed: {
    title: 'Completed items',
    description: 'Items marked as done across your accessible boards.',
  },
  blocked: {
    title: 'Blocked items',
    description: 'Items currently stuck or explicitly flagged as blocked.',
  },
  overdue: {
    title: 'Overdue items',
    description: 'Active items with a due date, work date, or shipping date before today.',
  },
  'due-soon': {
    title: 'Due this week',
    description: 'Active items with a due date, work date, or shipping date in the next seven days.',
  },
  'active-automations': {
    title: 'Active automations',
    description: 'Automations that are currently enabled in your workspace.',
  },
}

function DashboardDetailPage() {
  const { metricKey } = useParams()
  const { automations, boards } = usePulseWorkspace()

  if (!metricConfig[metricKey]) {
    return <Navigate to="/app/dashboard" replace />
  }

  const itemRows = boards.flatMap((board) =>
    board.items.map((item) => ({
      ...item,
      boardId: board.id,
      boardName: board.name,
      boardSlug: board.slug,
    })),
  )
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const nextWeek = new Date(today)
  nextWeek.setDate(today.getDate() + 7)

  function getStatus(item) {
    return item.status || item.shipment_status || 'Working on it'
  }

  function getDueDate(item) {
    const rawDate = item.due_date || item.work_date || item.shipping_date
    if (!rawDate) return null
    const parsed = new Date(rawDate)
    if (Number.isNaN(parsed.getTime())) return null
    parsed.setHours(0, 0, 0, 0)
    return parsed
  }

  const metric = metricConfig[metricKey]
  const rows =
    metricKey === 'total-items'
      ? itemRows
      : metricKey === 'completed'
        ? itemRows.filter((item) => getStatus(item) === 'Done')
        : metricKey === 'blocked'
          ? itemRows.filter((item) => getStatus(item) === 'Stuck' || item.blocked)
          : metricKey === 'overdue'
            ? itemRows.filter((item) => {
                if (getStatus(item) === 'Done') return false
                const dueDate = getDueDate(item)
                return dueDate ? dueDate < today : false
              })
            : metricKey === 'due-soon'
              ? itemRows.filter((item) => {
                  if (getStatus(item) === 'Done') return false
                  const dueDate = getDueDate(item)
                  return dueDate ? dueDate >= today && dueDate <= nextWeek : false
                })
              : automations.filter((automation) => automation.enabled)

  return (
    <section className="space-y-5">
      <div className="space-y-3">
        <Link
          to="/app/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-800"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>

        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{metric.title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">{metric.description}</p>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-4 shadow-soft">
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
          {rows.length} records
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 text-center shadow-soft">
          <h2 className="text-lg font-semibold text-slate-900">No records found</h2>
          <p className="mt-2 text-sm text-slate-600">There is nothing in this dashboard count right now.</p>
        </div>
      ) : metricKey === 'active-automations' ? (
        <div className="grid gap-4">
          {rows.map((automation) => (
            <article key={automation.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{automation.name}</h2>
                  <p className="mt-1 text-sm text-slate-600">{automation.description}</p>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {automation.triggerType}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Action: {automation.actionType}</span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Next run: {new Date(automation.nextRunAt).toLocaleString('en-US')}</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {rows.map((item) => (
            <Link
              key={item.id}
              to={`/app/boards/${item.boardSlug}`}
              className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-slate-300"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{item.name}</h2>
                  <p className="mt-1 text-sm text-slate-600">{item.boardName}</p>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {getStatus(item)}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                {item.owner && <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Owner: {item.owner}</span>}
                {item.category && <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Category: {item.category}</span>}
                {item.priority && <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Priority: {item.priority}</span>}
                {item.due_date && <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Due: {item.due_date}</span>}
                {item.blocked ? <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-rose-700">Blocked</span> : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

export default DashboardDetailPage
