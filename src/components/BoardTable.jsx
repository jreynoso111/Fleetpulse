import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { defaultColumns, initialRows, statusColors, statusOptions } from '../data/boardMock'

const columnTypeOptions = ['text', 'number', 'date', 'status', 'boolean']

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function getDefaultValue(type) {
  if (type === 'number') return 0
  if (type === 'boolean') return false
  if (type === 'status') return statusOptions[0]
  return ''
}

function formatColumnValue(value, type) {
  if (type === 'boolean') return value ? 'Yes' : 'No'
  if (type === 'date') return value || '—'
  if (type === 'number') return value === '' ? '0' : value
  return value || '—'
}

function getConditionsByType(type) {
  if (type === 'boolean') return ['true/false']
  if (type === 'number' || type === 'date') return ['equals', 'greater than']
  return ['equals', 'contains']
}

function BoardTable({ columns = defaultColumns, rows = initialRows }) {
  const [boardColumns, setBoardColumns] = useState(columns)
  const [boardRows, setBoardRows] = useState(rows)
  const [activeCell, setActiveCell] = useState(null)
  const [openColumnMenu, setOpenColumnMenu] = useState(null)
  const [newColumn, setNewColumn] = useState({ label: '', type: 'text' })
  const [filters, setFilters] = useState([])
  const [viewMode, setViewMode] = useState('table')
  const [draggingId, setDraggingId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 550)
    return () => clearTimeout(timer)
  }, [])

  const nextItemNumber = useMemo(() => boardRows.length + 1, [boardRows.length])
  const statusColumn = useMemo(
    () => boardColumns.find((column) => column.type === 'status') || null,
    [boardColumns],
  )

  const filteredRows = useMemo(() => {
    if (filters.length === 0) return boardRows

    return boardRows.filter((row) =>
      filters.every((filter) => {
        const column = boardColumns.find((item) => item.key === filter.columnKey)
        if (!column) return true

        const rawValue = row[filter.columnKey]
        const normalizedValue = String(rawValue ?? '').toLowerCase()
        const normalizedTarget = String(filter.value ?? '').toLowerCase()

        if (filter.condition === 'equals') return normalizedValue === normalizedTarget
        if (filter.condition === 'contains') return normalizedValue.includes(normalizedTarget)

        if (filter.condition === 'greater than') {
          if (column.type === 'date') return new Date(rawValue).getTime() > new Date(filter.value).getTime()
          return Number(rawValue) > Number(filter.value)
        }

        if (filter.condition === 'true/false') return Boolean(rawValue) === (filter.value === 'true')
        return true
      }),
    )
  }, [boardColumns, boardRows, filters])

  const kanbanGroups = useMemo(() => {
    if (!statusColumn) return {}

    return statusOptions.reduce((accumulator, status) => {
      accumulator[status] = filteredRows.filter((row) => row[statusColumn.key] === status)
      return accumulator
    }, {})
  }, [filteredRows, statusColumn])

  const updateCell = useCallback((rowId, columnKey, value) => {
    setBoardRows((currentRows) =>
      currentRows.map((row) => (row.id === rowId ? { ...row, [columnKey]: value } : row)),
    )
  }, [])

  const addRow = useCallback(() => {
    const rowValues = boardColumns.reduce((accumulator, column) => {
      if (column.key === 'name') {
        accumulator[column.key] = `New task ${nextItemNumber}`
        return accumulator
      }

      if (column.key === 'owner') {
        accumulator[column.key] = 'Unassigned'
        return accumulator
      }

      accumulator[column.key] = getDefaultValue(column.type)
      return accumulator
    }, {})

    setBoardRows((currentRows) => [...currentRows, { id: `item-${Date.now()}`, ...rowValues }])
  }, [boardColumns, nextItemNumber])

  const addColumn = useCallback(() => {
    const cleanLabel = newColumn.label.trim()
    if (!cleanLabel) return

    const uniqueKey = `${cleanLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`

    const createdColumn = { key: uniqueKey, label: cleanLabel, type: newColumn.type, minWidth: 170 }

    setBoardColumns((currentColumns) => [...currentColumns, createdColumn])
    setBoardRows((currentRows) =>
      currentRows.map((row) => ({ ...row, [uniqueKey]: getDefaultValue(newColumn.type) })),
    )
    setNewColumn({ label: '', type: 'text' })
  }, [newColumn])

  const addFilter = useCallback(() => {
    if (boardColumns.length === 0) return

    const firstColumn = boardColumns[0]
    const defaultCondition = getConditionsByType(firstColumn.type)[0]

    setFilters((currentFilters) => [
      ...currentFilters,
      {
        id: `filter-${Date.now()}`,
        columnKey: firstColumn.key,
        condition: defaultCondition,
        value: firstColumn.type === 'boolean' ? 'true' : '',
      },
    ])
  }, [boardColumns])

  const updateFilter = useCallback(
    (filterId, updates) => {
      setFilters((currentFilters) =>
        currentFilters.map((filter) => {
          if (filter.id !== filterId) return filter

          const nextFilter = { ...filter, ...updates }
          const selectedColumn = boardColumns.find((column) => column.key === nextFilter.columnKey)

          if (updates.columnKey && selectedColumn) {
            nextFilter.condition = getConditionsByType(selectedColumn.type)[0]
            nextFilter.value = selectedColumn.type === 'boolean' ? 'true' : ''
          }

          return nextFilter
        }),
      )
    },
    [boardColumns],
  )

  const removeFilter = useCallback((filterId) => {
    setFilters((currentFilters) => currentFilters.filter((filter) => filter.id !== filterId))
  }, [])

  const renameColumn = useCallback(
    (columnKey) => {
      const targetColumn = boardColumns.find((column) => column.key === columnKey)
      const nextLabel = window.prompt('Rename column', targetColumn?.label ?? '')
      if (!nextLabel || !nextLabel.trim()) return

      setBoardColumns((currentColumns) =>
        currentColumns.map((column) =>
          column.key === columnKey ? { ...column, label: nextLabel.trim() } : column,
        ),
      )
      setOpenColumnMenu(null)
    },
    [boardColumns],
  )

  const deleteColumn = useCallback((columnKey) => {
    setBoardColumns((currentColumns) => currentColumns.filter((column) => column.key !== columnKey))
    setBoardRows((currentRows) =>
      currentRows.map((row) => {
        const updatedRow = { ...row }
        delete updatedRow[columnKey]
        return updatedRow
      }),
    )
    setFilters((currentFilters) => currentFilters.filter((filter) => filter.columnKey !== columnKey))
    setOpenColumnMenu(null)
  }, [])

  const handleDropToStatus = useCallback(
    (status) => {
      if (!statusColumn || !draggingId) return

      setBoardRows((currentRows) =>
        currentRows.map((row) =>
          row.id === draggingId ? { ...row, [statusColumn.key]: status } : row,
        ),
      )
      setDraggingId(null)
    },
    [draggingId, statusColumn],
  )

  const isEditing = useCallback(
    (rowId, columnKey) => activeCell?.rowId === rowId && activeCell?.columnKey === columnKey,
    [activeCell],
  )

  if (isLoading) {
    return <BoardLoadingState />
  }

  if (hasError) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-soft">
        <p className="font-medium">Could not load board data.</p>
        <button
          type="button"
          className="mt-3 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition hover:bg-rose-100"
          onClick={() => {
            setHasError(false)
            setIsLoading(true)
            setTimeout(() => setIsLoading(false), 450)
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-soft">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Column name</label>
            <input
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none ring-sky-200 transition focus:ring"
              placeholder="e.g. Priority"
              value={newColumn.label}
              onChange={(event) => setNewColumn((state) => ({ ...state, label: event.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Type</label>
            <select
              className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none ring-sky-200 transition focus:ring"
              value={newColumn.type}
              onChange={(event) => setNewColumn((state) => ({ ...state, type: event.target.value }))}
            >
              {columnTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 shadow-soft transition hover:-translate-y-0.5 hover:bg-slate-50 active:translate-y-0"
            onClick={addColumn}
          >
            + Add column
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:bg-slate-50"
            onClick={() => setHasError(true)}
          >
            Simulate error
          </button>

          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
            {['table', 'kanban'].map((mode) => (
              <button
                key={mode}
                type="button"
                className={`rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                  viewMode === mode
                    ? 'bg-white text-slate-900 shadow-soft'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                onClick={() => setViewMode(mode)}
              >
                {mode} view
              </button>
            ))}
          </div>
        </div>
      </div>

      <FilterBar
        filters={filters}
        boardColumns={boardColumns}
        addFilter={addFilter}
        updateFilter={updateFilter}
        removeFilter={removeFilter}
      />

      <div className="transition-all duration-300">
        {filteredRows.length === 0 ? (
          <EmptyState onClearFilters={() => setFilters([])} />
        ) : viewMode === 'table' ? (
          <TableView
            boardColumns={boardColumns}
            filteredRows={filteredRows}
            isEditing={isEditing}
            openColumnMenu={openColumnMenu}
            setOpenColumnMenu={setOpenColumnMenu}
            renameColumn={renameColumn}
            deleteColumn={deleteColumn}
            setActiveCell={setActiveCell}
            updateCell={updateCell}
          />
        ) : (
          <KanbanView
            statusColumn={statusColumn}
            kanbanGroups={kanbanGroups}
            setDraggingId={setDraggingId}
            handleDropToStatus={handleDropToStatus}
            boardColumns={boardColumns}
          />
        )}
      </div>

      <button
        type="button"
        className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-soft transition hover:-translate-y-0.5 hover:bg-slate-50 active:translate-y-0"
        onClick={addRow}
      >
        + Add new row
      </button>
    </div>
  )
}

const FilterBar = memo(function FilterBar({ filters, boardColumns, addFilter, updateFilter, removeFilter }) {
  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 shadow-soft transition-all duration-300">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Filters</p>
        <button
          type="button"
          className="inline-flex h-8 items-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          onClick={addFilter}
        >
          + Add filter
        </button>
      </div>

      {filters.length === 0 ? (
        <p className="text-sm text-slate-500">No filters applied.</p>
      ) : (
        <div className="space-y-2">
          {filters.map((filter) => {
            const selectedColumn = boardColumns.find((column) => column.key === filter.columnKey)
            const conditionOptions = getConditionsByType(selectedColumn?.type)
            const showBooleanValue = filter.condition === 'true/false'

            return (
              <div key={filter.id} className="flex flex-wrap items-center gap-2">
                <select
                  className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none ring-sky-200 transition focus:ring"
                  value={filter.columnKey}
                  onChange={(event) => updateFilter(filter.id, { columnKey: event.target.value })}
                >
                  {boardColumns.map((column) => (
                    <option key={column.key} value={column.key}>
                      {column.label}
                    </option>
                  ))}
                </select>

                <select
                  className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none ring-sky-200 transition focus:ring"
                  value={filter.condition}
                  onChange={(event) => updateFilter(filter.id, { condition: event.target.value })}
                >
                  {conditionOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>

                {showBooleanValue ? (
                  <select
                    className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none ring-sky-200 transition focus:ring"
                    value={filter.value}
                    onChange={(event) => updateFilter(filter.id, { value: event.target.value })}
                  >
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                ) : (
                  <input
                    className="rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none ring-sky-200 transition focus:ring"
                    placeholder="Filter value"
                    value={filter.value}
                    type={selectedColumn?.type === 'date' ? 'date' : selectedColumn?.type === 'number' ? 'number' : 'text'}
                    onChange={(event) => updateFilter(filter.id, { value: event.target.value })}
                  />
                )}

                <button
                  type="button"
                  className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-500 transition hover:bg-slate-50"
                  onClick={() => removeFilter(filter.id)}
                >
                  Remove
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
})

const TableView = memo(function TableView({
  boardColumns,
  filteredRows,
  isEditing,
  openColumnMenu,
  setOpenColumnMenu,
  renameColumn,
  deleteColumn,
  setActiveCell,
  updateCell,
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-soft">
      <table className="min-w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-slate-50">
          <tr>
            {boardColumns.map((column) => (
              <th
                key={column.key}
                className="relative border-b border-r border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 last:border-r-0"
                style={{ minWidth: column.minWidth }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span>{column.label}</span>
                  <button
                    type="button"
                    className="rounded px-1.5 py-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    onClick={() =>
                      setOpenColumnMenu((currentValue) =>
                        currentValue === column.key ? null : column.key,
                      )
                    }
                  >
                    ⋯
                  </button>
                </div>

                {openColumnMenu === column.key && (
                  <div className="absolute right-2 top-10 z-20 w-28 rounded-lg border border-slate-200 bg-white p-1 shadow-soft">
                    <button
                      type="button"
                      className="block w-full rounded px-2 py-1 text-left text-xs text-slate-700 transition hover:bg-slate-50"
                      onClick={() => renameColumn(column.key)}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      className="block w-full rounded px-2 py-1 text-left text-xs text-rose-600 transition hover:bg-rose-50"
                      onClick={() => deleteColumn(column.key)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {filteredRows.map((row) => (
            <tr key={row.id} className="group transition hover:bg-sky-50/40">
              {boardColumns.map((column) => (
                <td
                  key={`${row.id}-${column.key}`}
                  className="h-14 border-b border-r border-slate-200 px-4 py-2 align-middle last:border-r-0"
                  onClick={() => setActiveCell({ rowId: row.id, columnKey: column.key })}
                >
                  {isEditing(row.id, column.key) ? (
                    <EditableCell
                      column={column}
                      value={row[column.key]}
                      rowId={row.id}
                      onBlur={() => setActiveCell(null)}
                      onChange={updateCell}
                    />
                  ) : (
                    <ReadOnlyCell column={column} value={row[column.key]} />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
})

const KanbanView = memo(function KanbanView({
  statusColumn,
  kanbanGroups,
  setDraggingId,
  handleDropToStatus,
  boardColumns,
}) {
  if (!statusColumn) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-soft">
        Add a status column to use Kanban view.
      </div>
    )
  }

  const nameColumn = boardColumns.find((column) => column.key === 'name')
  const ownerColumn = boardColumns.find((column) => column.key === 'owner')

  return (
    <div className="grid min-h-[300px] gap-4 md:grid-cols-3">
      {statusOptions.map((status) => (
        <div
          key={status}
          className="rounded-xl border border-slate-200 bg-white p-3 shadow-soft transition-all duration-300"
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => handleDropToStatus(status)}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[status]}`}>
              {status}
            </span>
            <span className="text-xs text-slate-400">{kanbanGroups[status]?.length || 0}</span>
          </div>

          <div className="space-y-2">
            {(kanbanGroups[status] || []).map((item) => (
              <article
                key={item.id}
                draggable
                onDragStart={() => setDraggingId(item.id)}
                className="cursor-grab rounded-lg border border-slate-200 bg-slate-50 p-3 transition hover:-translate-y-0.5 hover:shadow-soft"
              >
                <p className="text-sm font-medium text-slate-800">{item[nameColumn?.key] || 'Untitled'}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-700">
                    {getInitials(item[ownerColumn?.key] || 'NA')}
                  </span>
                  <span>{item[ownerColumn?.key] || 'Unassigned'}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
})

function EmptyState({ onClearFilters }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-soft">
      <h3 className="text-base font-semibold text-slate-800">No items match these filters</h3>
      <p className="mt-1 text-sm text-slate-500">Try removing one or more filters to see results.</p>
      <button
        type="button"
        className="mt-4 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        onClick={onClearFilters}
      >
        Clear filters
      </button>
    </div>
  )
}

function BoardLoadingState() {
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
      <div className="h-7 w-1/3 animate-pulse rounded bg-slate-100" />
      <div className="h-40 animate-pulse rounded bg-slate-100" />
      <div className="h-40 animate-pulse rounded bg-slate-100" />
    </div>
  )
}

function EditableCell({ column, value, rowId, onBlur, onChange }) {
  if (column.type === 'status') {
    return (
      <select
        autoFocus
        className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none ring-sky-200 transition focus:ring"
        value={value}
        onBlur={onBlur}
        onChange={(event) => onChange(rowId, column.key, event.target.value)}
      >
        {statusOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    )
  }

  if (column.type === 'boolean') {
    return (
      <select
        autoFocus
        className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none ring-sky-200 transition focus:ring"
        value={String(value)}
        onBlur={onBlur}
        onChange={(event) => onChange(rowId, column.key, event.target.value === 'true')}
      >
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    )
  }

  return (
    <input
      autoFocus
      type={column.type === 'date' ? 'date' : column.type === 'number' ? 'number' : 'text'}
      value={value}
      className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none ring-sky-200 transition focus:ring"
      onBlur={onBlur}
      onChange={(event) => {
        const nextValue = column.type === 'number' ? Number(event.target.value || 0) : event.target.value
        onChange(rowId, column.key, nextValue)
      }}
    />
  )
}

function ReadOnlyCell({ column, value }) {
  if (column.type === 'status') {
    return (
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
          statusColors[value] || 'bg-slate-100 text-slate-700'
        }`}
      >
        {value}
      </span>
    )
  }

  if (column.type === 'owner') {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-[11px] font-semibold text-slate-700">
          {getInitials(value || 'NA')}
        </span>
        <span className="text-slate-700">{value || 'Unassigned'}</span>
      </div>
    )
  }

  if (column.type === 'boolean') {
    return (
      <span
        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
          value ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
        }`}
      >
        {value ? 'Yes' : 'No'}
      </span>
    )
  }

  return <span className="text-slate-700">{formatColumnValue(value, column.type)}</span>
}

export default BoardTable
