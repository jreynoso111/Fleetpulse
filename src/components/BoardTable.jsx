import { AlertTriangle, CheckCheck, ChevronDown, ChevronUp, FilterX, Pencil, Plus, Trash2 } from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { statusColors, statusOptions } from '../data/boardMock'

const columnTypeOptions = ['text', 'number', 'currency', 'date', 'status', 'boolean', 'location', 'address', 'phone']
const textSizeOptions = ['small', 'medium', 'large']
const COLUMN_MIN_WIDTH = 72
const COLUMN_MENU_WIDTH = 272
const VIEWPORT_MENU_PADDING = 12
const COLUMN_MENU_MAX_HEIGHT = 420
const statusToneClasses = [
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-emerald-100 text-emerald-700',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
  'bg-slate-200 text-slate-700',
]

function getTextSizeClasses(textSize) {
  if (textSize === 'small') {
    return {
      table: 'text-xs',
      header: 'px-3 py-2.5 text-[11px]',
      cell: 'h-11 px-3 py-1.5',
      input: 'px-2 py-1 text-xs',
      groupHeaderTitle: 'text-xs',
      groupHeaderMeta: 'text-[11px]',
      groupHeaderAction: 'px-2.5 py-1 text-[11px]',
    }
  }

  if (textSize === 'large') {
    return {
      table: 'text-base',
      header: 'px-4 py-3.5 text-sm',
      cell: 'h-16 px-4 py-3',
      input: 'px-3 py-2 text-base',
      groupHeaderTitle: 'text-base',
      groupHeaderMeta: 'text-sm',
      groupHeaderAction: 'px-3 py-2 text-sm',
    }
  }

  return {
    table: 'text-sm',
    header: 'px-4 py-3 text-xs',
    cell: 'h-14 px-4 py-2',
    input: 'px-2 py-1.5 text-sm',
    groupHeaderTitle: 'text-sm',
    groupHeaderMeta: 'text-xs',
    groupHeaderAction: 'px-3 py-1.5 text-xs',
  }
}

function getKanbanTextSizeClasses(textSize) {
  if (textSize === 'small') {
    return {
      laneBadge: 'px-2 py-0.5 text-[11px]',
      laneCount: 'text-[11px]',
      laneSummary: 'px-3 py-2 text-xs',
      cardHeaderEyebrow: 'text-[9px]',
      cardHeaderValue: 'text-xs',
      cardFieldRow: 'px-2.5 py-2',
      cardFieldLabel: 'text-[10px]',
      cardFieldValue: 'text-xs',
    }
  }

  if (textSize === 'large') {
    return {
      laneBadge: 'px-3 py-1.5 text-sm',
      laneCount: 'text-sm',
      laneSummary: 'px-4 py-3 text-base',
      cardHeaderEyebrow: 'text-[11px]',
      cardHeaderValue: 'text-base',
      cardFieldRow: 'px-4 py-3',
      cardFieldLabel: 'text-xs',
      cardFieldValue: 'text-base',
    }
  }

  return {
    laneBadge: 'px-2.5 py-1 text-xs',
    laneCount: 'text-xs',
    laneSummary: 'px-3 py-3 text-sm',
    cardHeaderEyebrow: 'text-[10px]',
    cardHeaderValue: 'text-sm',
    cardFieldRow: 'px-3 py-2',
    cardFieldLabel: 'text-[11px]',
    cardFieldValue: 'text-sm',
  }
}

function getInitials(name) {
  return String(name)
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function createRowId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `item-${crypto.randomUUID()}`
  }

  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function getDefaultValue(type, column = null) {
  if (type === 'number') return 0
  if (type === 'currency') return 0
  if (type === 'boolean') return false
  if (type === 'status') return getStatusOptionsForColumn(column)[0] || ''
  return ''
}

function normalizeInputValue(type, value) {
  if (type === 'number') return Number(value || 0)
  if (type === 'currency') return Number(value || 0)
  if (type === 'boolean') return value === true || value === 'true'
  if (type === 'phone') return formatPhoneNumber(value)
  return value
}

function formatCurrencyValue(value) {
  const amount = Number(value || 0)
  if (Number.isNaN(amount)) return '$0.00'

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function formatPhoneNumber(value) {
  const digits = String(value ?? '')
    .replace(/\D/g, '')
    .slice(0, 10)

  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
}

function formatShortDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit',
  }).format(date)
}

function getStatusOptionsForColumn(column) {
  return column?.statusOptions?.length ? column.statusOptions : statusOptions
}

function getStatusTone(value) {
  if (statusColors[value]) return statusColors[value]
  const hash = String(value || '')
    .split('')
    .reduce((total, character) => total + character.charCodeAt(0), 0)
  return statusToneClasses[hash % statusToneClasses.length]
}

