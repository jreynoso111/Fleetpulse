import { Bot, PencilLine, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { usePulseWorkspace } from '../context/PulseWorkspaceContext'

const automationOperatorOptions = [
  { value: 'date_passed', label: 'Date has passed' },
  { value: 'equals', label: 'Is equal to' },
  { value: 'not_equals', label: 'Is not equal to' },
  { value: 'contains', label: 'Contains' },
  { value: 'greater_than', label: 'Is greater than' },
  { value: 'less_than', label: 'Is less than' },
  { value: 'between', label: 'Is between' },
  { value: 'is_empty', label: 'Is empty' },
  { value: 'is_not_empty', label: 'Is not empty' },
]

function formatDateTime(value) {
  if (!value) return 'Not scheduled'
  return new Date(value).toLocaleString()
}

function describeAutomationRule(automation, boards) {
  const config = automation.config || {}
  const scopedBoard = boards.find((board) => board.id === config.boardId)
  const scopedBoardsLabel =
    config.boardScope === 'single' && scopedBoard ? scopedBoard.name : 'all accessible boards'
  const operatorLabel =
    automationOperatorOptions.find((option) => option.value === config.operator)?.label || automation.triggerType

  return `${operatorLabel} on ${config.columnLabel || 'selected column'} in ${scopedBoardsLabel}.`
}

function getColumnInputType(columnType) {
  if (columnType === 'number' || columnType === 'currency') return 'number'
  if (columnType === 'date') return 'date'
  return 'text'
}

function getDefaultOperator(columnType) {
  return columnType === 'date' ? 'date_passed' : 'equals'
}

function getOperatorOptions(columnType) {
  return automationOperatorOptions.filter((option) => columnType === 'date' || option.value !== 'date_passed')
}

function getComparisonPlaceholder(column) {
  if (!column) return 'Comparison value'
  if (column.type === 'currency') return '0.00'
  if (column.type === 'number') return 'Enter a number'
  if (column.type === 'date') return 'Select a date'
  if (column.type === 'email') return 'name@company.com'
  if (column.type === 'phone') return 'Enter a phone number'
  return `Value for ${column.label.toLowerCase()}`
}

function renderComparisonField({ column, value, onChange, label, idSuffix = 'value' }) {
  if (column?.type === 'boolean') {
    return (
      <label className="space-y-1.5">
        <span className="text-sm font-medium text-slate-900">{label}</span>
        <select
          value={value}
          onChange={onChange}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-200 transition focus:ring"
        >
          <option value="">Select a value</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      </label>
    )
  }

  if (column?.type === 'status') {
    return (
      <label className="space-y-1.5">
        <span className="text-sm font-medium text-slate-900">{label}</span>
        <select
          value={value}
          onChange={onChange}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-200 transition focus:ring"
        >
          <option value="">Select a status</option>
          {(column.statusOptions || []).map((option) => (
            <option key={`${idSuffix}-${option}`} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    )
  }

  return (
    <label className="space-y-1.5">
      <span className="text-sm font-medium text-slate-900">{label}</span>
      <input
        type={getColumnInputType(column?.type)}
        step={column?.type === 'currency' ? '0.01' : column?.type === 'number' ? '1' : undefined}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-200 transition focus:ring"
        placeholder={getComparisonPlaceholder(column)}
      />
    </label>
  )
}

function AutomationModal({ boards, currentUser, automation = null, onClose, onSave }) {
  const columnCatalog = useMemo(() => {
    const catalog = new Map()

    boards.forEach((board) => {
      board.columns.forEach((column) => {
        if (!catalog.has(column.key)) {
          catalog.set(column.key, {
            key: column.key,
            label: column.label,
            type: column.type,
            statusOptions: column.statusOptions || [],
          })
        }
      })
    })

    return Array.from(catalog.values()).sort((left, right) => left.label.localeCompare(right.label))
  }, [boards])

  const initialBoardId = automation?.config?.boardId || boards[0]?.id || ''
  const initialColumns =
    (automation?.config?.boardScope === 'single'
      ? boards.find((board) => board.id === initialBoardId)?.columns
      : columnCatalog) || []
  const initialColumn =
    initialColumns.find((column) => column.key === automation?.config?.columnKey) ||
    columnCatalog.find((column) => column.key === automation?.config?.columnKey) ||
    initialColumns[0] ||
    columnCatalog[0] ||
    null

  const [form, setForm] = useState(() => ({
    name: automation?.name || '',
    description: automation?.description || '',
    boardScope: automation?.config?.boardScope || 'all',
    boardId: initialBoardId,
    columnKey: automation?.config?.columnKey || initialColumn?.key || '',
    operator: automation?.config?.operator || getDefaultOperator(initialColumn?.type),
    value: automation?.config?.value || '',
    secondaryValue: automation?.config?.secondaryValue || '',
    message: automation?.config?.message || '',
    scheduleTime: automation?.config?.scheduleTime || '09:00',
  }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const selectedColumn =
    columnCatalog.find((column) => column.key === form.columnKey) ||
    boards
      .find((board) => board.id === form.boardId)
      ?.columns.find((column) => column.key === form.columnKey) ||
    columnCatalog[0] ||
    null

  const availableColumns = useMemo(() => {
    if (form.boardScope !== 'single') return columnCatalog
    return boards.find((board) => board.id === form.boardId)?.columns || []
  }, [boards, columnCatalog, form.boardId, form.boardScope])

  const operatorOptions = useMemo(() => getOperatorOptions(selectedColumn?.type), [selectedColumn?.type])
  const requiresComparisonValue = !['date_passed', 'is_empty', 'is_not_empty'].includes(form.operator)

  useEffect(() => {
    if (!availableColumns.length) return
    if (availableColumns.some((column) => column.key === form.columnKey)) return

    setForm((current) => ({
      ...current,
      columnKey: availableColumns[0]?.key || '',
    }))
  }, [availableColumns, form.columnKey])

  useEffect(() => {
    if (!selectedColumn) return

    const nextOperatorOptions = getOperatorOptions(selectedColumn.type)
    const hasCurrentOperator = nextOperatorOptions.some((option) => option.value === form.operator)
    if (hasCurrentOperator) return

    setForm((current) => ({
      ...current,
      operator: getDefaultOperator(selectedColumn.type),
      value: '',
      secondaryValue: '',
    }))
  }, [form.operator, selectedColumn])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const selectedBoard = boards.find((board) => board.id === form.boardId) || null
    const effectiveColumn =
      availableColumns.find((column) => column.key === form.columnKey) ||
      selectedColumn

    if (!form.name.trim()) {
      setError('Automation name is required.')
      return
    }

    if (!effectiveColumn) {
      setError('Select a column to watch.')
      return
    }

    setSaving(true)

    try {
      await onSave({
        name: form.name.trim(),
        description:
          form.description.trim() ||
          `Creates a notification when ${effectiveColumn.label} matches the configured rule.`,
        triggerType: effectiveColumn.type === 'date' && form.operator === 'date_passed' ? 'Date condition' : 'Row condition',
        enabled: true,
        config: {
          boardScope: form.boardScope,
          boardId: form.boardScope === 'single' ? selectedBoard?.id || '' : '',
          boardName: form.boardScope === 'single' ? selectedBoard?.name || '' : '',
          columnKey: effectiveColumn.key,
          columnLabel: effectiveColumn.label,
          columnType: effectiveColumn.type,
          operator: form.operator,
          value: form.value,
          secondaryValue: form.secondaryValue,
          message: form.message.trim(),
          scheduleTime: form.scheduleTime,
        },
        targetUserId: currentUser?.id,
      })
      onClose()
    } catch (nextError) {
      setError(nextError.message || 'Could not save automation.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className="max-h-[calc(100vh-2rem)] w-full max-w-4xl overflow-y-auto rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              {automation ? 'Edit automation' : 'New automation'}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              {automation ? 'Update notification automation' : 'Create notification automation'}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Build a rule that watches accessible boards and sends a notification to your account when it matches.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
            aria-label="Close automation modal"
          >
            <X size={16} />
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-900">Automation name</span>
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-200 transition focus:ring"
                placeholder="Overdue due date alert"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-900">Description</span>
              <input
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-200 transition focus:ring"
                placeholder="Optional summary shown on the automation card"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-900">Board scope</span>
              <select
                value={form.boardScope}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    boardScope: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-200 transition focus:ring"
              >
                <option value="all">All accessible boards</option>
                <option value="single">One board only</option>
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-900">Board</span>
              <select
                value={form.boardId}
                disabled={form.boardScope !== 'single'}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    boardId: event.target.value,
                    columnKey:
                      boards.find((board) => board.id === event.target.value)?.columns[0]?.key || current.columnKey,
                  }))
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-200 transition focus:ring disabled:bg-slate-50 disabled:text-slate-400"
              >
                {boards.map((board) => (
                  <option key={board.id} value={board.id}>
                    {board.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-900">Watch column</span>
              <select
                value={form.columnKey}
                onChange={(event) => setForm((current) => ({ ...current, columnKey: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-200 transition focus:ring"
              >
                {availableColumns.map((column) => (
                  <option key={column.key} value={column.key}>
                    {column.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-900">Condition</span>
              <select
                value={form.operator}
                onChange={(event) => setForm((current) => ({ ...current, operator: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-200 transition focus:ring"
              >
                {operatorOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-900">Run time</span>
              <input
                type="time"
                value={form.scheduleTime}
                onChange={(event) => setForm((current) => ({ ...current, scheduleTime: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-200 transition focus:ring"
              />
              <p className="text-xs text-slate-500">
                Pulse evaluates this automation daily at the selected time.
              </p>
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-900">Notification message</span>
              <input
                value={form.message}
                onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-200 transition focus:ring"
                placeholder="Optional custom notification text"
              />
            </label>
          </div>

          {requiresComparisonValue && (
            <div className={`grid gap-4 ${form.operator === 'between' ? 'md:grid-cols-2' : ''}`}>
              {renderComparisonField({
                column: selectedColumn,
                value: form.value,
                onChange: (event) => setForm((current) => ({ ...current, value: event.target.value })),
                label: 'Value',
              })}

              {form.operator === 'between' &&
                renderComparisonField({
                  column: selectedColumn,
                  value: form.secondaryValue,
                  onChange: (event) => setForm((current) => ({ ...current, secondaryValue: event.target.value })),
                  label: 'And value',
                  idSuffix: 'secondary',
                })}
            </div>
          )}

          {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: 'var(--pulse-accent)' }}
            >
              {saving ? (automation ? 'Saving...' : 'Creating...') : automation ? 'Save changes' : 'Create automation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AutomationsPage() {
  const { automations, boards, currentUser, createAutomation, deleteAutomation, toggleAutomation, updateAutomation } = usePulseWorkspace()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingAutomationId, setEditingAutomationId] = useState('')

  const editingAutomation = automations.find((automation) => automation.id === editingAutomationId) || null
  if (!currentUser) return null

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Automations</h1>
          <p className="max-w-3xl text-sm text-slate-600">
            Create notification automations that watch the boards you can access and add alerts to your Pulse account.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: 'var(--pulse-accent)' }}
        >
          <Plus size={16} />
          New automation
        </button>
      </div>

      {showCreateModal && (
        <AutomationModal
          boards={boards}
          currentUser={currentUser}
          onClose={() => setShowCreateModal(false)}
          onSave={(payload) => createAutomation(payload)}
        />
      )}

      {editingAutomation && (
        <AutomationModal
          automation={editingAutomation}
          boards={boards}
          currentUser={currentUser}
          onClose={() => setEditingAutomationId('')}
          onSave={(payload) => updateAutomation(editingAutomation.id, payload)}
        />
      )}

      {automations.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-8 text-center shadow-soft">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <Bot size={20} />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">No automations yet</h2>
          <p className="mt-1 text-sm text-slate-600">
            Create your first notification automation to watch dates, values, and shared-board activity.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {automations.map((automation) => (
            <article key={automation.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
              {(() => {
                const canManageAutomation = automation.createdByUserId === currentUser.id

                return (
              <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">{automation.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{automation.description}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Automation owner only
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!canManageAutomation}
                  onClick={() =>
                    toggleAutomation(automation.id).catch((error) => {
                      console.error('Failed to update automation.', error)
                    })
                  }
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    automation.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {automation.enabled ? 'Enabled' : 'Paused'}
                </button>
              </div>

              <dl className="mt-4 space-y-2 text-sm text-slate-600">
                <div className="flex justify-between gap-3">
                  <dt>Trigger</dt>
                  <dd className="font-medium text-right text-slate-800">{automation.triggerType}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Action</dt>
                  <dd className="font-medium text-right text-slate-800">{automation.actionType}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Rule</dt>
                  <dd className="max-w-[16rem] text-right text-slate-800">{describeAutomationRule(automation, boards)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Last run</dt>
                  <dd className="text-right text-slate-800">{formatDateTime(automation.lastRunAt)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Run time</dt>
                  <dd className="text-right text-slate-800">{automation.config?.scheduleTime || '09:00'}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Next run</dt>
                  <dd className="text-right text-slate-800">{formatDateTime(automation.nextRunAt)}</dd>
                </div>
              </dl>

              <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                {canManageAutomation ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditingAutomationId(automation.id)}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      <PencilLine size={14} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const confirmed = window.confirm(`Delete automation "${automation.name}"?`)
                        if (!confirmed) return

                        deleteAutomation(automation.id).catch((error) => {
                          console.error('Failed to delete automation.', error)
                        })
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </>
                ) : (
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Owner only</span>
                )}
              </div>
              </>
                )
              })()}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default AutomationsPage