function getMapsUrl(value) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(String(value || ''))}`
}

function isMapsColumn(column) {
  const normalizedKey = String(column?.key || '').toLowerCase()
  const normalizedLabel = String(column?.label || '').toLowerCase()
  return (
    column?.type === 'location' ||
    column?.type === 'address' ||
    normalizedKey.includes('location') ||
    normalizedKey.includes('address') ||
    normalizedLabel.includes('location') ||
    normalizedLabel.includes('address')
  )
}

function formatColumnValue(value, type) {
  if (type === 'boolean') return value ? 'Yes' : 'No'
  if (type === 'date') return formatShortDate(value)
  if (type === 'number') return value === '' ? '0' : value
  if (type === 'currency') return formatCurrencyValue(value)
  if (type === 'phone') return formatPhoneNumber(value) || '—'
  return value || '—'
}

function getFilterOption(value, type) {
  if (type === 'boolean') {
    return {
      token: value ? 'true' : 'false',
      label: value ? 'Yes' : 'No',
    }
  }

  if (value == null || value === '') {
    return {
      token: '__empty__',
      label: 'Empty',
    }
  }

  const label = String(formatColumnValue(value, type))
  return {
    token: label,
    label,
  }
}

function formatDateInputValue(value) {
  return new Date(value).toISOString().slice(0, 10)
}

function createUtcDate(value) {
  const date = new Date(value)
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
}

function addUtcDays(value, amount) {
  const date = new Date(value)
  date.setUTCDate(date.getUTCDate() + amount)
  return date
}

function addUtcMonths(value, amount) {
  const date = new Date(value)
  date.setUTCMonth(date.getUTCMonth() + amount)
  return date
}

function startOfUtcWeek(value) {
  const date = new Date(value)
  const day = date.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setUTCDate(date.getUTCDate() + diff)
  return date
}

function startOfUtcYear(value) {
  return new Date(Date.UTC(value.getUTCFullYear(), 0, 1))
}

function getGanttScaleSegments(startTimestamp, endTimestamp, scale) {
  const rangeStart = createUtcDate(startTimestamp)
  const rangeEnd = createUtcDate(endTimestamp)
  const segments = []

  if (scale === 'week') {
    let cursor = startOfUtcWeek(rangeStart)
    while (cursor <= rangeEnd) {
      const next = addUtcDays(cursor, 7)
      segments.push({
        key: `${formatDateInputValue(cursor)}-week`,
        label: new Intl.DateTimeFormat('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: '2-digit',
          timeZone: 'UTC',
        }).format(cursor),
        start: new Date(cursor),
        end: next,
      })
      cursor = next
    }
    return segments
  }

  if (scale === 'month') {
    let cursor = new Date(Date.UTC(rangeStart.getUTCFullYear(), rangeStart.getUTCMonth(), 1))
    while (cursor <= rangeEnd) {
      const next = addUtcMonths(cursor, 1)
      segments.push({
        key: `${cursor.getUTCFullYear()}-${cursor.getUTCMonth() + 1}`,
        label: new Intl.DateTimeFormat('en-US', {
          month: '2-digit',
          year: '2-digit',
          timeZone: 'UTC',
        }).format(cursor),
        start: new Date(cursor),
        end: next,
      })
      cursor = next
    }
    return segments
  }

  if (scale === 'year') {
    let cursor = startOfUtcYear(rangeStart)
    while (cursor <= rangeEnd) {
      const next = addUtcMonths(cursor, 12)
      segments.push({
        key: `${cursor.getUTCFullYear()}`,
        label: String(cursor.getUTCFullYear()),
        start: new Date(cursor),
        end: next,
      })
      cursor = next
    }
    return segments
  }

  let cursor = new Date(rangeStart)
  while (cursor <= rangeEnd) {
    const next = addUtcDays(cursor, 1)
    segments.push({
      key: formatDateInputValue(cursor),
      label: new Intl.DateTimeFormat('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit',
        timeZone: 'UTC',
      }).format(cursor),
      start: new Date(cursor),
      end: next,
    })
    cursor = next
  }

  return segments
}

function extractColumnPreferences(columns) {
  return columns.reduce((accumulator, column, index) => {
    accumulator[column.key] = {
      hidden: column.hidden === true,
      minWidth: column.minWidth,
      position: index + 1,
    }
    return accumulator
  }, {})
}

function BoardTable({
  columns = [],
  rows = [],
  loading = false,
  error = null,
  onRetry,
  readOnly = false,
  initialViewMode = 'table',
  initialGroupByKey = '',
  initialGroupedSectionCollapsedByField = {},
  initialGanttGroupByKey = '',
  initialGanttStartKey = '',
  initialGanttEndKey = '',
  initialKanbanGroupKey = '',
  initialKanbanPrimaryField = 'name',
  initialKanbanCardFields = [],
  initialKanbanCollapsedLaneIdsByField = {},
  initialTextSize = 'medium',
  onDataChange,
  onViewConfigChange,
}) {
  const boardContainerRef = useRef(null)
  const [boardColumns, setBoardColumns] = useState(columns)
  const [boardRows, setBoardRows] = useState(rows)
  const [activeCell, setActiveCell] = useState(null)
  const [openColumnMenu, setOpenColumnMenu] = useState(null)
  const [columnMenuStyle, setColumnMenuStyle] = useState(null)
  const [pendingColumnDelete, setPendingColumnDelete] = useState(null)
  const [showAddColumnForm, setShowAddColumnForm] = useState(false)
  const [newColumn, setNewColumn] = useState({ label: '', type: 'text' })
  const [filters, setFilters] = useState([])
  const [columnFilterSearch, setColumnFilterSearch] = useState({})
  const [statusDraftByColumn, setStatusDraftByColumn] = useState({})
  const [viewMode, setViewMode] = useState(initialViewMode)
  const [kanbanEditorRowId, setKanbanEditorRowId] = useState(null)
  const [draggingId, setDraggingId] = useState(null)
  const [draggingColumnKey, setDraggingColumnKey] = useState(null)
  const [groupByKey, setGroupByKey] = useState(initialGroupByKey || columns.find((column) => column.key === 'category')?.key || '')
  const [groupedSectionCollapsedByField, setGroupedSectionCollapsedByField] = useState(initialGroupedSectionCollapsedByField)
  const [openKanbanConfig, setOpenKanbanConfig] = useState(false)
  const [openGanttConfig, setOpenGanttConfig] = useState(false)
  const [openColumnVisibility, setOpenColumnVisibility] = useState(false)
  const [textSize, setTextSize] = useState(initialTextSize)
  const [ganttGroupByKey, setGanttGroupByKey] = useState(initialGanttGroupByKey)
  const [ganttStartKey, setGanttStartKey] = useState(initialGanttStartKey)
  const [ganttEndKey, setGanttEndKey] = useState(initialGanttEndKey)
  const [kanbanGroupKey, setKanbanGroupKey] = useState(
    initialKanbanGroupKey || columns.find((column) => column.key === 'status')?.key || '',
  )
  const [kanbanPrimaryField, setKanbanPrimaryField] = useState(initialKanbanPrimaryField)
  const [kanbanCardFields, setKanbanCardFields] = useState(initialKanbanCardFields)
  const [kanbanCollapsedLaneIdsByField, setKanbanCollapsedLaneIdsByField] = useState(initialKanbanCollapsedLaneIdsByField)
  const [kanbanCollapsedCardIds, setKanbanCollapsedCardIds] = useState(() => rows.map((row) => row.id))

  useEffect(() => {
    setBoardColumns(columns)
    if (!columns.some((column) => column.key === groupByKey)) {
      setGroupByKey(initialGroupByKey || columns.find((column) => column.key === 'category')?.key || '')
    }
    if (!columns.some((column) => column.key === kanbanGroupKey)) {
      setKanbanGroupKey(initialKanbanGroupKey || columns.find((column) => column.key === 'status')?.key || '')
    }
    setKanbanCardFields((current) => current.filter((fieldKey) => columns.some((column) => column.key === fieldKey)))
  }, [columns, groupByKey, initialGroupByKey, initialKanbanGroupKey, kanbanGroupKey])

  useEffect(() => {
    setBoardRows(rows)
  }, [rows])

  useEffect(() => {
    setViewMode(initialViewMode)
  }, [initialViewMode])

  useEffect(() => {
    setGroupByKey(initialGroupByKey || columns.find((column) => column.key === 'category')?.key || '')
  }, [columns, initialGroupByKey])

  useEffect(() => {
    setGroupedSectionCollapsedByField(initialGroupedSectionCollapsedByField)
  }, [initialGroupedSectionCollapsedByField])

  useEffect(() => {
    setKanbanCollapsedLaneIdsByField(initialKanbanCollapsedLaneIdsByField)
  }, [initialKanbanCollapsedLaneIdsByField])

  useEffect(() => {
    setKanbanGroupKey(initialKanbanGroupKey || columns.find((column) => column.key === 'status')?.key || '')
  }, [columns, initialKanbanGroupKey])

  useEffect(() => {
    const dateColumns = columns.filter((column) => column.type === 'date')
    const fallbackStartKey = columns.find((column) => column.key === 'start_date')?.key || dateColumns[0]?.key || ''
    const fallbackEndKey =
      columns.find((column) => column.key === 'due_date')?.key || dateColumns[1]?.key || fallbackStartKey

    setGanttStartKey((current) =>
      columns.some((column) => column.key === current) ? current : initialGanttStartKey || fallbackStartKey,
    )
    setGanttEndKey((current) =>
      columns.some((column) => column.key === current) ? current : initialGanttEndKey || fallbackEndKey,
    )
    setGanttGroupByKey((current) =>
      columns.some((column) => column.key === current) ? current : initialGanttGroupByKey || '',
    )
  }, [columns, initialGanttEndKey, initialGanttGroupByKey, initialGanttStartKey])

  useEffect(() => {
    const fallbackField = columns.find((column) => column.key === 'name')?.key || columns[0]?.key || ''
    setKanbanPrimaryField(initialKanbanPrimaryField || fallbackField)
  }, [columns, initialKanbanPrimaryField])

  useEffect(() => {
    setKanbanCardFields(initialKanbanCardFields)
  }, [initialKanbanCardFields])

  useEffect(() => {
    setTextSize(initialTextSize)
  }, [initialTextSize])

  useEffect(() => {
    function handlePointerDown(event) {
      const target = event.target
      if (!(target instanceof Element)) return

      if (
        openColumnMenu &&
        !target.closest('[data-column-menu]') &&
        !target.closest('[data-column-menu-trigger]')
      ) {
        setOpenColumnMenu(null)
        setColumnMenuStyle(null)
      }

      if (
        openColumnVisibility &&
        !target.closest('[data-column-visibility-panel]') &&
        !target.closest('[data-column-visibility-trigger]')
      ) {
        setOpenColumnVisibility(false)
      }

      if (
        openKanbanConfig &&
        !target.closest('[data-kanban-config-panel]') &&
        !target.closest('[data-kanban-config-trigger]')
      ) {
        setOpenKanbanConfig(false)
      }

      if (
        openGanttConfig &&
        !target.closest('[data-gantt-config-panel]') &&
        !target.closest('[data-gantt-config-trigger]')
      ) {
        setOpenGanttConfig(false)
      }

      if (
        showAddColumnForm &&
        !target.closest('[data-add-column-panel]') &&
        !target.closest('[data-add-column-trigger]')
      ) {
        setShowAddColumnForm(false)
        setNewColumn({ label: '', type: 'text' })
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [openColumnMenu, openColumnVisibility, openKanbanConfig, openGanttConfig, showAddColumnForm])

  useEffect(() => {
    if (!openColumnMenu) return

    function handleViewportChange() {
      setOpenColumnMenu(null)
      setColumnMenuStyle(null)
    }

    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)
    return () => {
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
    }
  }, [openColumnMenu])

  useEffect(() => {
    if (!pendingColumnDelete) return

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setPendingColumnDelete(null)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [pendingColumnDelete])

  const nextItemNumber = useMemo(() => boardRows.length + 1, [boardRows.length])
  const visibleColumns = useMemo(
    () => boardColumns.filter((column) => column.hidden !== true),
    [boardColumns],
  )
  const kanbanColumn = useMemo(
    () => boardColumns.find((column) => column.key === kanbanGroupKey) || null,
    [boardColumns, kanbanGroupKey],
  )
  const ganttDateColumns = useMemo(
    () => boardColumns.filter((column) => column.type === 'date'),
    [boardColumns],
  )
  const ganttGroupOptions = useMemo(
    () => boardColumns.filter((column) => column.type === 'text' || column.type === 'status' || column.type === 'boolean'),
    [boardColumns],
  )
  const availableViewModes = useMemo(() => ['table', 'kanban', 'gantt'], [])

  const filteredRows = useMemo(() => {
    if (filters.length === 0) return boardRows

    return boardRows.filter((row) =>
      filters.every((filter) => {
        const column = boardColumns.find((item) => item.key === filter.columnKey)
        if (!column) return true

        if (!filter.values?.length) return true

        const { token } = getFilterOption(row[filter.columnKey], column.type)
        return filter.values.includes(token)
      }),
    )
  }, [boardColumns, boardRows, filters])
  const filterOptionsByColumn = useMemo(
    () =>
      boardColumns.reduce((accumulator, column) => {
        const optionMap = new Map()
        boardRows.forEach((row) => {
          const option = getFilterOption(row?.[column.key], column.type)
          if (!optionMap.has(option.token)) {
            optionMap.set(option.token, option)
          }
        })
        accumulator[column.key] = Array.from(optionMap.values()).sort((left, right) =>
          String(left?.label || '').localeCompare(String(right?.label || ''), undefined, {
            numeric: true,
            sensitivity: 'base',
          }),
        )
        return accumulator
      }, {}),
    [boardColumns, boardRows],
  )

  const kanbanOptions = useMemo(
    () => boardColumns.filter((column) => column.type === 'text' || column.type === 'status' || column.type === 'boolean'),
    [boardColumns],
  )
  const kanbanCardFieldOptions = useMemo(
    () => boardColumns.filter((column) => column.key !== kanbanGroupKey),
    [boardColumns, kanbanGroupKey],
  )
  const kanbanPrimaryFieldOptions = useMemo(
    () => boardColumns.filter((column) => column.key !== kanbanGroupKey),
    [boardColumns, kanbanGroupKey],
  )
  const kanbanLaneDefinitions = useMemo(() => {
    if (!kanbanColumn) return []

    if (kanbanColumn.type === 'status') {
      return getStatusOptionsForColumn(kanbanColumn).map((option) => ({
        id: option,
        value: option,
        label: option,
        count: filteredRows.filter((row) => row[kanbanColumn.key] === option).length,
        tone: getStatusTone(option),
      }))
    }

    if (kanbanColumn.type === 'boolean') {
      return ['true', 'false'].map((option) => {
        const parsedValue = option === 'true'
        return {
          id: option,
          value: parsedValue,
          label: parsedValue ? 'True' : 'False',
          count: filteredRows.filter((row) => Boolean(row[kanbanColumn.key]) === parsedValue).length,
          tone: parsedValue ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700',
        }
      })
    }

    const labels = Array.from(
      new Set(filteredRows.map((row) => String(row[kanbanColumn.key] || 'Uncategorized'))),
    )

    return labels.length
      ? labels.map((label) => ({
          id: label,
          value: label,
          label,
          count: filteredRows.filter((row) => String(row[kanbanColumn.key] || 'Uncategorized') === label).length,
          tone: 'bg-sky-100 text-sky-700',
        }))
      : [
          {
            id: 'uncategorized',
            value: 'Uncategorized',
            label: 'Uncategorized',
            count: 0,
            tone: 'bg-sky-100 text-sky-700',
          },
        ]
  }, [filteredRows, kanbanColumn])
  const kanbanGroups = useMemo(() => {
    if (!kanbanColumn) return {}

    return kanbanLaneDefinitions.reduce((accumulator, lane) => {
      accumulator[lane.id] = filteredRows.filter((row) => {
        if (kanbanColumn.type === 'boolean') return Boolean(row[kanbanColumn.key]) === lane.value
        const rowValue = row[kanbanColumn.key]
        const normalizedValue = rowValue || (kanbanColumn.type === 'text' ? 'Uncategorized' : '')
        return normalizedValue === lane.value
      })
      return accumulator
    }, {})
  }, [filteredRows, kanbanColumn, kanbanLaneDefinitions])
  const groupedRows = useMemo(() => {
    if (!groupByKey) return []

    const groups = filteredRows.reduce((accumulator, row) => {
      const label = String(row[groupByKey] || 'Uncategorized')
      if (!accumulator[label]) accumulator[label] = []
      accumulator[label].push(row)
      return accumulator
    }, {})

    return Object.entries(groups).map(([label, items]) => ({ label, items }))
  }, [filteredRows, groupByKey])
  const textSizeClasses = useMemo(() => getTextSizeClasses(textSize), [textSize])
  const kanbanTextSizeClasses = useMemo(() => getKanbanTextSizeClasses(textSize), [textSize])
  const visibleRowIds = useMemo(() => new Set(boardRows.map((row) => row.id)), [boardRows])
  const collapsedGroupLabels = useMemo(
    () => groupedSectionCollapsedByField[groupByKey] || [],
    [groupByKey, groupedSectionCollapsedByField],
  )
  const collapsedKanbanLaneIds = useMemo(
    () => kanbanCollapsedLaneIdsByField[kanbanGroupKey] || [],
    [kanbanCollapsedLaneIdsByField, kanbanGroupKey],
  )
  const kanbanEditorRow = useMemo(
    () => boardRows.find((row) => row.id === kanbanEditorRowId) || null,
    [boardRows, kanbanEditorRowId],
  )
  const persistViewConfig = useCallback(
    (updates) => {
      if (readOnly || !onViewConfigChange) return
      onViewConfigChange(updates)
    },
    [onViewConfigChange, readOnly],
  )

  useEffect(() => {
    setKanbanCollapsedCardIds((current) => {
      const nextCollapsedIds = current.filter((itemId) => visibleRowIds.has(itemId))
      const knownIds = new Set(nextCollapsedIds)
      const newCollapsedIds = boardRows.map((row) => row.id).filter((itemId) => !knownIds.has(itemId))
      return [...nextCollapsedIds, ...newCollapsedIds]
    })
  }, [boardRows, visibleRowIds])

  useEffect(() => {
    if (!groupByKey) return

    const validLabels = new Set(groupedRows.map((group) => group.label))
    const currentCollapsed = groupedSectionCollapsedByField[groupByKey] || []
    const nextCollapsed = currentCollapsed.filter((label) => validLabels.has(label))

    if (nextCollapsed.length === currentCollapsed.length) return

    setGroupedSectionCollapsedByField((current) => {
      const nextValue = {
        ...current,
        [groupByKey]: nextCollapsed,
      }

      persistViewConfig({ groupedSectionCollapsedByField: nextValue })

      return nextValue
    })
  }, [groupByKey, groupedRows, groupedSectionCollapsedByField, persistViewConfig])

  useEffect(() => {
    if (!kanbanGroupKey) return

    const validLaneIds = new Set(kanbanLaneDefinitions.map((lane) => lane.id))
    const currentCollapsed = kanbanCollapsedLaneIdsByField[kanbanGroupKey] || []
    const nextCollapsed = currentCollapsed.filter((laneId) => validLaneIds.has(laneId))

    if (nextCollapsed.length === currentCollapsed.length) return

    setKanbanCollapsedLaneIdsByField((current) => {
      const nextValue = {
        ...current,
        [kanbanGroupKey]: nextCollapsed,
      }

      persistViewConfig({ kanbanCollapsedLaneIdsByField: nextValue })

      return nextValue
    })
  }, [kanbanCollapsedLaneIdsByField, kanbanGroupKey, kanbanLaneDefinitions, persistViewConfig])

  const pushBoardChange = useCallback(
    (nextColumns, nextRows) => {
      if (!onDataChange) return
      onDataChange({ columns: nextColumns, items: nextRows })
    },
    [onDataChange],
  )

  const updateCell = useCallback((rowId, columnKey, value) => {
    setBoardRows((currentRows) => {
      const nextRows = currentRows.map((row) => (row.id === rowId ? { ...row, [columnKey]: value } : row))
      pushBoardChange(boardColumns, nextRows)
      return nextRows
    })
  }, [boardColumns, pushBoardChange])

  const updateRowValues = useCallback(
    (rowId, updates) => {
      setBoardRows((currentRows) => {
        const nextRows = currentRows.map((row) => (row.id === rowId ? { ...row, ...updates } : row))
        pushBoardChange(boardColumns, nextRows)
        return nextRows
      })
    },
    [boardColumns, pushBoardChange],
  )

  const addRow = useCallback(() => {
    const today = new Date()
    const defaultStartDate = formatDateInputValue(today)
    const defaultDueDate = formatDateInputValue(new Date(today.getTime() + 1000 * 60 * 60 * 24 * 3))

    const rowValues = boardColumns.reduce((accumulator, column) => {
      if (column.key === 'name') {
        accumulator[column.key] = `New task ${nextItemNumber}`
        return accumulator
      }

      if (column.key === 'owner') {
        accumulator[column.key] = 'Unassigned'
        return accumulator
      }

      if (column.key === 'category') {
        accumulator[column.key] = 'General'
        return accumulator
      }

      if (column.key === 'start_date') {
        accumulator[column.key] = defaultStartDate
        return accumulator
      }

      if (column.key === 'due_date') {
        accumulator[column.key] = defaultDueDate
        return accumulator
      }

      accumulator[column.key] = getDefaultValue(column.type, column)
      return accumulator
    }, {})

    setBoardRows((currentRows) => {
      const nextRows = [...currentRows, { id: createRowId(), ...rowValues }]
      pushBoardChange(boardColumns, nextRows)
      return nextRows
    })
  }, [boardColumns, nextItemNumber, pushBoardChange])

  const addGroupedRow = useCallback(
    (groupValue) => {
      const today = new Date()
      const defaultStartDate = formatDateInputValue(today)
      const defaultDueDate = formatDateInputValue(new Date(today.getTime() + 1000 * 60 * 60 * 24 * 3))

      const rowValues = boardColumns.reduce((accumulator, column) => {
        if (column.key === 'name') {
          accumulator[column.key] = `New task ${nextItemNumber}`
          return accumulator
        }

        if (column.key === 'owner') {
          accumulator[column.key] = 'Unassigned'
          return accumulator
        }

        if (column.key === groupByKey) {
          accumulator[column.key] = groupValue
          return accumulator
        }

        if (column.key === 'category') {
          accumulator[column.key] = 'General'
          return accumulator
        }

        if (column.key === 'start_date') {
          accumulator[column.key] = defaultStartDate
          return accumulator
        }

        if (column.key === 'due_date') {
          accumulator[column.key] = defaultDueDate
          return accumulator
        }

        accumulator[column.key] = getDefaultValue(column.type, column)
        return accumulator
      }, {})

      setBoardRows((currentRows) => {
        const nextRows = [...currentRows, { id: createRowId(), ...rowValues }]
        pushBoardChange(boardColumns, nextRows)
        return nextRows
      })
    },
    [boardColumns, groupByKey, nextItemNumber, pushBoardChange],
  )

  const addColumn = useCallback(() => {
    const cleanLabel = newColumn.label.trim()
    if (!cleanLabel) return

    const uniqueKey = `${cleanLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`
    const createdColumn = {
      key: uniqueKey,
      label: cleanLabel,
      type: newColumn.type,
      ...(newColumn.type === 'status' ? { statusOptions: [...statusOptions] } : {}),
      minWidth: 140,
      position: boardColumns.length + 1,
      hidden: false,
    }

    const nextColumns = [...boardColumns, createdColumn]
    setBoardColumns(nextColumns)
    setBoardRows((currentRows) => {
      const nextRows = currentRows.map((row) => ({ ...row, [uniqueKey]: getDefaultValue(newColumn.type, createdColumn) }))
      pushBoardChange(nextColumns, nextRows)
      return nextRows
    })
    setNewColumn({ label: '', type: 'text' })
    setShowAddColumnForm(false)
  }, [boardColumns, newColumn, pushBoardChange])

  const toggleFilterValue = useCallback((columnKey, valueToken) => {
    setFilters((currentFilters) => {
      const existingFilter = currentFilters.find((filter) => filter.columnKey === columnKey)

      if (!existingFilter) {
        return [...currentFilters, { columnKey, values: [valueToken] }]
      }

      const nextValues = existingFilter.values.includes(valueToken)
        ? existingFilter.values.filter((entry) => entry !== valueToken)
        : [...existingFilter.values, valueToken]

      if (nextValues.length === 0) {
        return currentFilters.filter((filter) => filter.columnKey !== columnKey)
      }

      return currentFilters.map((filter) =>
        filter.columnKey === columnKey
          ? {
              ...filter,
              values: nextValues,
            }
          : filter,
      )
    })
  }, [])

  const setFilterValues = useCallback((columnKey, values) => {
    setFilters((currentFilters) => {
      const nextValues = Array.from(new Set(values.filter(Boolean)))
      if (nextValues.length === 0) {
        return currentFilters.filter((filter) => filter.columnKey !== columnKey)
      }

      const existingFilter = currentFilters.find((filter) => filter.columnKey === columnKey)
      if (!existingFilter) {
        return [...currentFilters, { columnKey, values: nextValues }]
      }

      return currentFilters.map((filter) =>
        filter.columnKey === columnKey
          ? {
              ...filter,
              values: nextValues,
            }
          : filter,
      )
    })
  }, [])

  const clearFiltersForColumn = useCallback((columnKey) => {
    setFilters((currentFilters) => currentFilters.filter((filter) => filter.columnKey !== columnKey))
  }, [])

  const changeColumnType = useCallback(
    (columnKey, nextType) => {
      if (!columnTypeOptions.includes(nextType)) return

      const nextColumns = boardColumns.map((column) =>
        column.key === columnKey
          ? {
              ...column,
              type: nextType,
              ...(nextType === 'status' ? { statusOptions: getStatusOptionsForColumn(column) } : { statusOptions: undefined }),
            }
          : column,
      )

      setBoardColumns(nextColumns)
      setBoardRows((currentRows) => {
        const nextRows = currentRows.map((row) => ({
          ...row,
          [columnKey]: normalizeInputValue(nextType, row[columnKey]),
        }))
        pushBoardChange(nextColumns, nextRows)
        return nextRows
      })
      setOpenColumnMenu(null)
    },
    [boardColumns, pushBoardChange],
  )

  const renameColumn = useCallback(
    (columnKey) => {
      const targetColumn = boardColumns.find((column) => column.key === columnKey)
      const nextLabel = window.prompt('Rename column', targetColumn?.label ?? '')
      if (!nextLabel || !nextLabel.trim()) return

      const nextColumns = boardColumns.map((column) =>
        column.key === columnKey ? { ...column, label: nextLabel.trim() } : column,
      )
      setBoardColumns(nextColumns)
      pushBoardChange(nextColumns, boardRows)
      setOpenColumnMenu(null)
    },
    [boardColumns, boardRows, pushBoardChange],
  )

  const deleteColumn = useCallback((columnKey) => {
    const nextColumns = boardColumns.filter((column) => column.key !== columnKey)
    if (columnKey === groupByKey) {
      setGroupByKey('')
    }
    if (columnKey === kanbanGroupKey) {
      setKanbanGroupKey('')
      setOpenKanbanConfig(true)
      persistViewConfig({ kanbanGroupBy: '' })
    }
    setBoardColumns(nextColumns)
    setBoardRows((currentRows) => {
      const nextRows = currentRows.map((row) => {
        const updatedRow = { ...row }
        delete updatedRow[columnKey]
        return updatedRow
      })
      pushBoardChange(nextColumns, nextRows)
      return nextRows
    })
    setFilters((currentFilters) => currentFilters.filter((filter) => filter.columnKey !== columnKey))
    setOpenColumnMenu(null)
  }, [boardColumns, groupByKey, kanbanGroupKey, persistViewConfig, pushBoardChange])

  const requestColumnDelete = useCallback(
    (columnKey) => {
      const targetColumn = boardColumns.find((column) => column.key === columnKey)
      setPendingColumnDelete({
        key: columnKey,
        label: targetColumn?.label || columnKey,
      })
      setOpenColumnMenu(null)
      setColumnMenuStyle(null)
    },
    [boardColumns],
  )

  const addStatusOption = useCallback(
    (columnKey) => {
      const nextLabel = String(statusDraftByColumn[columnKey] || '').trim()
      if (!nextLabel) return

      const targetColumn = boardColumns.find((column) => column.key === columnKey)
      if (!targetColumn || targetColumn.type !== 'status') return

      const nextOptions = Array.from(new Set([...getStatusOptionsForColumn(targetColumn), nextLabel]))
      const nextColumns = boardColumns.map((column) =>
        column.key === columnKey ? { ...column, statusOptions: nextOptions } : column,
      )
      setBoardColumns(nextColumns)
      pushBoardChange(nextColumns, boardRows)
      setStatusDraftByColumn((current) => ({ ...current, [columnKey]: '' }))
    },
    [boardColumns, boardRows, pushBoardChange, statusDraftByColumn],
  )

  const renameStatusOption = useCallback(
    (columnKey, currentLabel) => {
      const nextLabel = window.prompt('Rename status', currentLabel)?.trim()
      if (!nextLabel || nextLabel === currentLabel) return

      const targetColumn = boardColumns.find((column) => column.key === columnKey)
      if (!targetColumn || targetColumn.type !== 'status') return

      const nextOptions = getStatusOptionsForColumn(targetColumn).map((option) =>
        option === currentLabel ? nextLabel : option,
      )
      const nextColumns = boardColumns.map((column) =>
        column.key === columnKey ? { ...column, statusOptions: Array.from(new Set(nextOptions)) } : column,
      )
      const nextRows = boardRows.map((row) =>
        row[columnKey] === currentLabel ? { ...row, [columnKey]: nextLabel } : row,
      )
      setBoardColumns(nextColumns)
      setBoardRows(nextRows)
      pushBoardChange(nextColumns, nextRows)
    },
    [boardColumns, boardRows, pushBoardChange],
  )

  const deleteStatusOption = useCallback(
    (columnKey, optionLabel) => {
      const targetColumn = boardColumns.find((column) => column.key === columnKey)
      if (!targetColumn || targetColumn.type !== 'status') return

      const currentOptions = getStatusOptionsForColumn(targetColumn)
      if (currentOptions.length <= 1) return

      const shouldDelete = window.confirm(`Delete status "${optionLabel}"?`)
      if (!shouldDelete) return

      const nextOptions = currentOptions.filter((option) => option !== optionLabel)
      const fallbackValue = nextOptions[0] || ''
      const nextColumns = boardColumns.map((column) =>
        column.key === columnKey ? { ...column, statusOptions: nextOptions } : column,
      )
      const nextRows = boardRows.map((row) =>
        row[columnKey] === optionLabel ? { ...row, [columnKey]: fallbackValue } : row,
      )
      setBoardColumns(nextColumns)
      setBoardRows(nextRows)
      pushBoardChange(nextColumns, nextRows)
    },
    [boardColumns, boardRows, pushBoardChange],
  )

  const toggleColumnVisibility = useCallback(
    (columnKey) => {
      const nextColumns = boardColumns.map((column) =>
        column.key === columnKey ? { ...column, hidden: column.hidden !== true ? true : false } : column,
      )

      setBoardColumns(nextColumns)
      persistViewConfig({ columnPreferences: extractColumnPreferences(nextColumns) })
    },
    [boardColumns, persistViewConfig],
  )

  const reorderColumns = useCallback(
    (fromKey, toKey) => {
      if (!fromKey || !toKey || fromKey === toKey) return

      const nextColumns = [...boardColumns]
      const fromIndex = nextColumns.findIndex((column) => column.key === fromKey)
      const toIndex = nextColumns.findIndex((column) => column.key === toKey)
      if (fromIndex === -1 || toIndex === -1) return

      const [movedColumn] = nextColumns.splice(fromIndex, 1)
      nextColumns.splice(toIndex, 0, movedColumn)

      const normalizedColumns = nextColumns.map((column, index) => ({
        ...column,
        position: index + 1,
      }))

      setBoardColumns(normalizedColumns)
      persistViewConfig({ columnPreferences: extractColumnPreferences(normalizedColumns) })
    },
    [boardColumns, persistViewConfig],
  )

  const resizeColumn = useCallback(
    (columnKey, nextWidth) => {
      const normalizedWidth = Math.max(COLUMN_MIN_WIDTH, nextWidth)
      const nextColumns = boardColumns.map((column) =>
        column.key === columnKey ? { ...column, minWidth: normalizedWidth } : column,
      )

      setBoardColumns(nextColumns)
      persistViewConfig({ columnPreferences: extractColumnPreferences(nextColumns) })
    },
    [boardColumns, persistViewConfig],
  )

  const handleDropToStatus = useCallback(
    (laneValue) => {
      if (!kanbanColumn || !draggingId || readOnly) return

      setBoardRows((currentRows) => {
        const nextRows = currentRows.map((row) =>
          row.id === draggingId
            ? {
                ...row,
                [kanbanColumn.key]: kanbanColumn.type === 'boolean' ? laneValue === true : laneValue,
              }
            : row,
        )
        pushBoardChange(boardColumns, nextRows)
        return nextRows
      })
      setDraggingId(null)
    },
    [boardColumns, draggingId, kanbanColumn, pushBoardChange, readOnly],
  )

  const handleKanbanGroupChange = useCallback(
    (nextKey) => {
      setKanbanGroupKey(nextKey)
      setOpenKanbanConfig(false)
      persistViewConfig({ kanbanGroupBy: nextKey })
    },
    [persistViewConfig],
  )

  const handleKanbanPrimaryFieldChange = useCallback(
    (nextKey) => {
      setKanbanPrimaryField(nextKey)
      persistViewConfig({ kanbanPrimaryField: nextKey })
    },
    [persistViewConfig],
  )

  const handleKanbanCardFieldToggle = useCallback(
    (fieldKey) => {
      setKanbanCardFields((current) => {
        const nextFields = current.includes(fieldKey)
          ? current.filter((entry) => entry !== fieldKey)
          : [...current, fieldKey]

        persistViewConfig({ kanbanCardFields: nextFields })

        return nextFields
      })
    },
    [persistViewConfig],
  )

  const toggleKanbanLaneCollapse = useCallback(
    (laneId) => {
      if (!kanbanGroupKey) return

      setKanbanCollapsedLaneIdsByField((current) => {
        const currentLaneIds = current[kanbanGroupKey] || []
        const nextLaneIds = currentLaneIds.includes(laneId)
          ? currentLaneIds.filter((entry) => entry !== laneId)
          : [...currentLaneIds, laneId]
        const nextValue = {
          ...current,
          [kanbanGroupKey]: nextLaneIds,
        }

        persistViewConfig({ kanbanCollapsedLaneIdsByField: nextValue })

        return nextValue
      })
    },
    [kanbanGroupKey, persistViewConfig],
  )

  const toggleKanbanCardCollapse = useCallback(
    (itemId) => {
      setKanbanCollapsedCardIds((current) => {
        return current.includes(itemId)
          ? current.filter((entry) => entry !== itemId)
          : [...current, itemId]
      })
    },
    [],
  )

  const handleViewModeChange = useCallback(
    (nextMode) => {
      setViewMode(nextMode)
      persistViewConfig({ preferredView: nextMode })
    },
    [persistViewConfig],
  )

  const handleGroupByChange = useCallback(
    (nextKey) => {
      setGroupByKey(nextKey)
      persistViewConfig({ groupByKey: nextKey })
    },
    [persistViewConfig],
  )

  const toggleGroupedSection = useCallback(
    (groupLabel) => {
      if (!groupByKey) return

      setGroupedSectionCollapsedByField((current) => {
        const currentLabels = current[groupByKey] || []
        const nextLabels = currentLabels.includes(groupLabel)
          ? currentLabels.filter((label) => label !== groupLabel)
          : [...currentLabels, groupLabel]
        const nextValue = {
          ...current,
          [groupByKey]: nextLabels,
        }

        persistViewConfig({ groupedSectionCollapsedByField: nextValue })

        return nextValue
      })
    },
    [groupByKey, persistViewConfig],
  )

  const deleteRow = useCallback(
    (rowId) => {
      const targetRow = boardRows.find((row) => row.id === rowId)
      const rowLabel = targetRow?.name || 'this row'
      const shouldDelete = window.confirm(`Delete ${rowLabel}?`)
      if (!shouldDelete) return

      const nextRows = boardRows.filter((row) => row.id !== rowId)
      setBoardRows(nextRows)
      if (activeCell?.rowId === rowId) {
        setActiveCell(null)
      }
      if (kanbanEditorRowId === rowId) {
        setKanbanEditorRowId(null)
      }
      pushBoardChange(boardColumns, nextRows)
    },
    [activeCell?.rowId, boardColumns, boardRows, kanbanEditorRowId, pushBoardChange],
  )

  const handleTextSizeChange = useCallback(
    (nextSize) => {
      setTextSize(nextSize)
      persistViewConfig({ textSize: nextSize })
    },
    [persistViewConfig],
  )

  const isEditing = useCallback(
    (rowId, columnKey) => activeCell?.rowId === rowId && activeCell?.columnKey === columnKey,
    [activeCell],
  )

  const toggleColumnMenu = useCallback((event, menuKey) => {
    const trigger = event.currentTarget
    const rect = trigger instanceof Element ? trigger.getBoundingClientRect() : null

    setOpenColumnMenu((currentValue) => {
      if (currentValue === menuKey) {
        setColumnMenuStyle(null)
        return null
      }

      if (!rect) {
        setColumnMenuStyle(null)
        return menuKey
      }

      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const maxLeft = Math.max(VIEWPORT_MENU_PADDING, viewportWidth - COLUMN_MENU_WIDTH - VIEWPORT_MENU_PADDING)
      const fitsOnRight = rect.left + COLUMN_MENU_WIDTH <= viewportWidth - VIEWPORT_MENU_PADDING
      const preferredLeft = fitsOnRight ? rect.left : rect.right - COLUMN_MENU_WIDTH
      const left = Math.min(Math.max(VIEWPORT_MENU_PADDING, preferredLeft), maxLeft)
      const availableBelow = viewportHeight - rect.bottom - VIEWPORT_MENU_PADDING
      const availableAbove = rect.top - VIEWPORT_MENU_PADDING
      const shouldOpenAbove = availableBelow < 220 && availableAbove > availableBelow
      const maxHeight = Math.max(180, viewportHeight - VIEWPORT_MENU_PADDING * 2)
      const top = shouldOpenAbove
        ? Math.max(VIEWPORT_MENU_PADDING, rect.top - Math.min(COLUMN_MENU_MAX_HEIGHT, availableAbove))
        : Math.min(rect.bottom + 8, viewportHeight - Math.min(COLUMN_MENU_MAX_HEIGHT, maxHeight) - VIEWPORT_MENU_PADDING)

      setColumnMenuStyle({
        position: 'fixed',
        top,
        left,
        width: COLUMN_MENU_WIDTH,
        maxHeight: Math.min(COLUMN_MENU_MAX_HEIGHT, maxHeight),
      })
      return menuKey
    })
  }, [])

  if (loading) return <BoardLoadingState />

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-soft">
        <p className="font-medium">Could not load board data.</p>
        <p className="mt-1">{error.message}</p>
        {onRetry && (
          <button
            type="button"
            className="mt-3 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition hover:bg-rose-100"
            onClick={onRetry}
          >
            Retry
          </button>
        )}
      </div>
    )
  }

  return (
    <div ref={boardContainerRef} className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-soft lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap items-end gap-2">
          {!readOnly &&
            (showAddColumnForm ? (
              <div data-add-column-panel className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
                <div className="flex min-w-0 flex-col gap-1">
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Column name</label>
                  <input
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none ring-sky-200 transition focus:ring sm:min-w-[220px]"
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
                  Save column
                </button>
                <button
                  type="button"
                  className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                  onClick={() => {
                    setShowAddColumnForm(false)
                    setNewColumn({ label: '', type: 'text' })
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  data-add-column-trigger
                  className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 shadow-soft transition hover:-translate-y-0.5 hover:bg-slate-50 active:translate-y-0"
                  onClick={() => setShowAddColumnForm(true)}
                >
                  + Add column
                </button>
                <button
                  type="button"
                  className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 shadow-soft transition hover:-translate-y-0.5 hover:bg-slate-50 active:translate-y-0"
                  onClick={addRow}
                >
                  + Add new row
                </button>
              </>
            ))}

          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <label htmlFor="table-text-size" className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Text size
            </label>
            <select
              id="table-text-size"
              value={textSize}
              onChange={(event) => handleTextSizeChange(event.target.value)}
              className="bg-transparent text-sm font-medium text-slate-700 outline-none"
            >
              {textSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size.charAt(0).toUpperCase() + size.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {viewMode === 'table' && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Group by</span>
                <select
                  className="bg-transparent text-sm text-slate-700 outline-none"
                  value={groupByKey}
                  onChange={(event) => handleGroupByChange(event.target.value)}
                >
                  <option value="">None</option>
                  {boardColumns
                  .filter((column) => column.type === 'text' || column.type === 'status' || column.type === 'boolean')
                  .map((column) => (
                    <option key={column.key} value={column.key}>
                      {column.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <button
                  type="button"
                  data-column-visibility-trigger
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:bg-slate-50"
                  onClick={() => setOpenColumnVisibility((current) => !current)}
                >
                  Columns
                </button>

                {openColumnVisibility && (
                  <div data-column-visibility-panel className="absolute right-0 top-12 z-20 w-[min(16rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-3 shadow-soft sm:w-64">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Visible columns</p>
                    <div className="mt-3 space-y-2">
                      {boardColumns.map((column) => (
                        <label key={column.key} className="flex items-center justify-between gap-3 text-sm text-slate-700">
                          <span>{column.label}</span>
                          <input
                            type="checkbox"
                            checked={column.hidden !== true}
                            onChange={() => toggleColumnVisibility(column.key)}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {viewMode === 'kanban' && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
              <button
                type="button"
                data-kanban-config-trigger
                className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:bg-slate-50"
                onClick={() => setOpenKanbanConfig((current) => !current)}
              >
                Kanban config
              </button>
              <span className="text-xs text-slate-500">
                Grouping by <span className="font-semibold text-slate-700">{kanbanColumn?.label || 'Not configured'}</span>
              </span>
            </div>
          )}
          {viewMode === 'gantt' && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
              <button
                type="button"
                data-gantt-config-trigger
                className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:bg-slate-50"
                onClick={() => setOpenGanttConfig((current) => !current)}
              >
                Gantt config
              </button>
              <span className="text-xs text-slate-500">
                Sectioning by <span className="font-semibold text-slate-700">{boardColumns.find((column) => column.key === ganttGroupByKey)?.label || 'None'}</span>
              </span>
            </div>
          )}
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
            {availableViewModes.map((mode) => (
              <button
                key={mode}
                type="button"
                className={`rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                  viewMode === mode
                    ? 'bg-white text-slate-900 shadow-soft'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                onClick={() => handleViewModeChange(mode)}
              >
                {mode} view
              </button>
            ))}
          </div>
        </div>
      </div>

      {viewMode === 'kanban' && openKanbanConfig && (
        <div data-kanban-config-panel className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kanban grouping</p>
                <p className="text-sm text-slate-600">
                  Choose the column that defines the Kanban lanes for this board.
                </p>
              </div>
              <select
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-sky-200 transition focus:ring"
                value={kanbanGroupKey}
                onChange={(event) => handleKanbanGroupChange(event.target.value)}
              >
                <option value="">Select a column</option>
                {kanbanOptions.map((column) => (
                  <option key={column.key} value={column.key}>
                    {column.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Primary field</p>
                <p className="text-sm text-slate-600">
                  Choose the main column shown when a Kanban card is collapsed.
                </p>
              </div>
              <select
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-sky-200 transition focus:ring"
                value={kanbanPrimaryField}
                onChange={(event) => handleKanbanPrimaryFieldChange(event.target.value)}
              >
                <option value="">Select a column</option>
                {kanbanPrimaryFieldOptions.map((column) => (
                  <option key={column.key} value={column.key}>
                    {column.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Card fields</p>
              <p className="text-sm text-slate-600">Choose which fields appear inside each Kanban card.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {kanbanCardFieldOptions.map((column) => {
                const isSelected = kanbanCardFields.includes(column.key)

                return (
                  <button
                    key={column.key}
                    type="button"
                    onClick={() => handleKanbanCardFieldToggle(column.key)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      isSelected
                        ? 'border-transparent text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'
                    }`}
                    style={isSelected ? { backgroundColor: 'var(--pulse-accent)' } : undefined}
                  >
                    {column.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'gantt' && openGanttConfig && (
        <div data-gantt-config-panel className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start date column</span>
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-sky-200 transition focus:ring"
                value={ganttStartKey}
                onChange={(event) => {
                  const nextKey = event.target.value
                  setGanttStartKey(nextKey)
                  persistViewConfig({ ganttStartKey: nextKey })
                }}
              >
                <option value="">Select a date column</option>
                {ganttDateColumns.map((column) => (
                  <option key={column.key} value={column.key}>
                    {column.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">End date column</span>
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-sky-200 transition focus:ring"
                value={ganttEndKey}
                onChange={(event) => {
                  const nextKey = event.target.value
                  setGanttEndKey(nextKey)
                  persistViewConfig({ ganttEndKey: nextKey })
                }}
              >
                <option value="">Same as start date</option>
                {ganttDateColumns.map((column) => (
                  <option key={column.key} value={column.key}>
                    {column.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Section by</span>
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-sky-200 transition focus:ring"
                value={ganttGroupByKey}
                onChange={(event) => {
                  const nextKey = event.target.value
                  setGanttGroupByKey(nextKey)
                  persistViewConfig({ ganttGroupByKey: nextKey })
                }}
              >
                <option value="">No sections</option>
                {ganttGroupOptions.map((column) => (
                  <option key={column.key} value={column.key}>
                    {column.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}

      <div className="transition-all duration-300">
        {filteredRows.length === 0 ? (
          <EmptyState onClearFilters={() => setFilters([])} />
        ) : viewMode === 'table' && groupByKey ? (
          <GroupedTableView
            menuScopePrefix="group"
            boardColumns={boardColumns}
            visibleColumns={visibleColumns}
            groupedRows={groupedRows}
            isEditing={isEditing}
            openColumnMenu={openColumnMenu}
            filters={filters}
            toggleColumnMenu={toggleColumnMenu}
            columnMenuStyle={columnMenuStyle}
            columnFilterSearch={columnFilterSearch}
            setColumnFilterSearch={setColumnFilterSearch}
            filterOptionsByColumn={filterOptionsByColumn}
            setFilterValues={setFilterValues}
            toggleFilterValue={toggleFilterValue}
            clearFiltersForColumn={clearFiltersForColumn}
            renameColumn={renameColumn}
            changeColumnType={changeColumnType}
            addStatusOption={addStatusOption}
            renameStatusOption={renameStatusOption}
            deleteStatusOption={deleteStatusOption}
            statusDraftByColumn={statusDraftByColumn}
            setStatusDraftByColumn={setStatusDraftByColumn}
            requestColumnDelete={requestColumnDelete}
            reorderColumns={reorderColumns}
            resizeColumn={resizeColumn}
            draggingColumnKey={draggingColumnKey}
            setDraggingColumnKey={setDraggingColumnKey}
            setActiveCell={setActiveCell}
            updateCell={updateCell}
            deleteRow={deleteRow}
            readOnly={readOnly}
            textSize={textSize}
            textSizeClasses={textSizeClasses}
            collapsedGroupLabels={collapsedGroupLabels}
            toggleGroupedSection={toggleGroupedSection}
            onAddRowToGroup={addGroupedRow}
          />
        ) : viewMode === 'table' ? (
          <TableView
            menuScope="table"
            boardColumns={boardColumns}
            visibleColumns={visibleColumns}
            filteredRows={filteredRows}
            isEditing={isEditing}
            openColumnMenu={openColumnMenu}
            filters={filters}
            toggleColumnMenu={toggleColumnMenu}
            columnMenuStyle={columnMenuStyle}
            columnFilterSearch={columnFilterSearch}
            setColumnFilterSearch={setColumnFilterSearch}
            filterOptionsByColumn={filterOptionsByColumn}
            setFilterValues={setFilterValues}
            toggleFilterValue={toggleFilterValue}
            clearFiltersForColumn={clearFiltersForColumn}
            renameColumn={renameColumn}
            changeColumnType={changeColumnType}
            addStatusOption={addStatusOption}
            renameStatusOption={renameStatusOption}
            deleteStatusOption={deleteStatusOption}
            statusDraftByColumn={statusDraftByColumn}
            setStatusDraftByColumn={setStatusDraftByColumn}
            requestColumnDelete={requestColumnDelete}
            reorderColumns={reorderColumns}
            resizeColumn={resizeColumn}
            draggingColumnKey={draggingColumnKey}
            setDraggingColumnKey={setDraggingColumnKey}
            setActiveCell={setActiveCell}
            updateCell={updateCell}
            deleteRow={deleteRow}
            readOnly={readOnly}
            textSize={textSize}
            textSizeClasses={textSizeClasses}
          />
        ) : viewMode === 'kanban' ? (
          <KanbanView
            kanbanColumn={kanbanColumn}
            kanbanLaneDefinitions={kanbanLaneDefinitions}
            kanbanGroups={kanbanGroups}
            kanbanCardFields={kanbanCardFields}
            kanbanPrimaryField={kanbanPrimaryField}
            textSize={textSize}
            kanbanTextSizeClasses={kanbanTextSizeClasses}
            collapsedKanbanLaneIds={collapsedKanbanLaneIds}
            kanbanCollapsedCardIds={kanbanCollapsedCardIds}
            setDraggingId={setDraggingId}
            handleDropToStatus={handleDropToStatus}
            toggleKanbanLaneCollapse={toggleKanbanLaneCollapse}
            toggleKanbanCardCollapse={toggleKanbanCardCollapse}
            onDeleteItem={deleteRow}
            onOpenItemEditor={setKanbanEditorRowId}
            boardColumns={boardColumns}
            readOnly={readOnly}
          />
        ) : (
          <GanttView
            rows={filteredRows}
            columns={boardColumns}
            ganttStartKey={ganttStartKey}
            ganttEndKey={ganttEndKey}
            ganttGroupByKey={ganttGroupByKey}
            readOnly={readOnly}
            onOpenItemEditor={setKanbanEditorRowId}
          />
        )}
      </div>

      {!readOnly && kanbanEditorRow && (
        <KanbanRowEditorModal
          row={kanbanEditorRow}
          columns={boardColumns}
          onClose={() => setKanbanEditorRowId(null)}
          onDelete={() => deleteRow(kanbanEditorRow.id)}
          onSave={(updates) => {
            updateRowValues(kanbanEditorRow.id, updates)
            setKanbanEditorRowId(null)
          }}
        />
      )}

      {pendingColumnDelete && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/35 p-4">
          <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <AlertTriangle size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-slate-900">Delete column?</h3>
                <p className="mt-1 text-sm text-slate-600">
                  You are about to delete <span className="font-semibold text-slate-900">{pendingColumnDelete.label}</span>. This removes the column and its values from the board.
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              This action cannot be undone.
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                onClick={() => setPendingColumnDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg border border-rose-600 bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                onClick={() => {
                  deleteColumn(pendingColumnDelete.key)
                  setPendingColumnDelete(null)
                }}
              >
                Delete column
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const TableView = memo(function TableView({
  menuScope = 'table',
  boardColumns,
  visibleColumns,
  filteredRows,
  isEditing,
  openColumnMenu,
  filters,
  toggleColumnMenu,
  columnMenuStyle,
  columnFilterSearch,
  setColumnFilterSearch,
  filterOptionsByColumn,
  setFilterValues,
  toggleFilterValue,
  clearFiltersForColumn,
  renameColumn,
  changeColumnType,
  addStatusOption,
  renameStatusOption,
  deleteStatusOption,
  statusDraftByColumn,
  setStatusDraftByColumn,
  requestColumnDelete,
  reorderColumns,
  resizeColumn,
  draggingColumnKey,
  setDraggingColumnKey,
  setActiveCell,
  updateCell,
  deleteRow,
  readOnly,
  textSize,
  textSizeClasses,
}) {
  const columnFilters = useMemo(
    () =>
      visibleColumns.reduce((accumulator, column) => {
        accumulator[column.key] = filters.find((filter) => filter.columnKey === column.key) || null
        return accumulator
      }, {}),
    [filters, visibleColumns],
  )

  function startColumnResize(event, column) {
    event.preventDefault()
    event.stopPropagation()

    const startingX = event.clientX
    const startingWidth = column.minWidth || 140

    function handleMouseMove(moveEvent) {
      resizeColumn(column.key, startingWidth + (moveEvent.clientX - startingX))
    }

    function handleMouseUp() {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div className="overflow-visible rounded-xl border border-slate-200 bg-white shadow-soft">
      <div className="overflow-x-auto overflow-y-visible">
      <table className={`min-w-full border-collapse ${textSizeClasses.table}`}>
        <thead className="sticky top-0 z-10 bg-slate-50">
          <tr>
            {visibleColumns.map((column) => (
              <th
                key={column.key}
                draggable={!readOnly}
                onDragStart={() => !readOnly && setDraggingColumnKey(column.key)}
                onDragOver={(event) => {
                  if (!readOnly) event.preventDefault()
                }}
                onDrop={() => !readOnly && reorderColumns(draggingColumnKey, column.key)}
                onDragEnd={() => setDraggingColumnKey(null)}
                className={`relative border-b border-r border-slate-200 text-left font-semibold uppercase tracking-wide text-slate-500 last:border-r-0 ${textSizeClasses.header}`}
                style={{ minWidth: column.minWidth }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`line-clamp-2 whitespace-normal break-words leading-tight ${draggingColumnKey === column.key ? 'opacity-40' : ''}`}
                  >
                    {column.label}
                  </span>
                  {!readOnly && (
                    <button
                      type="button"
                      data-column-menu-trigger
                      className="rounded px-1.5 py-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      onClick={(event) => toggleColumnMenu(event, `${menuScope}:${column.key}`)}
                    >
                      ⋯
                    </button>
                  )}
                </div>

                {!readOnly && openColumnMenu === `${menuScope}:${column.key}` && (
                  <div
                    data-column-menu
                    className="z-[70] overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 shadow-soft"
                    style={columnMenuStyle || undefined}
                  >
                    {(() => {
                      const searchValue = columnFilterSearch[column.key] || ''
                      const selectedValues = columnFilters[column.key]?.values || []
                      const allFilterOptions = filterOptionsByColumn[column.key] || []
                      const visibleFilterOptions = allFilterOptions.filter((option) =>
                        String(option?.label || '').toLowerCase().includes(searchValue.toLowerCase()),
                      )
                      const allVisibleSelected =
                        visibleFilterOptions.length > 0 &&
                        visibleFilterOptions.every((option) => selectedValues.includes(option.token))

                      return (
                        <>
                          <div className="mb-2 flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-slate-700">{column.label}</p>
                              <p className="text-[10px] uppercase tracking-wide text-slate-400">Column actions</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                                onClick={() => renameColumn(column.key)}
                                aria-label={`Rename ${column.label}`}
                                title="Rename"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                                onClick={() =>
                                  setFilterValues(
                                    column.key,
                                    visibleFilterOptions.map((option) => option.token),
                                  )
                                }
                                aria-label={`Select all visible values for ${column.label}`}
                                title="Select visible"
                              >
                                <CheckCheck size={14} />
                              </button>
                              {columnFilters[column.key] && (
                                <button
                                  type="button"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                                  onClick={() => clearFiltersForColumn(column.key)}
                                  aria-label={`Clear filters for ${column.label}`}
                                  title="Clear filters"
                                >
                                  <FilterX size={14} />
                                </button>
                              )}
                              <button
                                type="button"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 hover:text-rose-700"
                                onClick={() => requestColumnDelete(column.key)}
                                aria-label={`Delete ${column.label}`}
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <div className="space-y-1 px-1 pb-1">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Column type</p>
                            <select
                              className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs outline-none"
                              value={column.type}
                              onChange={(event) => changeColumnType(column.key, event.target.value)}
                            >
                              {columnTypeOptions.map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                            </select>
                          </div>
                    {column.type === 'status' && (
                      <div className="mt-2 space-y-2 border-t border-slate-200 px-1 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Statuses</p>
                        <div className="space-y-1.5">
                          {getStatusOptionsForColumn(column).map((option) => (
                            <div key={option} className="flex items-center gap-2 rounded-md bg-slate-50 px-2 py-1.5">
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${getStatusTone(option)}`}>
                                {option}
                              </span>
                              <button
                                type="button"
                                className="ml-auto text-[11px] font-medium text-slate-500 transition hover:text-slate-800"
                                onClick={() => renameStatusOption(column.key, option)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="text-[11px] font-medium text-rose-600 transition hover:text-rose-700 disabled:opacity-40"
                                onClick={() => deleteStatusOption(column.key, option)}
                                disabled={getStatusOptionsForColumn(column).length <= 1}
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={statusDraftByColumn[column.key] || ''}
                            onChange={(event) =>
                              setStatusDraftByColumn((current) => ({
                                ...current,
                                [column.key]: event.target.value,
                              }))
                            }
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault()
                                addStatusOption(column.key)
                              }
                            }}
                            placeholder="Add status"
                            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs outline-none"
                          />
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1.5 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50"
                            onClick={() => addStatusOption(column.key)}
                          >
                            <Plus size={12} />
                            Add
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="mt-2 space-y-2 border-t border-slate-200 pt-2">
                      <input
                        type="search"
                        value={searchValue}
                        onChange={(event) =>
                          setColumnFilterSearch((current) => ({
                            ...current,
                            [column.key]: event.target.value,
                          }))
                        }
                        placeholder="Search values"
                        className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs outline-none"
                      />
                      <label className="flex items-center gap-2 rounded-md px-1 py-1 text-xs font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={() => {
                            if (allVisibleSelected) {
                              const visibleTokens = new Set(visibleFilterOptions.map((option) => option.token))
                              setFilterValues(
                                column.key,
                                selectedValues.filter((token) => !visibleTokens.has(token)),
                              )
                              return
                            }

                            setFilterValues(column.key, [
                              ...selectedValues,
                              ...visibleFilterOptions.map((option) => option.token),
                            ])
                          }}
                        />
                        Select all visible
                      </label>
                      <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-2">
                        {visibleFilterOptions.length === 0 ? (
                          <p className="px-1 py-2 text-xs text-slate-500">No values match this search.</p>
                        ) : (
                          visibleFilterOptions.map((option) => (
                            <label key={option.token} className="flex items-center gap-2 rounded-md px-1 py-1 text-xs text-slate-700 hover:bg-white">
                              <input
                                type="checkbox"
                                checked={selectedValues.includes(option.token)}
                                onChange={() => toggleFilterValue(column.key, option.token)}
                              />
                              <span className="min-w-0 break-words">{option.label}</span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                        </>
                      )
                    })()}
                  </div>
                )}

                {!readOnly && (
                  <button
                    type="button"
                    aria-label={`Resize ${column.label}`}
                    onMouseDown={(event) => startColumnResize(event, column)}
                    className="absolute right-0 top-0 h-full w-2 cursor-col-resize rounded-r transition hover:bg-slate-200"
                  />
                )}
              </th>
            ))}
            {!readOnly && (
              <th
                className={`border-b border-slate-200 text-right font-semibold uppercase tracking-wide text-slate-500 ${textSizeClasses.header}`}
                style={{ minWidth: 88 }}
              >
                Action
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {filteredRows.map((row) => (
            <tr key={row.id} className="group transition hover:bg-sky-50/40">
              {visibleColumns.map((column) => (
                <td
                  key={`${row.id}-${column.key}`}
                  className={`border-b border-r border-slate-200 align-middle last:border-r-0 ${textSizeClasses.cell}`}
                  onClick={() => !readOnly && setActiveCell({ rowId: row.id, columnKey: column.key })}
                >
                  {!readOnly && isEditing(row.id, column.key) ? (
                    <EditableCell
                      column={column}
                      value={row[column.key]}
                      rowId={row.id}
                      textSize={textSize}
                      textSizeClasses={textSizeClasses}
                      onBlur={() => setActiveCell(null)}
                      onChange={updateCell}
                    />
                  ) : (
                    <ReadOnlyCell column={column} value={row[column.key]} textSize={textSize} />
                  )}
                </td>
              ))}
              {!readOnly && (
                <td className={`border-b border-slate-200 px-3 align-middle text-right ${textSizeClasses.cell}`}>
                  <button
                    type="button"
                    onClick={() => deleteRow(row.id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                    aria-label={`Delete ${row.name || 'row'}`}
                    title="Delete row"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
})

const GroupedTableView = memo(function GroupedTableView({
  menuScopePrefix = 'group',
  boardColumns,
  visibleColumns,
  groupedRows,
  isEditing,
  openColumnMenu,
  filters,
  toggleColumnMenu,
  columnMenuStyle,
  columnFilterSearch,
  setColumnFilterSearch,
  filterOptionsByColumn,
  setFilterValues,
  toggleFilterValue,
  clearFiltersForColumn,
  renameColumn,
  changeColumnType,
  addStatusOption,
  renameStatusOption,
  deleteStatusOption,
  statusDraftByColumn,
  setStatusDraftByColumn,
  requestColumnDelete,
  reorderColumns,
  resizeColumn,
  draggingColumnKey,
  setDraggingColumnKey,
  setActiveCell,
  updateCell,
  deleteRow,
  readOnly,
  textSize,
  textSizeClasses,
  collapsedGroupLabels = [],
  toggleGroupedSection,
  onAddRowToGroup,
}) {
  return (
    <div className="space-y-4">
      {groupedRows.map((group) => (
        <section key={group.label} className="overflow-visible rounded-xl border border-slate-200 bg-white shadow-soft">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className={`font-semibold text-slate-900 ${textSizeClasses.groupHeaderTitle}`}>{group.label}</p>
              <p className={`text-slate-500 ${textSizeClasses.groupHeaderMeta}`}>{group.items.length} items</p>
            </div>
            <div className="flex items-center gap-2">
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => onAddRowToGroup(group.label)}
                  className={`rounded-lg border border-slate-300 bg-white font-medium text-slate-700 transition hover:bg-slate-50 ${textSizeClasses.groupHeaderAction}`}
                >
                  Add item
                </button>
              )}
              <button
                type="button"
                onClick={() => toggleGroupedSection(group.label)}
                className={`inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-700 transition hover:bg-slate-50 ${textSizeClasses.groupHeaderAction}`}
                aria-label={collapsedGroupLabels.includes(group.label) ? `Expand ${group.label}` : `Collapse ${group.label}`}
              >
                {collapsedGroupLabels.includes(group.label) ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                {collapsedGroupLabels.includes(group.label) ? 'Expand' : 'Collapse'}
              </button>
            </div>
          </div>

          {!collapsedGroupLabels.includes(group.label) ? (
            <TableView
              menuScope={`${menuScopePrefix}:${group.label}`}
              boardColumns={boardColumns}
              visibleColumns={visibleColumns}
            filteredRows={group.items}
            isEditing={isEditing}
            openColumnMenu={openColumnMenu}
            filters={filters}
            toggleColumnMenu={toggleColumnMenu}
            columnMenuStyle={columnMenuStyle}
            columnFilterSearch={columnFilterSearch}
            setColumnFilterSearch={setColumnFilterSearch}
            filterOptionsByColumn={filterOptionsByColumn}
            setFilterValues={setFilterValues}
            toggleFilterValue={toggleFilterValue}
            clearFiltersForColumn={clearFiltersForColumn}
            renameColumn={renameColumn}
            changeColumnType={changeColumnType}
            addStatusOption={addStatusOption}
            renameStatusOption={renameStatusOption}
            deleteStatusOption={deleteStatusOption}
            statusDraftByColumn={statusDraftByColumn}
            setStatusDraftByColumn={setStatusDraftByColumn}
            requestColumnDelete={requestColumnDelete}
              reorderColumns={reorderColumns}
              resizeColumn={resizeColumn}
              draggingColumnKey={draggingColumnKey}
              setDraggingColumnKey={setDraggingColumnKey}
              setActiveCell={setActiveCell}
              updateCell={updateCell}
              deleteRow={deleteRow}
              readOnly={readOnly}
              textSize={textSize}
              textSizeClasses={textSizeClasses}
            />
          ) : (
            <div className="px-4 py-3 text-sm text-slate-500">
              {group.items.length} rows hidden in this section.
            </div>
          )}
        </section>
      ))}
    </div>
  )
})

const KanbanView = memo(function KanbanView({
  kanbanColumn,
  kanbanLaneDefinitions,
  kanbanGroups,
  kanbanCardFields,
  kanbanPrimaryField,
  textSize,
  kanbanTextSizeClasses,
  collapsedKanbanLaneIds,
  kanbanCollapsedCardIds,
  setDraggingId,
  handleDropToStatus,
  toggleKanbanLaneCollapse,
  toggleKanbanCardCollapse,
  onDeleteItem,
  onOpenItemEditor,
  boardColumns,
  readOnly,
}) {
  if (!kanbanColumn) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-soft">
        Choose a grouping column to use Kanban view.
      </div>
    )
  }

  const primaryColumn =
    boardColumns.find((column) => column.key === kanbanPrimaryField) ||
    boardColumns.find((column) => column.key === 'name') ||
    boardColumns[0]
  const visibleCardColumns = boardColumns.filter(
    (column) => kanbanCardFields.includes(column.key) && column.key !== kanbanColumn?.key,
  )

  return (
    <div className="grid min-h-[300px] gap-4 md:grid-cols-3">
      {kanbanLaneDefinitions.map((lane) => (
        (() => {
          const isLaneCollapsed = collapsedKanbanLaneIds.includes(lane.id)

          return (
            <div
              key={lane.id}
              className="rounded-xl border border-slate-200 bg-white p-3 shadow-soft transition-all duration-300"
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDropToStatus(lane.value)}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full font-medium ${lane.tone} ${kanbanTextSizeClasses.laneBadge}`}>
                    {lane.label}
                  </span>
                  <span className={`text-slate-400 ${kanbanTextSizeClasses.laneCount}`}>{kanbanGroups[lane.id]?.length || 0}</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleKanbanLaneCollapse(lane.id)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label={isLaneCollapsed ? `Expand ${lane.label}` : `Collapse ${lane.label}`}
                  title={isLaneCollapsed ? 'Expand section' : 'Collapse section'}
                >
                  {isLaneCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </button>
              </div>

              {!isLaneCollapsed ? (
                <div className="space-y-2">
                  {(kanbanGroups[lane.id] || []).map((item) => (
              (() => {
                const isCollapsed = kanbanCollapsedCardIds.includes(item.id)

                return (
                  <article
                    key={item.id}
                    draggable={!readOnly}
                    onDoubleClick={() => !readOnly && onOpenItemEditor(item.id)}
                    onDragStart={() => !readOnly && setDraggingId(item.id)}
                    className={`overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-soft ${
                      readOnly ? 'cursor-default' : 'cursor-grab'
                    }`}
                  >
                    <div className="border-b border-dashed border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className={`font-semibold uppercase tracking-[0.28em] text-slate-400 ${kanbanTextSizeClasses.cardHeaderEyebrow}`}>Item</p>
                          <p className={`mt-1 font-semibold text-slate-900 ${kanbanTextSizeClasses.cardHeaderValue}`}>
                            {formatColumnValue(item[primaryColumn?.key], primaryColumn?.type) || 'Untitled'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            toggleKanbanCardCollapse(item.id)
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                          aria-label={isCollapsed ? 'Expand card' : 'Collapse card'}
                          title={isCollapsed ? 'Expand card' : 'Collapse card'}
                        >
                          {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                        </button>
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault()
                              event.stopPropagation()
                              onDeleteItem(item.id)
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                            aria-label="Delete row"
                            title="Delete row"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                    {!isCollapsed && (
                      <>
                        <div className="space-y-2 px-4 py-3">
                          {visibleCardColumns.length === 0 ? (
                            <div className={`rounded-xl bg-slate-50 text-slate-500 ${kanbanTextSizeClasses.cardFieldRow} ${textSize === 'large' ? 'text-base' : textSize === 'small' ? 'text-xs' : 'text-sm'}`}>
                              Select card fields in Kanban config.
                            </div>
                          ) : (
                            visibleCardColumns.map((column) => (
                              <div
                                key={`${item.id}-${column.key}`}
                                className={`grid grid-cols-[110px_minmax(0,1fr)] items-start gap-3 rounded-xl bg-slate-50 ${kanbanTextSizeClasses.cardFieldRow}`}
                              >
                                <span className={`font-semibold uppercase tracking-[0.18em] text-slate-400 ${kanbanTextSizeClasses.cardFieldLabel}`}>
                                  {column.label}
                                </span>
                                <span className={`text-slate-700 ${kanbanTextSizeClasses.cardFieldValue}`}>{formatColumnValue(item[column.key], column.type)}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </article>
                )
              })()
                  ))}
                </div>
              ) : (
                <div className={`rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-500 ${kanbanTextSizeClasses.laneSummary}`}>
                  {(kanbanGroups[lane.id] || []).length} cards hidden in this section.
                </div>
              )}
            </div>
          )
        })()
      ))}
    </div>
  )
})

function GanttView({ rows, columns, ganttStartKey, ganttEndKey, ganttGroupByKey, readOnly, onOpenItemEditor }) {
  const [scale, setScale] = useState('day')
  const startKey = ganttStartKey || columns.find((column) => column.key === 'start_date')?.key || columns.find((column) => column.type === 'date')?.key || ''
  const endKey = ganttEndKey || columns.find((column) => column.key === 'due_date')?.key || startKey
  const itemsWithDates = rows
    .map((row) => ({
      ...row,
      __ganttStart: row[startKey],
      __ganttEnd: row[endKey] || row[startKey],
      __ganttGroup: ganttGroupByKey ? String(row[ganttGroupByKey] || 'Uncategorized') : '',
    }))
    .filter((row) => row.__ganttStart && row.__ganttEnd)

  if (!itemsWithDates.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-soft">
        Select date columns in Gantt config to generate a timeline from this board.
      </div>
    )
  }

  const startTimestamp = Math.min(...itemsWithDates.map((row) => new Date(row.__ganttStart).getTime()))
  const endTimestamp = Math.max(...itemsWithDates.map((row) => new Date(row.__ganttEnd).getTime()))
  const totalDays = Math.max(1, Math.round((endTimestamp - startTimestamp) / (1000 * 60 * 60 * 24)) + 1)
  const timelineSegments = getGanttScaleSegments(startTimestamp, endTimestamp, scale)
  const useVerticalLabels = timelineSegments.length > 12 || (scale === 'day' && timelineSegments.length > 8)
  const groupedItems = ganttGroupByKey
    ? itemsWithDates.reduce((accumulator, row) => {
        const label = row.__ganttGroup || 'Uncategorized'
        if (!accumulator[label]) accumulator[label] = []
        accumulator[label].push(row)
        return accumulator
      }, {})
    : { 'Current items': itemsWithDates }
  const scaleOptions = [
    { id: 'day', label: 'Days' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'year', label: 'Year' },
  ]

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Gantt timeline</p>
          <p className="mt-1 text-xs text-slate-500">
            {formatDateInputValue(startTimestamp)} to {formatDateInputValue(endTimestamp)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {scaleOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setScale(option.id)}
              className={`rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition ${
                scale === option.id
                  ? 'bg-slate-900 text-white shadow-soft'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[720px] space-y-2 p-3 sm:p-4">
          <div className="grid gap-2 md:grid-cols-[180px_minmax(0,1fr)] md:items-end lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Timeline scale</div>
            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: `repeat(${timelineSegments.length}, minmax(1.75rem, 1fr))` }}
            >
              {timelineSegments.map((segment) => (
                <div
                  key={segment.key}
                  className={`flex justify-center rounded-md border border-slate-200 bg-slate-50 px-1 py-1 ${
                    useVerticalLabels ? 'min-h-16 items-end' : 'min-h-10 items-center'
                  }`}
                >
                  <span
                    className="text-[10px] font-semibold leading-none text-slate-700"
                    style={
                      useVerticalLabels
                        ? { writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }
                        : undefined
                    }
                  >
                    {segment.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

        {Object.entries(groupedItems).map(([groupLabel, groupRows]) => (
          <div key={groupLabel} className="space-y-2">
            {ganttGroupByKey && (
              <div className="sticky left-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{groupLabel}</p>
                <p className="mt-1 text-xs text-slate-500">{groupRows.length} items</p>
              </div>
            )}
            {groupRows.map((row) => {
              const startOffset = Math.round((new Date(row.__ganttStart).getTime() - startTimestamp) / (1000 * 60 * 60 * 24))
              const duration = Math.max(1, Math.round((new Date(row.__ganttEnd).getTime() - new Date(row.__ganttStart).getTime()) / (1000 * 60 * 60 * 24)) + 1)

              return (
                <div key={row.id} className="grid gap-2 md:grid-cols-[180px_minmax(0,1fr)] md:items-center lg:grid-cols-[220px_minmax(0,1fr)]">
                  <div
                    onDoubleClick={() => !readOnly && onOpenItemEditor(row.id)}
                    className={readOnly ? '' : 'cursor-pointer'}
                    title={readOnly ? undefined : 'Double-click to edit'}
                  >
                    <p className="text-sm font-medium text-slate-900">{row.name}</p>
                    <p className="text-xs text-slate-500">
                      {row.owner || 'Unassigned'} · {row.__ganttStart} to {row.__ganttEnd}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-100 p-1.5">
                    <div
                      className="relative h-7 rounded bg-white"
                      style={{
                        backgroundImage: `linear-gradient(to right, rgba(148,163,184,0.18) 1px, transparent 1px)`,
                        backgroundSize: `${100 / Math.max(timelineSegments.length, 1)}% 100%`,
                      }}
                    >
                      <div
                        className="absolute top-1 h-5 rounded bg-slate-900"
                        style={{
                          left: `${(startOffset / totalDays) * 100}%`,
                          width: `${(duration / totalDays) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        </div>
      </div>
    </div>
  )
}

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

function KanbanRowEditorModal({ row, columns, onClose, onDelete, onSave }) {
  const [draft, setDraft] = useState(() =>
    columns.reduce((accumulator, column) => {
      accumulator[column.key] = row[column.key] ?? getDefaultValue(column.type, column)
      return accumulator
    }, {}),
  )

  useEffect(() => {
    setDraft(
      columns.reduce((accumulator, column) => {
        accumulator[column.key] = row[column.key] ?? getDefaultValue(column.type, column)
        return accumulator
      }, {}),
    )
  }, [columns, row])

  function handleSubmit(event) {
    event.preventDefault()
    onSave(draft)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className="max-h-[calc(100vh-1.5rem)] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-white/60 bg-white p-4 shadow-[0_24px_80px_rgba(15,23,42,0.24)] sm:max-h-[calc(100vh-2rem)] sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Edit item</p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{row.name || 'Kanban item'}</h2>
            <p className="text-sm text-slate-600">
              Double-clicking a card opens the full row editor using the current board column order.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            {columns.map((column) => (
              <label key={column.key} className="space-y-2">
                <span className="text-sm font-medium text-slate-900">{column.label}</span>
                {column.type === 'status' ? (
                  <select
                    value={draft[column.key] ?? getStatusOptionsForColumn(column)[0] ?? ''}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, [column.key]: event.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-200 transition focus:ring"
                  >
                    {getStatusOptionsForColumn(column).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : column.type === 'boolean' ? (
                  <select
                    value={String(draft[column.key] ?? false)}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        [column.key]: normalizeInputValue(column.type, event.target.value),
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-200 transition focus:ring"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                ) : (
                  <input
                    type={column.type === 'date' ? 'date' : column.type === 'number' || column.type === 'currency' ? 'number' : 'text'}
                    step={column.type === 'currency' ? '0.01' : column.type === 'number' ? '1' : undefined}
                    value={draft[column.key] ?? ''}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        [column.key]: normalizeInputValue(column.type, event.target.value),
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-200 transition focus:ring"
                  />
                )}
              </label>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={onDelete}
              className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              Delete row
            </button>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-full px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: 'var(--pulse-accent)' }}
              >
                Save changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

function BoardLoadingState() {
  return (
    <div
      className="space-y-3 rounded-xl border p-4 shadow-soft"
      style={{
        borderColor: 'color-mix(in srgb, var(--pulse-accent) 24%, white)',
        backgroundColor: 'var(--surface-elevated)',
      }}
    >
      <div
        className="h-7 w-1/3 animate-pulse rounded"
        style={{ backgroundColor: 'color-mix(in srgb, var(--pulse-accent-soft) 60%, white)' }}
      />
      <div
        className="h-40 animate-pulse rounded"
        style={{ backgroundColor: 'color-mix(in srgb, var(--pulse-accent-soft) 70%, white)' }}
      />
      <div
        className="h-40 animate-pulse rounded"
        style={{ backgroundColor: 'color-mix(in srgb, var(--pulse-accent-soft) 70%, white)' }}
      />
    </div>
  )
}

function EditableCell({ column, value, rowId, textSizeClasses, onBlur, onChange }) {
  const [draftValue, setDraftValue] = useState(value ?? getDefaultValue(column.type, column))

  useEffect(() => {
    setDraftValue(value ?? getDefaultValue(column.type, column))
  }, [column, value])

  function commitValue(nextValue = draftValue) {
    onChange(rowId, column.key, nextValue)
    onBlur()
  }

  if (column.type === 'status') {
    return (
      <select
        autoFocus
        className={`w-full rounded-md border border-slate-300 bg-white outline-none ring-sky-200 transition focus:ring ${textSizeClasses.input}`}
        value={draftValue}
        onBlur={onBlur}
        onChange={(event) => setDraftValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            commitValue(draftValue)
          }
          if (event.key === 'Escape') {
            event.preventDefault()
            setDraftValue(value ?? getDefaultValue(column.type, column))
            onBlur()
          }
        }}
      >
        {getStatusOptionsForColumn(column).map((option) => (
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
        className={`w-full rounded-md border border-slate-300 bg-white outline-none ring-sky-200 transition focus:ring ${textSizeClasses.input}`}
        value={String(draftValue)}
        onBlur={onBlur}
        onChange={(event) => setDraftValue(event.target.value === 'true')}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            commitValue(draftValue)
          }
          if (event.key === 'Escape') {
            event.preventDefault()
            setDraftValue(value ?? getDefaultValue(column.type, column))
            onBlur()
          }
        }}
      >
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    )
  }

  return (
    <input
      autoFocus
      type={column.type === 'date' ? 'date' : column.type === 'number' || column.type === 'currency' ? 'number' : 'text'}
      step={column.type === 'currency' ? '0.01' : column.type === 'number' ? '1' : undefined}
      value={draftValue}
      className={`w-full rounded-md border border-slate-300 bg-white outline-none ring-sky-200 transition focus:ring ${textSizeClasses.input}`}
      onBlur={onBlur}
      onChange={(event) => {
        const nextValue =
          column.type === 'number' || column.type === 'currency' ? Number(event.target.value || 0) : event.target.value
        setDraftValue(nextValue)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          commitValue(draftValue)
        }
        if (event.key === 'Escape') {
          event.preventDefault()
          setDraftValue(value ?? getDefaultValue(column.type, column))
          onBlur()
        }
      }}
    />
  )
}

function ReadOnlyCell({ column, value, textSize = 'medium' }) {
  const textClass = textSize === 'large' ? 'text-base' : textSize === 'small' ? 'text-xs' : 'text-sm'
  const wrappedTextClass = `block line-clamp-2 whitespace-normal break-words leading-snug ${textClass}`
  const ownerBadgeClass =
    textSize === 'large'
      ? 'h-8 w-8 text-xs'
      : textSize === 'small'
        ? 'h-6 w-6 text-[10px]'
        : 'h-7 w-7 text-[11px]'

  if (column.type === 'status') {
    return (
      <span
        className={`inline-flex rounded-full px-2.5 py-1 font-medium ${
          textSize === 'large' ? 'text-sm' : 'text-xs'
        } ${
          getStatusTone(value)
        }`}
      >
        {value}
      </span>
    )
  }

  if (column.type === 'owner' || column.key === 'owner') {
    return (
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-700 ${ownerBadgeClass}`}>
          {getInitials(value || 'NA')}
        </span>
        <span className={`text-slate-700 ${wrappedTextClass}`}>{value || 'Unassigned'}</span>
      </div>
    )
  }

  if (column.type === 'boolean') {
    return (
      <span
        className={`inline-flex rounded-full px-2 py-1 font-medium ${
          textSize === 'large' ? 'text-sm' : 'text-xs'
        } ${
          value ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
        }`}
      >
        {value ? 'Yes' : 'No'}
      </span>
    )
  }

  if (isMapsColumn(column)) {
    if (!value) return <span className={`text-slate-700 ${textClass}`}>—</span>

    return (
      <a
        href={getMapsUrl(value)}
        target="_blank"
        rel="noreferrer"
        className={`font-medium text-sky-700 underline decoration-sky-300 underline-offset-2 transition hover:text-sky-900 ${wrappedTextClass}`}
      >
        {value}
      </a>
    )
  }

  return <span className={`text-slate-700 ${wrappedTextClass}`}>{formatColumnValue(value, column.type)}</span>
}

export default BoardTable
