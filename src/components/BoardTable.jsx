import { AlertTriangle, ArrowDownAZ, ArrowUpAZ, CheckCheck, ChevronDown, ChevronUp, Download, FilterX, GripVertical, Palette, Pencil, Plus, Trash2 } from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { statusColors, statusOptions } from '../data/boardMock'

const columnTypeOptions = ['text', 'number', 'currency', 'date', 'status', 'boolean', 'location', 'address', 'phone', 'tracking', 'updates']
const textSizeOptions = ['small', 'medium', 'large']
const COLUMN_MIN_WIDTH = 72
const COLUMN_MENU_WIDTH = 272
const ACTION_COLUMN_WIDTH = 88
const VIEWPORT_MENU_PADDING = 12
const COLUMN_MENU_MAX_HEIGHT = 420
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const APP_STICKY_TOP_OFFSET = 76
const GROUP_SECTION_HEADER_HEIGHT = 57
const SUBGROUP_SECTION_HEADER_HEIGHT = 45
const conditionalOperatorOptions = [
  { value: 'equals', label: 'Is equal to' },
  { value: 'not_equals', label: 'Is not equal to' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does not contain' },
  { value: 'starts_with', label: 'Starts with' },
  { value: 'ends_with', label: 'Ends with' },
  { value: 'greater_than', label: 'Greater than' },
  { value: 'greater_or_equal', label: 'Greater than or equal' },
  { value: 'less_than', label: 'Less than' },
  { value: 'less_or_equal', label: 'Less than or equal' },
  { value: 'between', label: 'Between' },
  { value: 'is_empty', label: 'Is empty' },
  { value: 'is_not_empty', label: 'Is not empty' },
]
const conditionalTextColorOptions = [
  { value: '', label: 'Default' },
  { value: 'text-slate-900', label: 'Slate' },
  { value: 'text-rose-700', label: 'Rose' },
  { value: 'text-amber-700', label: 'Amber' },
  { value: 'text-emerald-700', label: 'Emerald' },
  { value: 'text-sky-700', label: 'Sky' },
  { value: 'text-violet-700', label: 'Violet' },
]
const conditionalBackgroundOptions = [
  { value: '', label: 'None' },
  { value: 'bg-slate-100', label: 'Slate' },
  { value: 'bg-rose-50', label: 'Rose' },
  { value: 'bg-amber-50', label: 'Amber' },
  { value: 'bg-emerald-50', label: 'Emerald' },
  { value: 'bg-sky-50', label: 'Sky' },
  { value: 'bg-violet-50', label: 'Violet' },
]
const groupedSectionColorOptions = [
  { id: 'slate', accent: '#94a3b8', header: '#f8fafc', section: '#ffffff', nested: '#f8fafc' },
  { id: 'sky', accent: '#38bdf8', header: '#f0f9ff', section: '#f8fcff', nested: '#f0f9ff' },
  { id: 'emerald', accent: '#34d399', header: '#ecfdf5', section: '#f8fffb', nested: '#ecfdf5' },
  { id: 'amber', accent: '#f59e0b', header: '#fffbeb', section: '#fffdf6', nested: '#fffbeb' },
  { id: 'rose', accent: '#fb7185', header: '#fff1f2', section: '#fffafa', nested: '#fff1f2' },
  { id: 'violet', accent: '#a78bfa', header: '#f5f3ff', section: '#fcfbff', nested: '#f5f3ff' },
]
const conditionalFontFamilyOptions = [
  { value: '', label: 'Default' },
  { value: 'font-sans', label: 'Sans' },
  { value: 'font-serif', label: 'Serif' },
  { value: 'font-mono', label: 'Mono' },
]
const statusToneClasses = [
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-emerald-100 text-emerald-700',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
  'bg-slate-200 text-slate-700',
]
const statusColorOptions = [
  { id: 'amber', label: 'Amber', className: 'bg-amber-100 text-amber-700' },
  { id: 'rose', label: 'Rose', className: 'bg-rose-100 text-rose-700' },
  { id: 'emerald', label: 'Emerald', className: 'bg-emerald-100 text-emerald-700' },
  { id: 'sky', label: 'Sky', className: 'bg-sky-100 text-sky-700' },
  { id: 'violet', label: 'Violet', className: 'bg-violet-100 text-violet-700' },
  { id: 'slate', label: 'Slate', className: 'bg-slate-200 text-slate-700' },
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
  if (type === 'updates') return ''
  return ''
}

function normalizeInputValue(type, value) {
  if (type === 'number') return Number(value || 0)
  if (type === 'currency') return Number(value || 0)
  if (type === 'boolean') return value === true || value === 'true'
  if (type === 'phone') return formatPhoneNumber(value)
  return value
}

function createConditionalRuleId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `rule-${crypto.randomUUID()}`
  }

  return `rule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function formatCurrencyValue(value) {
  const amount = Number(value || 0)
  if (Number.isNaN(amount)) return '$0.00'

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function getCurrencySummary(columns = [], rows = []) {
  const currencyColumns = columns.filter((column) => column.type === 'currency')
  if (currencyColumns.length === 0) return ''

  return currencyColumns
    .map((column) => {
      const total = rows.reduce((sum, row) => {
        const amount = Number(row?.[column.key] || 0)
        return Number.isNaN(amount) ? sum : sum + amount
      }, 0)

      return `${column.label}: ${formatCurrencyValue(total)}`
    })
    .join(' · ')
}

function formatPhoneNumber(value) {
  const digits = String(value ?? '')
    .replace(/\D/g, '')
    .slice(0, 10)

  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
}

function stringifyCellValue(value) {
  if (value == null) return ''
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? '' : value.toISOString()
  if (Array.isArray(value)) {
    return value
      .map((entry) => stringifyCellValue(entry))
      .filter(Boolean)
      .join(', ')
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }
  return String(value)
}

function normalizeSearchValue(value) {
  return stringifyCellValue(value).trim().toLowerCase()
}

function parseDateValue(value) {
  if (value == null || value === '') return null

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  const normalizedValue = typeof value === 'string' ? value.trim() : stringifyCellValue(value)

  if (typeof normalizedValue === 'string' && DATE_ONLY_PATTERN.test(normalizedValue)) {
    const [year, month, day] = normalizedValue.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  const date = new Date(normalizedValue)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatLocalDateKey(value) {
  const date = parseDateValue(value)
  if (!date) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatShortDate(value) {
  if (!value) return '—'
  const date = parseDateValue(value)
  if (!date) return stringifyCellValue(value) || '—'

  return new Intl.DateTimeFormat('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit',
  }).format(date)
}

function formatDateTimeValue(value) {
  if (!value) return '—'
  const date = parseDateValue(value)
  if (!date) return stringifyCellValue(value) || '—'

  return new Intl.DateTimeFormat('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function getStatusOptionsForColumn(column) {
  return column?.statusOptions?.length ? column.statusOptions : statusOptions
}

function getDefaultStatusTone(value) {
  if (statusColors[value]) return statusColors[value]
  const hash = String(value || '')
    .split('')
    .reduce((total, character) => total + character.charCodeAt(0), 0)
  return statusToneClasses[hash % statusToneClasses.length]
}

function getStatusColorMap(column) {
  if (!column || typeof column.statusColors !== 'object' || Array.isArray(column.statusColors)) return {}
  return column.statusColors
}

function getStatusTone(value, column = null) {
  const configuredTone = getStatusColorMap(column)[value]
  if (configuredTone) return configuredTone
  return getDefaultStatusTone(value)
}

function buildStatusColorMap(options = [], existingColors = {}) {
  return options.reduce((accumulator, option) => {
    accumulator[option] = existingColors[option] || getDefaultStatusTone(option)
    return accumulator
  }, {})
}

function getMapsUrl(value) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(String(value || ''))}`
}

function getGoogleSearchUrl(value) {
  return `https://www.google.com/search?q=${encodeURIComponent(String(value || ''))}`
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

function isTrackingColumn(column) {
  const normalizedKey = String(column?.key || '').toLowerCase()
  const normalizedLabel = String(column?.label || '').toLowerCase()

  return (
    column?.type === 'tracking' ||
    normalizedKey.includes('tracking') ||
    normalizedKey.includes('tracking-number') ||
    normalizedLabel.includes('tracking')
  )
}

function isEmailColumn(column) {
  const normalizedKey = String(column?.key || '').toLowerCase()
  const normalizedLabel = String(column?.label || '').toLowerCase()

  return normalizedKey.includes('email') || normalizedLabel.includes('email')
}

function getColumnLinkUrl(column, value) {
  if (isMapsColumn(column)) return getMapsUrl(value)
  if (isTrackingColumn(column)) return getGoogleSearchUrl(value)
  return ''
}

function stringifyComparableValue(value, type) {
  if (value == null) return ''
  if (type === 'boolean') return value ? 'true' : 'false'
  return stringifyCellValue(value).trim()
}

function getComparableValue(value, column) {
  if (value == null || value === '') return null

  if (column?.type === 'number' || column?.type === 'currency') {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? null : parsed
  }

  if (column?.type === 'date' || column?.type === 'updates') {
    const parsedDate = parseDateValue(value)
    return parsedDate ? parsedDate.getTime() : null
  }

  if (column?.type === 'boolean') {
    return value === true || value === 'true'
  }

  return stringifyComparableValue(value, column?.type).toLowerCase()
}

function matchesConditionalRule(rule, column, value) {
  if (!rule || rule.columnKey !== column?.key) return false

  const operator = rule.operator || 'equals'
  if (operator === 'is_empty') return value == null || value === ''
  if (operator === 'is_not_empty') return value != null && value !== ''

  const comparableValue = getComparableValue(value, column)
  if (comparableValue == null) return false

  const primaryValue = getComparableValue(rule.value, column)
  const secondaryValue = getComparableValue(rule.secondaryValue, column)

  switch (operator) {
    case 'equals':
      return comparableValue === primaryValue
    case 'not_equals':
      return comparableValue !== primaryValue
    case 'contains':
      return String(comparableValue).includes(String(primaryValue ?? '').toLowerCase())
    case 'not_contains':
      return !String(comparableValue).includes(String(primaryValue ?? '').toLowerCase())
    case 'starts_with':
      return String(comparableValue).startsWith(String(primaryValue ?? '').toLowerCase())
    case 'ends_with':
      return String(comparableValue).endsWith(String(primaryValue ?? '').toLowerCase())
    case 'greater_than':
      return comparableValue > primaryValue
    case 'greater_or_equal':
      return comparableValue >= primaryValue
    case 'less_than':
      return comparableValue < primaryValue
    case 'less_or_equal':
      return comparableValue <= primaryValue
    case 'between':
      return primaryValue != null && secondaryValue != null && comparableValue >= primaryValue && comparableValue <= secondaryValue
    default:
      return false
  }
}

function getConditionalFormattingClassName(rules, column, value) {
  const matchedRules = (rules || []).filter((rule) => matchesConditionalRule(rule, column, value))

  return matchedRules
    .flatMap((rule) => [
      rule.backgroundColor || '',
      rule.textColor || '',
      rule.bold ? 'font-semibold' : '',
      rule.fontFamily || '',
    ])
    .filter(Boolean)
    .join(' ')
}

function formatColumnValue(value, type) {
  if (type === 'boolean') return value ? 'Yes' : 'No'
  if (type === 'date') return formatShortDate(value)
  if (type === 'updates') return formatDateTimeValue(value)
  if (type === 'number') return value === '' ? '0' : value
  if (type === 'currency') return formatCurrencyValue(value)
  if (type === 'phone') return formatPhoneNumber(value) || '—'
  return stringifyCellValue(value) || '—'
}

function getTrackedColumns(columns = []) {
  return columns.filter((column) => column.type !== 'updates')
}

function getUpdateColumns(columns = []) {
  return columns.filter((column) => column.type === 'updates')
}

function isSameCellValue(previousValue, nextValue) {
  return JSON.stringify(previousValue ?? '') === JSON.stringify(nextValue ?? '')
}

function createRowUpdateEntry(changes, editor) {
  return {
    id: createConditionalRuleId(),
    editedAt: new Date().toISOString(),
    editedById: editor?.id || '',
    editedByName: editor?.name || editor?.email || '',
    editedByEmail: editor?.email || '',
    changes,
  }
}

function applyRowUpdateHistory(previousRows, nextRows, columns, editor = null) {
  const updateColumns = getUpdateColumns(columns)
  if (updateColumns.length === 0) return nextRows

  const trackedColumns = getTrackedColumns(columns)
  const previousRowsById = new Map(previousRows.map((row) => [row.id, row]))

  return nextRows.map((row) => {
    const previousRow = previousRowsById.get(row.id)
    const previousHistory = Array.isArray(row.__pulseUpdates)
      ? row.__pulseUpdates
      : Array.isArray(previousRow?.__pulseUpdates)
        ? previousRow.__pulseUpdates
        : []

    if (!previousRow) {
      const nextTimestamp = previousHistory[0]?.editedAt || ''
      return updateColumns.reduce(
        (accumulator, column) => ({
          ...accumulator,
          [column.key]: nextTimestamp,
        }),
        {
          ...row,
          __pulseUpdates: previousHistory,
        },
      )
    }

    const changes = trackedColumns
      .filter((column) => !isSameCellValue(previousRow[column.key], row[column.key]))
      .map((column) => ({
        columnKey: column.key,
        columnLabel: column.label,
        previousValue: previousRow[column.key] ?? '',
        nextValue: row[column.key] ?? '',
      }))

    const nextHistory = changes.length
      ? [createRowUpdateEntry(changes, editor), ...previousHistory].slice(0, 25)
      : previousHistory

    const nextTimestamp = nextHistory[0]?.editedAt || ''

    return updateColumns.reduce(
      (accumulator, column) => ({
        ...accumulator,
        [column.key]: nextTimestamp,
      }),
      {
        ...row,
        __pulseUpdates: nextHistory,
      },
    )
  })
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

function groupRowsByKey(rows, groupKey) {
  if (!groupKey) return []

  const groups = rows.reduce((accumulator, row) => {
    const label = String(row[groupKey] || 'Uncategorized')
    if (!accumulator[label]) accumulator[label] = []
    accumulator[label].push(row)
    return accumulator
  }, {})

  return Object.entries(groups).map(([label, items]) => ({ label, items }))
}

function getNestedGroupCollapseKey(parentLabel, childLabel) {
  return `${String(parentLabel)}::${String(childLabel)}`
}

function getGroupedRowValue(groupLabel) {
  return groupLabel === 'Uncategorized' ? '' : groupLabel
}

function toCsvCell(value) {
  const normalizedValue = value == null ? '' : String(value)
  return /[",\n]/.test(normalizedValue) ? `"${normalizedValue.replace(/"/g, '""')}"` : normalizedValue
}

function getValidDate(value) {
  return parseDateValue(value)
}

function formatDateInputValue(value) {
  return formatLocalDateKey(value)
}

function createUtcDate(value) {
  const date = getValidDate(value)
  if (!date) return new Date(NaN)
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
}

function addUtcDays(value, amount) {
  const date = getValidDate(value)
  if (!date) return new Date(NaN)
  date.setUTCDate(date.getUTCDate() + amount)
  return date
}

function addUtcMonths(value, amount) {
  const date = getValidDate(value)
  if (!date) return new Date(NaN)
  date.setUTCMonth(date.getUTCMonth() + amount)
  return date
}

function startOfUtcWeek(value) {
  const date = getValidDate(value)
  if (!date) return new Date(NaN)
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
  currentUser = null,
  readOnly = false,
  canManageColumns = !readOnly,
  initialViewMode = 'table',
  initialGroupByKey = '',
  initialSecondaryGroupByKey = '',
  initialSortConfig = null,
  initialGroupedSectionCollapsedByField = {},
  initialGroupedSectionOrderByField = {},
  initialGroupedSectionColorByField = {},
  initialGanttGroupByKey = '',
  initialGanttStartKey = '',
  initialGanttEndKey = '',
  initialKanbanGroupKey = '',
  initialKanbanPrimaryField = 'name',
  initialKanbanCardFields = [],
  initialKanbanCollapsedLaneIdsByField = {},
  initialConditionalFormattingRules = [],
  initialTextSize = 'medium',
  clearFiltersToken = 0,
  externalSearchQuery = '',
  hasExternalFilters = false,
  onClearExternalFilters,
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
  const [statusManagerColumnKey, setStatusManagerColumnKey] = useState(null)
  const [rowUpdateDetails, setRowUpdateDetails] = useState(null)
  const [viewMode, setViewMode] = useState(initialViewMode)
  const [kanbanEditorRowId, setKanbanEditorRowId] = useState(null)
  const [draggingId, setDraggingId] = useState(null)
  const [draggingColumnKey, setDraggingColumnKey] = useState(null)
  const [draggingGroupLabel, setDraggingGroupLabel] = useState(null)
  const [groupByKey, setGroupByKey] = useState(initialGroupByKey || columns.find((column) => column.key === 'category')?.key || '')
  const [secondaryGroupByKey, setSecondaryGroupByKey] = useState(initialSecondaryGroupByKey)
  const [sortConfig, setSortConfig] = useState(initialSortConfig)
  const [groupedSectionCollapsedByField, setGroupedSectionCollapsedByField] = useState(initialGroupedSectionCollapsedByField)
  const [groupedSectionOrderByField, setGroupedSectionOrderByField] = useState(initialGroupedSectionOrderByField)
  const [groupedSectionColorByField, setGroupedSectionColorByField] = useState(initialGroupedSectionColorByField)
  const [openKanbanConfig, setOpenKanbanConfig] = useState(false)
  const [openGanttConfig, setOpenGanttConfig] = useState(false)
  const [openColumnVisibility, setOpenColumnVisibility] = useState(false)
  const [openConditionalFormatting, setOpenConditionalFormatting] = useState(false)
  const [conditionalFormattingRules, setConditionalFormattingRules] = useState(initialConditionalFormattingRules)
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
  const clearAllTableFilters = useCallback(() => {
    setFilters([])
    setColumnFilterSearch({})
    setOpenColumnMenu(null)
    setColumnMenuStyle(null)
    onClearExternalFilters?.()
  }, [onClearExternalFilters])

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
    setSecondaryGroupByKey((current) => {
      const nextKey = initialSecondaryGroupByKey || ''
      if (nextKey === groupByKey) return ''
      if (nextKey && !columns.some((column) => column.key === nextKey)) return ''
      if (current === nextKey) return current
      return nextKey
    })
  }, [columns, groupByKey, initialSecondaryGroupByKey])

  useEffect(() => {
    setSortConfig((current) => {
      const nextConfig = initialSortConfig || null
      if (!nextConfig?.columnKey) return null
      if (!columns.some((column) => column.key === nextConfig.columnKey)) return null
      if (
        current?.columnKey === nextConfig.columnKey &&
        current?.direction === nextConfig.direction
      ) {
        return current
      }
      return nextConfig
    })
  }, [columns, initialSortConfig])

  useEffect(() => {
    setGroupedSectionCollapsedByField(initialGroupedSectionCollapsedByField)
  }, [initialGroupedSectionCollapsedByField])

  useEffect(() => {
    setGroupedSectionOrderByField(initialGroupedSectionOrderByField)
  }, [initialGroupedSectionOrderByField])

  useEffect(() => {
    setGroupedSectionColorByField(initialGroupedSectionColorByField)
  }, [initialGroupedSectionColorByField])

  useEffect(() => {
    setKanbanCollapsedLaneIdsByField(initialKanbanCollapsedLaneIdsByField)
  }, [initialKanbanCollapsedLaneIdsByField])

  useEffect(() => {
    setConditionalFormattingRules(initialConditionalFormattingRules)
  }, [initialConditionalFormattingRules])

  useEffect(() => {
    if (!clearFiltersToken) return
    clearAllTableFilters()
  }, [clearAllTableFilters, clearFiltersToken])

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

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [openColumnMenu, openColumnVisibility, openKanbanConfig, openGanttConfig, showAddColumnForm])

  useEffect(() => {
    if (!openColumnMenu) return

    function handleViewportChange(event) {
      const target = event?.target
      if (target instanceof Element && target.closest('[data-column-menu]')) {
        return
      }

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

  useEffect(() => {
    if (!statusManagerColumnKey) return

    const targetColumn = boardColumns.find((column) => column.key === statusManagerColumnKey)
    if (!targetColumn || targetColumn.type !== 'status') {
      setStatusManagerColumnKey(null)
    }
  }, [boardColumns, statusManagerColumnKey])

  useEffect(() => {
    if (!statusManagerColumnKey) return

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setStatusManagerColumnKey(null)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [statusManagerColumnKey])

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
    const normalizedExternalQuery = normalizeSearchValue(externalSearchQuery)

    return boardRows.filter((row) => {
      const matchesColumnFilters = filters.every((filter) => {
        const column = boardColumns.find((item) => item.key === filter.columnKey)
        if (!column) return true

        if (!filter.values?.length) return true

        const { token } = getFilterOption(row[filter.columnKey], column.type)
        return filter.values.includes(token)
      })

      if (!matchesColumnFilters) return false
      if (!normalizedExternalQuery) return true

      return boardColumns.some((column) =>
        normalizeSearchValue(row?.[column.key]).includes(normalizedExternalQuery),
      )
    })
  }, [boardColumns, boardRows, externalSearchQuery, filters])
  const sortedRows = useMemo(() => {
    if (!sortConfig?.columnKey || !sortConfig?.direction) return filteredRows

    const targetColumn = boardColumns.find((column) => column.key === sortConfig.columnKey)
    if (!targetColumn) return filteredRows

    const directionMultiplier = sortConfig.direction === 'desc' ? -1 : 1

    return [...filteredRows].sort((leftRow, rightRow) => {
      const leftValue = leftRow[sortConfig.columnKey]
      const rightValue = rightRow[sortConfig.columnKey]

      const leftComparable = getComparableValue(leftValue, targetColumn)
      const rightComparable = getComparableValue(rightValue, targetColumn)

      const leftEmpty = leftComparable == null || leftComparable === ''
      const rightEmpty = rightComparable == null || rightComparable === ''

      if (leftEmpty && rightEmpty) return 0
      if (leftEmpty) return 1
      if (rightEmpty) return -1

      if (typeof leftComparable === 'number' && typeof rightComparable === 'number') {
        return (leftComparable - rightComparable) * directionMultiplier
      }

      if (typeof leftComparable === 'boolean' && typeof rightComparable === 'boolean') {
        if (leftComparable === rightComparable) return 0
        return (leftComparable ? 1 : -1) * directionMultiplier
      }

      return String(leftComparable).localeCompare(String(rightComparable), undefined, {
        numeric: true,
        sensitivity: 'base',
      }) * directionMultiplier
    })
  }, [boardColumns, filteredRows, sortConfig])
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
  const tableGroupingOptions = useMemo(
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
    const nextGroups = groupRowsByKey(sortedRows, groupByKey).map((group) => ({
      ...group,
      children:
        secondaryGroupByKey && secondaryGroupByKey !== groupByKey
          ? groupRowsByKey(group.items, secondaryGroupByKey)
          : [],
    }))
    const preferredOrder = groupedSectionOrderByField[groupByKey] || []
    const orderIndex = new Map(preferredOrder.map((label, index) => [label, index]))

    return nextGroups.sort((left, right) => {
      const leftIndex = orderIndex.has(left.label) ? orderIndex.get(left.label) : Number.MAX_SAFE_INTEGER
      const rightIndex = orderIndex.has(right.label) ? orderIndex.get(right.label) : Number.MAX_SAFE_INTEGER
      if (leftIndex !== rightIndex) return leftIndex - rightIndex
      return 0
    })
  }, [groupByKey, groupedSectionOrderByField, secondaryGroupByKey, sortedRows])
  const allGroupLabels = useMemo(
    () => (groupByKey ? groupRowsByKey(boardRows, groupByKey).map((group) => group.label) : []),
    [boardRows, groupByKey],
  )
  const nestedGroupFieldKey = useMemo(
    () =>
      groupByKey && secondaryGroupByKey && secondaryGroupByKey !== groupByKey
        ? getNestedGroupCollapseKey(groupByKey, secondaryGroupByKey)
        : '',
    [groupByKey, secondaryGroupByKey],
  )
  const allNestedGroupLabels = useMemo(() => {
    if (!nestedGroupFieldKey) return []

    return groupRowsByKey(boardRows, groupByKey).flatMap((group) =>
      groupRowsByKey(group.items, secondaryGroupByKey).map((childGroup) =>
        getNestedGroupCollapseKey(group.label, childGroup.label),
      ),
    )
  }, [boardRows, groupByKey, nestedGroupFieldKey, secondaryGroupByKey])
  const textSizeClasses = useMemo(() => getTextSizeClasses(textSize), [textSize])
  const kanbanTextSizeClasses = useMemo(() => getKanbanTextSizeClasses(textSize), [textSize])
  const visibleRowIds = useMemo(() => new Set(boardRows.map((row) => row.id)), [boardRows])
  const collapsedGroupLabels = useMemo(
    () => groupedSectionCollapsedByField[groupByKey] || [],
    [groupByKey, groupedSectionCollapsedByField],
  )
  const groupedSectionOrder = useMemo(
    () => groupedSectionOrderByField[groupByKey] || [],
    [groupByKey, groupedSectionOrderByField],
  )
  const groupedSectionColors = useMemo(
    () => groupedSectionColorByField[groupByKey] || {},
    [groupByKey, groupedSectionColorByField],
  )
  const nestedGroupedSectionColors = useMemo(
    () => (nestedGroupFieldKey ? groupedSectionColorByField[nestedGroupFieldKey] || {} : {}),
    [groupedSectionColorByField, nestedGroupFieldKey],
  )
  const collapsedNestedGroupLabels = useMemo(
    () => (nestedGroupFieldKey ? groupedSectionCollapsedByField[nestedGroupFieldKey] || [] : []),
    [groupedSectionCollapsedByField, nestedGroupFieldKey],
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
      if (!onViewConfigChange) return
      onViewConfigChange(updates)
    },
    [onViewConfigChange],
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

    const validLabels = new Set(allGroupLabels)
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
  }, [allGroupLabels, groupByKey, groupedSectionCollapsedByField, persistViewConfig])

  useEffect(() => {
    if (!nestedGroupFieldKey) return

    const validLabels = new Set(allNestedGroupLabels)
    const currentCollapsed = groupedSectionCollapsedByField[nestedGroupFieldKey] || []
    const nextCollapsed = currentCollapsed.filter((label) => validLabels.has(label))

    if (nextCollapsed.length === currentCollapsed.length) return

    setGroupedSectionCollapsedByField((current) => {
      const nextValue = {
        ...current,
        [nestedGroupFieldKey]: nextCollapsed,
      }

      persistViewConfig({ groupedSectionCollapsedByField: nextValue })

      return nextValue
    })
  }, [allNestedGroupLabels, groupedSectionCollapsedByField, nestedGroupFieldKey, persistViewConfig])

  useEffect(() => {
    if (!groupByKey) return

    const validLabels = new Set(allGroupLabels)
    const currentOrder = groupedSectionOrderByField[groupByKey] || []
    const nextOrder = [
      ...currentOrder.filter((label) => validLabels.has(label)),
      ...allGroupLabels.filter((label) => !currentOrder.includes(label)),
    ]

    if (
      nextOrder.length === currentOrder.length &&
      nextOrder.every((label, index) => label === currentOrder[index])
    ) {
      return
    }

    setGroupedSectionOrderByField((current) => {
      const nextValue = {
        ...current,
        [groupByKey]: nextOrder,
      }

      persistViewConfig({ groupedSectionOrderByField: nextValue })

      return nextValue
    })
  }, [allGroupLabels, groupByKey, groupedSectionOrderByField, persistViewConfig])

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
      const nextRows = applyRowUpdateHistory(
        currentRows,
        currentRows.map((row) => (row.id === rowId ? { ...row, [columnKey]: value } : row)),
        boardColumns,
        currentUser,
      )
      pushBoardChange(boardColumns, nextRows)
      return nextRows
    })
  }, [boardColumns, currentUser, pushBoardChange])

  const updateRowValues = useCallback(
    (rowId, updates) => {
      setBoardRows((currentRows) => {
        const nextRows = applyRowUpdateHistory(
          currentRows,
          currentRows.map((row) => (row.id === rowId ? { ...row, ...updates } : row)),
          boardColumns,
          currentUser,
        )
        pushBoardChange(boardColumns, nextRows)
        return nextRows
      })
    },
    [boardColumns, currentUser, pushBoardChange],
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
      const nextRows = [{ id: createRowId(), ...rowValues }, ...currentRows]
      pushBoardChange(boardColumns, nextRows)
      return nextRows
    })
  }, [boardColumns, nextItemNumber, pushBoardChange])

  const addGroupedRow = useCallback(
    (groupValue, secondaryGroupValue = null) => {
      const rowValues = boardColumns.reduce((accumulator, column) => {
        if (column.key === groupByKey) {
          accumulator[column.key] = getGroupedRowValue(groupValue)
          return accumulator
        }

        if (secondaryGroupValue != null && column.key === secondaryGroupByKey) {
          accumulator[column.key] = getGroupedRowValue(secondaryGroupValue)
          return accumulator
        }

        accumulator[column.key] = ''
        return accumulator
      }, {})

      setBoardRows((currentRows) => {
        const newRow = { id: createRowId(), ...rowValues }
        const normalizedGroupValue = getGroupedRowValue(groupValue)
        const normalizedSecondaryGroupValue = secondaryGroupValue == null ? null : getGroupedRowValue(secondaryGroupValue)
        const insertionIndex = currentRows.findIndex((row) => {
          const primaryMatches = String(row[groupByKey] || '') === String(normalizedGroupValue || '')
          if (!primaryMatches) return false
          if (normalizedSecondaryGroupValue == null || !secondaryGroupByKey) return true
          return String(row[secondaryGroupByKey] || '') === String(normalizedSecondaryGroupValue || '')
        })
        const nextRows =
          insertionIndex === -1
            ? [newRow, ...currentRows]
            : [
                ...currentRows.slice(0, insertionIndex),
                newRow,
                ...currentRows.slice(insertionIndex),
              ]

        pushBoardChange(boardColumns, nextRows)
        return nextRows
      })
    },
    [boardColumns, groupByKey, pushBoardChange, secondaryGroupByKey],
  )

  const addColumn = useCallback(() => {
    if (!canManageColumns) return

    const cleanLabel = newColumn.label.trim()
    if (!cleanLabel) return

    const uniqueKey = `${cleanLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`
    const createdColumn = {
      key: uniqueKey,
      label: cleanLabel,
      type: newColumn.type,
      ...(newColumn.type === 'status'
        ? {
            statusOptions: [...statusOptions],
            statusColors: buildStatusColorMap(statusOptions),
          }
        : {}),
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
  }, [boardColumns, canManageColumns, newColumn, pushBoardChange])

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
              ...(nextType === 'status'
                ? {
                    statusOptions: getStatusOptionsForColumn(column),
                    statusColors: buildStatusColorMap(getStatusOptionsForColumn(column), getStatusColorMap(column)),
                  }
                : {
                    statusOptions: undefined,
                    statusColors: undefined,
                  }),
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
    if (!canManageColumns) return

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
  }, [boardColumns, canManageColumns, groupByKey, kanbanGroupKey, persistViewConfig, pushBoardChange])

  const requestColumnDelete = useCallback(
    (columnKey) => {
      if (!canManageColumns) return

      const targetColumn = boardColumns.find((column) => column.key === columnKey)
      setPendingColumnDelete({
        key: columnKey,
        label: targetColumn?.label || columnKey,
      })
      setOpenColumnMenu(null)
      setColumnMenuStyle(null)
    },
    [boardColumns, canManageColumns],
  )

  const addStatusOption = useCallback(
    (columnKey) => {
      const nextLabel = String(statusDraftByColumn[columnKey] || '').trim()
      if (!nextLabel) return

      const targetColumn = boardColumns.find((column) => column.key === columnKey)
      if (!targetColumn || targetColumn.type !== 'status') return

      const nextOptions = Array.from(new Set([...getStatusOptionsForColumn(targetColumn), nextLabel]))
      const nextColumns = boardColumns.map((column) =>
        column.key === columnKey
          ? {
              ...column,
              statusOptions: nextOptions,
              statusColors: buildStatusColorMap(nextOptions, getStatusColorMap(column)),
            }
          : column,
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
      const currentColors = getStatusColorMap(targetColumn)
      const renamedColors = nextOptions.reduce((accumulator, option, index) => {
        const previousOption = getStatusOptionsForColumn(targetColumn)[index]
        accumulator[option] = currentColors[previousOption] || getDefaultStatusTone(option)
        return accumulator
      }, {})
      const nextColumns = boardColumns.map((column) =>
        column.key === columnKey
          ? {
              ...column,
              statusOptions: Array.from(new Set(nextOptions)),
              statusColors: buildStatusColorMap(Array.from(new Set(nextOptions)), renamedColors),
            }
          : column,
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
        column.key === columnKey
          ? {
              ...column,
              statusOptions: nextOptions,
              statusColors: buildStatusColorMap(nextOptions, getStatusColorMap(column)),
            }
          : column,
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

  const updateStatusColor = useCallback(
    (columnKey, optionLabel, colorClassName) => {
      const targetColumn = boardColumns.find((column) => column.key === columnKey)
      if (!targetColumn || targetColumn.type !== 'status') return

      const nextColumns = boardColumns.map((column) =>
        column.key === columnKey
          ? {
              ...column,
              statusColors: {
                ...getStatusColorMap(column),
                [optionLabel]: colorClassName,
              },
            }
          : column,
      )
      setBoardColumns(nextColumns)
      pushBoardChange(nextColumns, boardRows)
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
        const nextRows = applyRowUpdateHistory(
          currentRows,
          currentRows.map((row) =>
            row.id === draggingId
              ? {
                  ...row,
                  [kanbanColumn.key]: kanbanColumn.type === 'boolean' ? laneValue === true : laneValue,
                }
              : row,
          ),
          boardColumns,
          currentUser,
        )
        pushBoardChange(boardColumns, nextRows)
        return nextRows
      })
      setDraggingId(null)
    },
    [boardColumns, currentUser, draggingId, kanbanColumn, pushBoardChange, readOnly],
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
      const nextSecondaryGroupByKey = nextKey && secondaryGroupByKey === nextKey ? '' : secondaryGroupByKey
      if (nextSecondaryGroupByKey !== secondaryGroupByKey) {
        setSecondaryGroupByKey('')
      }
      persistViewConfig({
        groupByKey: nextKey,
        secondaryGroupByKey: nextSecondaryGroupByKey,
      })
    },
    [persistViewConfig, secondaryGroupByKey],
  )

  const handleSecondaryGroupByChange = useCallback(
    (nextKey) => {
      const normalizedKey = nextKey === groupByKey ? '' : nextKey
      setSecondaryGroupByKey(normalizedKey)
      persistViewConfig({ secondaryGroupByKey: normalizedKey })
    },
    [groupByKey, persistViewConfig],
  )

  const updateSortPreference = useCallback(
    (nextSortConfig) => {
      const normalizedConfig =
        nextSortConfig?.columnKey && nextSortConfig?.direction
          ? {
              columnKey: nextSortConfig.columnKey,
              direction: nextSortConfig.direction,
            }
          : null

      setSortConfig(normalizedConfig)
      persistViewConfig({ sortConfig: normalizedConfig })
    },
    [persistViewConfig],
  )

  const reorderGroupedSections = useCallback(
    (fromLabel, toLabel) => {
      if (!groupByKey || !fromLabel || !toLabel || fromLabel === toLabel) return

      setGroupedSectionOrderByField((current) => {
        const currentOrder = current[groupByKey]?.length
          ? current[groupByKey]
          : groupedRows.map((group) => group.label)
        const nextOrder = [...currentOrder]
        const fromIndex = nextOrder.indexOf(fromLabel)
        const toIndex = nextOrder.indexOf(toLabel)
        if (fromIndex === -1 || toIndex === -1) return current

        const [movedLabel] = nextOrder.splice(fromIndex, 1)
        nextOrder.splice(toIndex, 0, movedLabel)

        const nextValue = {
          ...current,
          [groupByKey]: nextOrder,
        }

        persistViewConfig({ groupedSectionOrderByField: nextValue })
        return nextValue
      })
    },
    [groupByKey, groupedRows, persistViewConfig],
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
  const toggleNestedGroupedSection = useCallback(
    (parentLabel, childLabel) => {
      if (!nestedGroupFieldKey) return

      const nestedLabel = getNestedGroupCollapseKey(parentLabel, childLabel)

      setGroupedSectionCollapsedByField((current) => {
        const currentLabels = current[nestedGroupFieldKey] || []
        const nextLabels = currentLabels.includes(nestedLabel)
          ? currentLabels.filter((label) => label !== nestedLabel)
          : [...currentLabels, nestedLabel]
        const nextValue = {
          ...current,
          [nestedGroupFieldKey]: nextLabels,
        }

        persistViewConfig({ groupedSectionCollapsedByField: nextValue })

        return nextValue
      })
    },
    [nestedGroupFieldKey, persistViewConfig],
  )

  const cycleGroupedSectionColor = useCallback(
    (fieldKey, sectionLabel) => {
      if (!fieldKey || !sectionLabel) return

      setGroupedSectionColorByField((current) => {
        const currentColorsForField = current[fieldKey] || {}
        const currentColorId = currentColorsForField[sectionLabel] || groupedSectionColorOptions[0].id
        const currentIndex = groupedSectionColorOptions.findIndex((option) => option.id === currentColorId)
        const nextColor = groupedSectionColorOptions[(currentIndex + 1) % groupedSectionColorOptions.length]
        const nextValue = {
          ...current,
          [fieldKey]: {
            ...currentColorsForField,
            [sectionLabel]: nextColor.id,
          },
        }

        persistViewConfig({ groupedSectionColorByField: nextValue })

        return nextValue
      })
    },
    [persistViewConfig],
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
      if (rowUpdateDetails?.rowId === rowId) {
        setRowUpdateDetails(null)
      }
      pushBoardChange(boardColumns, nextRows)
    },
    [activeCell?.rowId, boardColumns, boardRows, kanbanEditorRowId, pushBoardChange, rowUpdateDetails?.rowId],
  )

  const handleTextSizeChange = useCallback(
    (nextSize) => {
      setTextSize(nextSize)
      persistViewConfig({ textSize: nextSize })
    },
    [persistViewConfig],
  )

  const updateConditionalFormattingRules = useCallback(
    (updater) => {
      setConditionalFormattingRules((current) => {
        const nextRules = typeof updater === 'function' ? updater(current) : updater
        persistViewConfig({ conditionalFormattingRules: nextRules })
        return nextRules
      })
    },
    [persistViewConfig],
  )

  const addConditionalFormattingRule = useCallback(() => {
    const fallbackColumnKey = boardColumns[0]?.key || ''
    if (!fallbackColumnKey) return

    updateConditionalFormattingRules((current) => [
      ...current,
      {
        id: createConditionalRuleId(),
        columnKey: fallbackColumnKey,
        operator: 'equals',
        value: '',
        secondaryValue: '',
        textColor: '',
        backgroundColor: '',
        fontFamily: '',
        bold: false,
      },
    ])
  }, [boardColumns, updateConditionalFormattingRules])

  const patchConditionalFormattingRule = useCallback(
    (ruleId, updates) => {
      updateConditionalFormattingRules((current) =>
        current.map((rule) => (rule.id === ruleId ? { ...rule, ...updates } : rule)),
      )
    },
    [updateConditionalFormattingRules],
  )

  const removeConditionalFormattingRule = useCallback(
    (ruleId) => {
      updateConditionalFormattingRules((current) => current.filter((rule) => rule.id !== ruleId))
    },
    [updateConditionalFormattingRules],
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
          {canManageColumns && showAddColumnForm ? (
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
                {canManageColumns && (
                  <button
                    type="button"
                    data-add-column-trigger
                    className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 shadow-soft transition hover:-translate-y-0.5 hover:bg-slate-50 active:translate-y-0"
                    onClick={() => setShowAddColumnForm(true)}
                  >
                    + Add column
                  </button>
                )}
                <button
                  type="button"
                  className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 shadow-soft transition hover:-translate-y-0.5 hover:bg-slate-50 active:translate-y-0"
                  onClick={addRow}
                >
                  + Add new row
                </button>
              </>
            )}

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
          <div className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Rows</span>
            <span>
              {filteredRows.length === boardRows.length
                ? boardRows.length
                : `${filteredRows.length} of ${boardRows.length}`}
            </span>
          </div>
          {(filters.length > 0 || hasExternalFilters) && (
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
              onClick={clearAllTableFilters}
            >
              <FilterX size={14} />
              Clear filters
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                {filters.length + (hasExternalFilters ? 1 : 0)}
              </span>
            </button>
          )}
          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            onClick={() => setOpenConditionalFormatting(true)}
          >
            <Palette size={14} />
            Format rules
            {conditionalFormattingRules.length > 0 && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                {conditionalFormattingRules.length}
              </span>
            )}
          </button>
          {viewMode === 'table' && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Group by</span>
                <select
                  className="max-w-[8.5rem] bg-transparent text-xs text-slate-700 outline-none"
                  value={groupByKey}
                  onChange={(event) => handleGroupByChange(event.target.value)}
                >
                  <option value="">None</option>
                  {tableGroupingOptions.map((column) => (
                    <option key={column.key} value={column.key}>
                      {column.label}
                    </option>
                  ))}
                </select>
              </div>

              {groupByKey && (
                <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Then by</span>
                  <select
                    className="max-w-[8.5rem] bg-transparent text-xs text-slate-700 outline-none"
                    value={secondaryGroupByKey}
                    onChange={(event) => handleSecondaryGroupByChange(event.target.value)}
                  >
                    <option value="">None</option>
                    {tableGroupingOptions
                      .filter((column) => column.key !== groupByKey)
                      .map((column) => (
                        <option key={column.key} value={column.key}>
                          {column.label}
                        </option>
                      ))}
                  </select>
                </div>
              )}

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

      {openConditionalFormatting && (
        <ConditionalFormattingModal
          columns={boardColumns}
          rules={conditionalFormattingRules}
          onAddRule={addConditionalFormattingRule}
          onClose={() => setOpenConditionalFormatting(false)}
          onPatchRule={patchConditionalFormattingRule}
          onRemoveRule={removeConditionalFormattingRule}
        />
      )}

      {rowUpdateDetails && (
        <RowUpdateDetailsModal
          rowName={rowUpdateDetails.rowName}
          updates={rowUpdateDetails.updates}
          onClose={() => setRowUpdateDetails(null)}
        />
      )}

      <div className="transition-all duration-300">
        {filteredRows.length === 0 ? (
          <EmptyState onClearFilters={clearAllTableFilters} />
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
            openStatusManager={setStatusManagerColumnKey}
            requestColumnDelete={requestColumnDelete}
            reorderColumns={reorderColumns}
            resizeColumn={resizeColumn}
            draggingColumnKey={draggingColumnKey}
            setDraggingColumnKey={setDraggingColumnKey}
            setActiveCell={setActiveCell}
            updateCell={updateCell}
            deleteRow={deleteRow}
            readOnly={readOnly}
            canManageColumns={canManageColumns}
            textSize={textSize}
            textSizeClasses={textSizeClasses}
            collapsedGroupLabels={collapsedGroupLabels}
            groupedSectionOrder={groupedSectionOrder}
            groupByKey={groupByKey}
            groupedSectionColors={groupedSectionColors}
            nestedGroupFieldKey={nestedGroupFieldKey}
            nestedGroupedSectionColors={nestedGroupedSectionColors}
            draggingGroupLabel={draggingGroupLabel}
            setDraggingGroupLabel={setDraggingGroupLabel}
            secondaryGroupByKey={secondaryGroupByKey}
            secondaryGroupByLabel={
              tableGroupingOptions.find((column) => column.key === secondaryGroupByKey)?.label || ''
            }
            toggleGroupedSection={toggleGroupedSection}
            collapsedNestedGroupLabels={collapsedNestedGroupLabels}
            toggleNestedGroupedSection={toggleNestedGroupedSection}
            cycleGroupedSectionColor={cycleGroupedSectionColor}
            reorderGroupedSections={reorderGroupedSections}
            onAddRowToGroup={addGroupedRow}
            conditionalFormattingRules={conditionalFormattingRules}
            sortConfig={sortConfig}
            onSortColumn={updateSortPreference}
            onOpenRowUpdates={(row) =>
              setRowUpdateDetails({
                rowId: row.id,
                rowName: row.name || 'Row update',
                updates: Array.isArray(row.__pulseUpdates) ? row.__pulseUpdates : [],
              })
            }
          />
        ) : viewMode === 'table' ? (
          <TableView
            menuScope="table"
            boardColumns={boardColumns}
            visibleColumns={visibleColumns}
            filteredRows={sortedRows}
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
            canManageColumns={canManageColumns}
            textSize={textSize}
            textSizeClasses={textSizeClasses}
            conditionalFormattingRules={conditionalFormattingRules}
            sortConfig={sortConfig}
            onSortColumn={updateSortPreference}
            onOpenRowUpdates={(row) =>
              setRowUpdateDetails({
                rowId: row.id,
                rowName: row.name || 'Row update',
                updates: Array.isArray(row.__pulseUpdates) ? row.__pulseUpdates : [],
              })
            }
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
            rows={sortedRows}
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

      {statusManagerColumnKey && (
        <StatusManagerModal
          column={boardColumns.find((entry) => entry.key === statusManagerColumnKey) || null}
          statusDraftValue={statusDraftByColumn[statusManagerColumnKey] || ''}
          setStatusDraftValue={(nextValue) =>
            setStatusDraftByColumn((current) => ({
              ...current,
              [statusManagerColumnKey]: nextValue,
            }))
          }
          onClose={() => setStatusManagerColumnKey(null)}
          onAddStatus={() => addStatusOption(statusManagerColumnKey)}
          onRenameStatus={(option) => renameStatusOption(statusManagerColumnKey, option)}
          onDeleteStatus={(option) => deleteStatusOption(statusManagerColumnKey, option)}
          onUpdateStatusColor={(option, colorClassName) =>
            updateStatusColor(statusManagerColumnKey, option, colorClassName)
          }
        />
      )}
    </div>
  )
}

function HorizontalScrollFrame({
  children,
  outerClassName = '',
  scrollerClassName = '',
  stickyTopOffset = APP_STICKY_TOP_OFFSET,
  stickyZIndex = 12,
}) {
  const topScrollRef = useRef(null)
  const headerScrollRef = useRef(null)
  const bodyScrollRef = useRef(null)
  const syncSourceRef = useRef(null)
  const [scrollMetrics, setScrollMetrics] = useState({ clientWidth: 0, scrollWidth: 0 })

  useEffect(() => {
    const bodyElement = bodyScrollRef.current
    if (!bodyElement) return

    function syncMetrics() {
      setScrollMetrics({
        clientWidth: bodyElement.clientWidth,
        scrollWidth: bodyElement.scrollWidth,
      })
    }

    syncMetrics()

    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => {
            syncMetrics()
          })

    resizeObserver?.observe(bodyElement)
    if (bodyElement.firstElementChild) {
      resizeObserver?.observe(bodyElement.firstElementChild)
    }

    window.addEventListener('resize', syncMetrics)

    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener('resize', syncMetrics)
    }
  }, [children])

  const showTopScrollbar = scrollMetrics.scrollWidth > scrollMetrics.clientWidth + 1

  function syncScroll(sourceElement, scrollLeft) {
    if (syncSourceRef.current && syncSourceRef.current !== sourceElement) return

    syncSourceRef.current = sourceElement
    ;[topScrollRef.current, headerScrollRef.current, bodyScrollRef.current].forEach((element) => {
      if (!element || element === sourceElement) return
      element.scrollLeft = scrollLeft
    })
    requestAnimationFrame(() => {
      syncSourceRef.current = null
    })
  }

  return (
    <div className={outerClassName}>
      {showTopScrollbar && (
        <div
          ref={topScrollRef}
          className="sticky overflow-x-auto overflow-y-hidden border-b border-slate-200 bg-slate-50 shadow-[0_1px_0_rgba(148,163,184,0.18)]"
          style={{ top: stickyTopOffset, zIndex: stickyZIndex + 1 }}
          onScroll={(event) => syncScroll(topScrollRef.current, event.currentTarget.scrollLeft)}
        >
          <div style={{ width: scrollMetrics.scrollWidth, height: 16 }} />
        </div>
      )}
      {children({ headerScrollRef, bodyScrollRef, onSyncScroll: syncScroll, scrollerClassName, showTopScrollbar })}
    </div>
  )
}

const TableView = memo(function TableView({
  menuScope = 'table',
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
  openStatusManager,
  requestColumnDelete,
  reorderColumns,
  resizeColumn,
  draggingColumnKey,
  setDraggingColumnKey,
  setActiveCell,
  updateCell,
  deleteRow,
  readOnly,
  canManageColumns,
  textSize,
  textSizeClasses,
  conditionalFormattingRules,
  sortConfig,
  onSortColumn,
  onOpenRowUpdates,
  stickyTopOffset = APP_STICKY_TOP_OFFSET,
  stickyZIndex = 12,
}) {
  const columnFilters = useMemo(
    () =>
      visibleColumns.reduce((accumulator, column) => {
        accumulator[column.key] = filters.find((filter) => filter.columnKey === column.key) || null
        return accumulator
      }, {}),
    [filters, visibleColumns],
  )
  const tableColumnsWidth = useMemo(
    () =>
      visibleColumns.reduce((totalWidth, column) => totalWidth + (column.minWidth || 140), readOnly ? 0 : ACTION_COLUMN_WIDTH),
    [readOnly, visibleColumns],
  )
  const tableLayoutStyle = useMemo(
    () => ({
      width: tableColumnsWidth,
      minWidth: '100%',
      tableLayout: 'fixed',
    }),
    [tableColumnsWidth],
  )

  function renderColumnWidths() {
    return (
      <colgroup>
        {visibleColumns.map((column) => {
          const columnWidth = column.minWidth || 140

          return <col key={column.key} style={{ width: columnWidth, minWidth: columnWidth }} />
        })}
        {!readOnly && <col style={{ width: ACTION_COLUMN_WIDTH, minWidth: ACTION_COLUMN_WIDTH }} />}
      </colgroup>
    )
  }

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

  function renderHeaderCells() {
    return (
      <>
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
            style={{ width: column.minWidth || 140, minWidth: column.minWidth || 140, backgroundColor: 'var(--app-bg-soft)' }}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={`line-clamp-2 whitespace-normal break-words leading-tight ${draggingColumnKey === column.key ? 'opacity-40' : ''}`}
              >
                {column.label}
                {sortConfig?.columnKey === column.key ? (
                  <span className="ml-1 inline-block text-[10px] text-slate-400">
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                ) : null}
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
                          {canManageColumns && (
                            <button
                              type="button"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 hover:text-rose-700"
                              onClick={() => requestColumnDelete(column.key)}
                              aria-label={`Delete ${column.label}`}
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
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
                      <div className="space-y-2 border-t border-slate-200 px-1 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Sort rows</p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            className={`inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition ${
                              sortConfig?.columnKey === column.key && sortConfig?.direction === 'asc'
                                ? 'border-sky-200 bg-sky-50 text-sky-700'
                                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                            onClick={() => onSortColumn?.({ columnKey: column.key, direction: 'asc' })}
                          >
                            <ArrowUpAZ size={14} />
                            Asc
                          </button>
                          <button
                            type="button"
                            className={`inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition ${
                              sortConfig?.columnKey === column.key && sortConfig?.direction === 'desc'
                                ? 'border-sky-200 bg-sky-50 text-sky-700'
                                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                            onClick={() => onSortColumn?.({ columnKey: column.key, direction: 'desc' })}
                          >
                            <ArrowDownAZ size={14} />
                            Desc
                          </button>
                        </div>
                        {sortConfig?.columnKey === column.key && (
                          <button
                            type="button"
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                            onClick={() => onSortColumn?.(null)}
                          >
                            Clear sort
                          </button>
                        )}
                      </div>
                      {column.type === 'status' && (
                        <div className="mt-2 space-y-2 border-t border-slate-200 px-1 py-2">
                          <button
                            type="button"
                            className="inline-flex w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                            onClick={() => openStatusManager(column.key)}
                          >
                            <span>Manage statuses & colors</span>
                            <span className="text-slate-400">{getStatusOptionsForColumn(column).length}</span>
                          </button>
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
            style={{ width: ACTION_COLUMN_WIDTH, minWidth: ACTION_COLUMN_WIDTH, backgroundColor: 'var(--app-bg-soft)' }}
          >
            Action
          </th>
        )}
      </>
    )
  }

  return (
    <HorizontalScrollFrame
      outerClassName="overflow-visible rounded-xl border border-slate-200 bg-white shadow-soft"
      scrollerClassName="overflow-x-auto overflow-y-visible"
      stickyTopOffset={stickyTopOffset}
      stickyZIndex={stickyZIndex}
    >
      {({ bodyScrollRef, onSyncScroll, scrollerClassName: syncedScrollerClassName }) => {
        return (
          <div
            ref={bodyScrollRef}
            className={syncedScrollerClassName}
            onScroll={(event) => onSyncScroll(bodyScrollRef.current, event.currentTarget.scrollLeft)}
          >
            <table className={`border-collapse ${textSizeClasses.table}`} style={tableLayoutStyle}>
              {renderColumnWidths()}
              <thead className="bg-slate-50">
                <tr>{renderHeaderCells()}</tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id} className="group transition hover:bg-sky-50/40">
                    {visibleColumns.map((column) => {
                      const columnWidth = column.minWidth || 140

                      return (
                      <td
                        key={`${row.id}-${column.key}`}
                        className={`border-b border-r border-slate-200 align-middle last:border-r-0 ${textSizeClasses.cell} ${getConditionalFormattingClassName(
                          conditionalFormattingRules,
                          column,
                          row[column.key],
                        )}`}
                        style={{ width: columnWidth, minWidth: columnWidth }}
                        onClick={() => {
                          if (!readOnly && column.type !== 'updates') {
                            setActiveCell({ rowId: row.id, columnKey: column.key })
                          }
                        }}
                      >
                        {!readOnly && column.type !== 'updates' && isEditing(row.id, column.key) ? (
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
                          <ReadOnlyCell
                            column={column}
                            value={row[column.key]}
                            row={row}
                            textSize={textSize}
                            onOpenUpdates={onOpenRowUpdates}
                          />
                        )}
                      </td>
                      )
                    })}
                    {!readOnly && (
                      <td
                        className={`border-b border-slate-200 px-3 align-middle text-right ${textSizeClasses.cell}`}
                        style={{ width: ACTION_COLUMN_WIDTH, minWidth: ACTION_COLUMN_WIDTH }}
                      >
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
        )
      }}
    </HorizontalScrollFrame>
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
  openStatusManager,
  requestColumnDelete,
  reorderColumns,
  resizeColumn,
  draggingColumnKey,
  setDraggingColumnKey,
  setActiveCell,
  updateCell,
  deleteRow,
  readOnly,
  canManageColumns,
  textSize,
  textSizeClasses,
  collapsedGroupLabels = [],
  groupByKey = '',
  groupedSectionColors = {},
  nestedGroupFieldKey = '',
  nestedGroupedSectionColors = {},
  draggingGroupLabel,
  setDraggingGroupLabel,
  secondaryGroupByKey = '',
  secondaryGroupByLabel = '',
  toggleGroupedSection,
  collapsedNestedGroupLabels = [],
  toggleNestedGroupedSection,
  cycleGroupedSectionColor,
  reorderGroupedSections,
  onAddRowToGroup,
  conditionalFormattingRules,
  sortConfig,
  onSortColumn,
  onOpenRowUpdates,
}) {
  function getSectionColor(colorId) {
    return groupedSectionColorOptions.find((option) => option.id === colorId) || groupedSectionColorOptions[0]
  }

  return (
    <div className="space-y-4">
      {groupedRows.map((group) => {
        const sectionColor = getSectionColor(groupedSectionColors[group.label])

        return (
        <section
          key={group.label}
          className="overflow-visible rounded-xl border border-slate-200 shadow-soft"
          style={{
            backgroundColor: sectionColor.section,
            borderColor: sectionColor.accent,
            boxShadow: `inset 4px 0 0 ${sectionColor.accent}, 0 10px 28px rgba(15, 23, 42, 0.08)`,
          }}
        >
          <div
            className="sticky flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3"
            style={{ top: APP_STICKY_TOP_OFFSET, zIndex: 12, backgroundColor: sectionColor.header }}
          >
            <div
              draggable={groupedRows.length > 1}
              onDragStart={() => setDraggingGroupLabel(group.label)}
              onDragOver={(event) => {
                if (groupedRows.length > 1) event.preventDefault()
              }}
              onDrop={() => reorderGroupedSections(draggingGroupLabel, group.label)}
              onDragEnd={() => setDraggingGroupLabel(null)}
              className={`flex min-w-0 items-start gap-3 rounded-lg px-1 py-1 ${
                groupedRows.length > 1 ? 'cursor-grab active:cursor-grabbing' : ''
              } ${
                draggingGroupLabel === group.label ? 'opacity-50' : ''
              }`}
              title={groupedRows.length > 1 ? 'Drag to reorder sections' : undefined}
            >
              {groupedRows.length > 1 && (
                <span className="mt-0.5 text-slate-400">
                  <GripVertical size={16} />
                </span>
              )}
              <div>
              <p className={`font-semibold text-slate-900 ${textSizeClasses.groupHeaderTitle}`}>{group.label}</p>
              <p className={`text-slate-500 ${textSizeClasses.groupHeaderMeta}`}>{group.items.length} items</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => cycleGroupedSectionColor?.(groupByKey, group.label)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white transition hover:scale-105 hover:border-slate-400"
                aria-label={`Change ${group.label} section color`}
                title="Change section color"
              >
                <span
                  className="h-4 w-4 rounded-full border border-white shadow-sm"
                  style={{ backgroundColor: sectionColor.accent }}
                />
              </button>
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
            secondaryGroupByKey && group.children?.length ? (
              <div className="space-y-2.5 p-2.5">
                {group.children.map((childGroup) => (
                  (() => {
                    const nestedLabel = getNestedGroupCollapseKey(group.label, childGroup.label)
                    const childSectionColor = getSectionColor(nestedGroupedSectionColors[nestedLabel])

                    return (
                  <section
                    key={`${group.label}-${childGroup.label}`}
                    className="overflow-visible rounded-lg border"
                    style={{
                      backgroundColor: childSectionColor.nested,
                      borderColor: childSectionColor.accent,
                      boxShadow: `inset 3px 0 0 ${childSectionColor.accent}`,
                    }}
                  >
                    <div
                      className="sticky flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-3 py-2 backdrop-blur-sm"
                      style={{
                        top: APP_STICKY_TOP_OFFSET + GROUP_SECTION_HEADER_HEIGHT,
                        zIndex: 13,
                        backgroundColor: childSectionColor.header,
                      }}
                    >
                      <div className="min-w-0">
                        <p className={`truncate font-semibold text-slate-900 ${textSizeClasses.groupHeaderTitle}`}>
                          {childGroup.label}
                        </p>
                        <p className={`text-slate-500 ${textSizeClasses.groupHeaderMeta}`}>
                          {childGroup.items.length} items
                          {secondaryGroupByLabel ? ` · ${secondaryGroupByLabel}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => cycleGroupedSectionColor?.(nestedGroupFieldKey, nestedLabel)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 bg-white transition hover:scale-105 hover:border-slate-400"
                          aria-label={`Change ${childGroup.label} subsection color`}
                          title="Change section color"
                        >
                          <span
                            className="h-3.5 w-3.5 rounded-full border border-white shadow-sm"
                            style={{ backgroundColor: childSectionColor.accent }}
                          />
                        </button>
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => onAddRowToGroup(group.label, childGroup.label)}
                            className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            Add item
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleNestedGroupedSection(group.label, childGroup.label)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50"
                          aria-label={
                            collapsedNestedGroupLabels.includes(getNestedGroupCollapseKey(group.label, childGroup.label))
                              ? `Expand ${childGroup.label}`
                              : `Collapse ${childGroup.label}`
                          }
                        >
                          {collapsedNestedGroupLabels.includes(getNestedGroupCollapseKey(group.label, childGroup.label)) ? (
                            <ChevronDown size={14} />
                          ) : (
                            <ChevronUp size={14} />
                          )}
                          {collapsedNestedGroupLabels.includes(getNestedGroupCollapseKey(group.label, childGroup.label))
                            ? 'Expand'
                            : 'Collapse'}
                        </button>
                      </div>
                    </div>
                    {!collapsedNestedGroupLabels.includes(getNestedGroupCollapseKey(group.label, childGroup.label)) ? (
                      <TableView
                        menuScope={`${menuScopePrefix}:${group.label}:${childGroup.label}`}
                        boardColumns={boardColumns}
                        visibleColumns={visibleColumns}
                        filteredRows={childGroup.items}
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
                        openStatusManager={openStatusManager}
                        requestColumnDelete={requestColumnDelete}
                        reorderColumns={reorderColumns}
                        resizeColumn={resizeColumn}
                        draggingColumnKey={draggingColumnKey}
                        setDraggingColumnKey={setDraggingColumnKey}
                        setActiveCell={setActiveCell}
                        updateCell={updateCell}
                        deleteRow={deleteRow}
                        readOnly={readOnly}
                        canManageColumns={canManageColumns}
                        textSize={textSize}
                        textSizeClasses={textSizeClasses}
                        conditionalFormattingRules={conditionalFormattingRules}
                        sortConfig={sortConfig}
                        onSortColumn={onSortColumn}
                        onOpenRowUpdates={onOpenRowUpdates}
                        stickyTopOffset={APP_STICKY_TOP_OFFSET + GROUP_SECTION_HEADER_HEIGHT + SUBGROUP_SECTION_HEADER_HEIGHT}
                        stickyZIndex={14}
                      />
                    ) : (
                      <div className="px-3 py-2 text-xs text-slate-500">
                        {childGroup.items.length} rows hidden in this subsection.
                        {getCurrencySummary(boardColumns, childGroup.items)
                          ? ` · ${getCurrencySummary(boardColumns, childGroup.items)}`
                          : ''}
                      </div>
                    )}
                  </section>
                    )
                  })()
                ))}
              </div>
            ) : (
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
                openStatusManager={openStatusManager}
                requestColumnDelete={requestColumnDelete}
                reorderColumns={reorderColumns}
                resizeColumn={resizeColumn}
                draggingColumnKey={draggingColumnKey}
                setDraggingColumnKey={setDraggingColumnKey}
                setActiveCell={setActiveCell}
                updateCell={updateCell}
                deleteRow={deleteRow}
                readOnly={readOnly}
                canManageColumns={canManageColumns}
                textSize={textSize}
                textSizeClasses={textSizeClasses}
                conditionalFormattingRules={conditionalFormattingRules}
                sortConfig={sortConfig}
                onSortColumn={onSortColumn}
                onOpenRowUpdates={onOpenRowUpdates}
                stickyTopOffset={APP_STICKY_TOP_OFFSET + GROUP_SECTION_HEADER_HEIGHT}
                stickyZIndex={13}
              />
            )
          ) : (
            <div className="px-4 py-3 text-sm text-slate-500">
              {group.items.length} rows hidden in this section.
              {getCurrencySummary(boardColumns, group.items)
                ? ` · ${getCurrencySummary(boardColumns, group.items)}`
                : ''}
            </div>
          )}
        </section>
        )
      })}
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
    .map((row) => {
      const startDate = getValidDate(row[startKey])
      const endDate = getValidDate(row[endKey] || row[startKey])

      if (!startDate || !endDate) return null

      return {
        ...row,
        __ganttStart: row[startKey],
        __ganttEnd: row[endKey] || row[startKey],
        __ganttStartDate: startDate,
        __ganttEndDate: endDate,
        __ganttGroup: ganttGroupByKey ? String(row[ganttGroupByKey] || 'Uncategorized') : '',
      }
    })
    .filter(Boolean)

  if (!itemsWithDates.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-soft">
        Select date columns in Gantt config to generate a timeline from this board.
      </div>
    )
  }

  const startTimestamp = Math.min(...itemsWithDates.map((row) => row.__ganttStartDate.getTime()))
  const endTimestamp = Math.max(...itemsWithDates.map((row) => row.__ganttEndDate.getTime()))
  const totalDays = Math.max(1, Math.round((endTimestamp - startTimestamp) / (1000 * 60 * 60 * 24)) + 1)
  const timelineSegments = getGanttScaleSegments(startTimestamp, endTimestamp, scale)
  const useVerticalLabels = timelineSegments.length > 12 || (scale === 'day' && timelineSegments.length > 8)
  const groupedItems = ganttGroupByKey
    ? itemsWithDates.reduce((accumulator, row) => {
        const label = stringifyCellValue(row.__ganttGroup) || 'Uncategorized'
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
              const startOffset = Math.round((row.__ganttStartDate.getTime() - startTimestamp) / (1000 * 60 * 60 * 24))
              const duration = Math.max(1, Math.round((row.__ganttEndDate.getTime() - row.__ganttStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)

              return (
                <div key={row.id} className="grid gap-2 md:grid-cols-[180px_minmax(0,1fr)] md:items-center lg:grid-cols-[220px_minmax(0,1fr)]">
                  <div
                    onDoubleClick={() => !readOnly && onOpenItemEditor(row.id)}
                    className={readOnly ? '' : 'cursor-pointer'}
                    title={readOnly ? undefined : 'Double-click to edit'}
                  >
                <p className="text-sm font-medium text-slate-900">{stringifyCellValue(row.name) || 'Untitled'}</p>
                <p className="text-xs text-slate-500">
                      {stringifyCellValue(row.owner) || 'Unassigned'} · {stringifyCellValue(row.__ganttStart) || 'No start'} to {stringifyCellValue(row.__ganttEnd) || 'No end'}
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

function ConditionalFormattingModal({ columns, rules, onAddRule, onClose, onPatchRule, onRemoveRule }) {
  return (
    <div
      className="fixed inset-0 z-[92] flex items-center justify-center bg-slate-950/35 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className="max-h-[calc(100vh-2rem)] w-full max-w-5xl overflow-y-auto rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Conditional formatting</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">Style cells based on values</h3>
            <p className="mt-1 text-sm text-slate-600">
              Build saved rules per board view. Match a column value, then set color, weight, or font.
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

        <div className="mt-5 space-y-4">
          {rules.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              No rules yet. Add a rule to highlight values in any column.
            </div>
          ) : (
            rules.map((rule, index) => {
              const selectedColumn = columns.find((column) => column.key === rule.columnKey) || columns[0] || null
              const needsValue = !['is_empty', 'is_not_empty'].includes(rule.operator)
              const needsSecondValue = rule.operator === 'between'

              return (
                <div key={rule.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">Rule {index + 1}</p>
                    <button
                      type="button"
                      onClick={() => onRemoveRule(rule.id)}
                      className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-4">
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Column</span>
                      <select
                        value={rule.columnKey}
                        onChange={(event) => onPatchRule(rule.id, { columnKey: event.target.value })}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-200 transition focus:ring"
                      >
                        {columns.map((column) => (
                          <option key={column.key} value={column.key}>
                            {column.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Condition</span>
                      <select
                        value={rule.operator}
                        onChange={(event) => onPatchRule(rule.id, { operator: event.target.value })}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-200 transition focus:ring"
                      >
                        {conditionalOperatorOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    {needsValue ? (
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Value</span>
                        <input
                          type={selectedColumn?.type === 'number' || selectedColumn?.type === 'currency' ? 'number' : selectedColumn?.type === 'date' ? 'date' : 'text'}
                          value={rule.value || ''}
                          onChange={(event) => onPatchRule(rule.id, { value: event.target.value })}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-200 transition focus:ring"
                          placeholder="Comparison value"
                        />
                      </label>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-500">
                        This condition does not need a value.
                      </div>
                    )}

                    {needsSecondValue ? (
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">And value</span>
                        <input
                          type={selectedColumn?.type === 'number' || selectedColumn?.type === 'currency' ? 'number' : selectedColumn?.type === 'date' ? 'date' : 'text'}
                          value={rule.secondaryValue || ''}
                          onChange={(event) => onPatchRule(rule.id, { secondaryValue: event.target.value })}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-200 transition focus:ring"
                          placeholder="Upper bound"
                        />
                      </label>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-500">
                        Add a second value by using the “Between” operator.
                      </div>
                    )}
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-4">
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Text color</span>
                      <select
                        value={rule.textColor || ''}
                        onChange={(event) => onPatchRule(rule.id, { textColor: event.target.value })}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-200 transition focus:ring"
                      >
                        {conditionalTextColorOptions.map((option) => (
                          <option key={option.value || 'default'} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cell background</span>
                      <select
                        value={rule.backgroundColor || ''}
                        onChange={(event) => onPatchRule(rule.id, { backgroundColor: event.target.value })}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-200 transition focus:ring"
                      >
                        {conditionalBackgroundOptions.map((option) => (
                          <option key={option.value || 'none'} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Font family</span>
                      <select
                        value={rule.fontFamily || ''}
                        onChange={(event) => onPatchRule(rule.id, { fontFamily: event.target.value })}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-sky-200 transition focus:ring"
                      >
                        {conditionalFontFamilyOptions.map((option) => (
                          <option key={option.value || 'default'} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <input
                        type="checkbox"
                        checked={rule.bold === true}
                        onChange={(event) => onPatchRule(rule.id, { bold: event.target.checked })}
                      />
                      <span className="text-sm font-medium text-slate-700">Bold text</span>
                    </label>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onAddRule}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Add rule
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: 'var(--pulse-accent)' }}
          >
            Done
          </button>
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
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{stringifyCellValue(row.name) || 'Kanban item'}</h2>
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
                {column.type === 'updates' ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                    {draft[column.key] ? formatDateTimeValue(draft[column.key]) : 'No updates yet'}
                  </div>
                ) : column.type === 'status' ? (
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
                    value={stringifyCellValue(draft[column.key])}
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
  const commitStateRef = useRef('idle')

  function getInitialDraftValue() {
    if (column.type === 'date' && (value == null || value === '')) {
      return formatDateInputValue(new Date())
    }

    const nextValue = value ?? getDefaultValue(column.type, column)
    if (column.type === 'boolean') return Boolean(nextValue)
    if (column.type === 'number' || column.type === 'currency') return typeof nextValue === 'number' ? nextValue : Number(nextValue) || ''
    return stringifyCellValue(nextValue)
  }

  const [draftValue, setDraftValue] = useState(getInitialDraftValue)

  useEffect(() => {
    commitStateRef.current = 'idle'
    setDraftValue(getInitialDraftValue())
  }, [column, value])

  function commitValue(nextValue = draftValue) {
    if (commitStateRef.current !== 'idle') return

    commitStateRef.current = 'committed'
    onChange(rowId, column.key, nextValue)
    onBlur()
  }

  function cancelEditing() {
    commitStateRef.current = 'cancelled'
    onBlur()
  }

  if (column.type === 'status') {
    return (
      <select
        autoFocus
        className={`w-full rounded-md border border-slate-300 bg-white outline-none ring-sky-200 transition focus:ring ${textSizeClasses.input}`}
        value={draftValue}
        onBlur={() => commitValue(draftValue)}
        onChange={(event) => {
          const nextValue = event.target.value
          setDraftValue(nextValue)
          commitValue(nextValue)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            commitValue(draftValue)
          }
          if (event.key === 'Escape') {
            event.preventDefault()
            cancelEditing()
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
        onBlur={() => commitValue(draftValue)}
        onChange={(event) => {
          const nextValue = event.target.value === 'true'
          setDraftValue(nextValue)
          commitValue(nextValue)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            commitValue(draftValue)
          }
          if (event.key === 'Escape') {
            event.preventDefault()
            cancelEditing()
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
      onBlur={() => commitValue(draftValue)}
      onChange={(event) => {
        const nextValue =
          column.type === 'number' || column.type === 'currency'
            ? event.target.value === ''
              ? ''
              : Number(event.target.value)
            : event.target.value
        setDraftValue(nextValue)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          commitValue(draftValue)
        }
        if (event.key === 'Escape') {
          event.preventDefault()
          cancelEditing()
        }
      }}
    />
  )
}

function ReadOnlyCell({ column, value, row, textSize = 'medium', onOpenUpdates }) {
  const displayValue = formatColumnValue(value, column.type)
  const textClass = textSize === 'large' ? 'text-base' : textSize === 'small' ? 'text-xs' : 'text-sm'
  const wrappedTextClass = `block line-clamp-2 whitespace-normal break-words leading-snug ${textClass}`
  const emailTextClass = `block line-clamp-2 break-all leading-snug ${textClass}`
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
          getStatusTone(displayValue, column)
        }`}
      >
        {displayValue}
      </span>
    )
  }

  if (column.type === 'owner' || column.key === 'owner') {
    return (
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-700 ${ownerBadgeClass}`}>
          {getInitials(displayValue || 'NA')}
        </span>
        <span className={`text-slate-700 ${wrappedTextClass}`}>{displayValue === '—' ? 'Unassigned' : displayValue}</span>
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

  if (column.type === 'updates') {
    if (!value) return <span className={`text-slate-500 ${textClass}`}>No updates yet</span>

    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onOpenUpdates?.(row)
        }}
        className={`inline text-left font-medium text-sky-700 underline decoration-sky-300 underline-offset-2 transition hover:text-sky-900 ${textClass}`}
      >
        {formatDateTimeValue(value)}
      </button>
    )
  }

  if (isMapsColumn(column) || isTrackingColumn(column)) {
    if (!value) return <span className={`text-slate-700 ${textClass}`}>—</span>

    return (
      <a
        href={getColumnLinkUrl(column, displayValue)}
        target="_blank"
        rel="noreferrer"
        className={`inline font-medium text-sky-700 underline decoration-sky-300 underline-offset-2 transition hover:text-sky-900 ${textClass}`}
        onClick={(event) => event.stopPropagation()}
      >
        {displayValue}
      </a>
    )
  }

  if (isEmailColumn(column)) {
    return <span className={`text-slate-700 ${emailTextClass}`}>{displayValue}</span>
  }

  return <span className={`text-slate-700 ${wrappedTextClass}`}>{displayValue}</span>
}

function RowUpdateDetailsModal({ rowName, updates, onClose }) {
  const updateRows = updates.flatMap((entry) =>
    (entry.changes || []).map((change) => ({
      id: `${entry.id}-${change.columnKey}`,
      editedAt: entry.editedAt,
      user: entry.editedByName || entry.editedByEmail || 'Unknown user',
      field: change.columnLabel,
      previousValue: change.previousValue,
      nextValue: change.nextValue,
    })),
  )

  function downloadChangeLog() {
    const header = ['Date', 'User', 'Field', 'Before', 'After']
    const csvRows = updateRows.map((row) => [
      formatDateTimeValue(row.editedAt),
      row.user,
      row.field,
      formatColumnValue(row.previousValue, 'text'),
      formatColumnValue(row.nextValue, 'text'),
    ])
    const csv = [header, ...csvRows].map((row) => row.map(toCsvCell).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const safeRowName = String(rowName || 'row').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

    link.href = url
    link.download = `${safeRowName || 'row'}-change-log.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div
      className="fixed inset-0 z-[94] flex items-center justify-center bg-slate-950/35 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className="max-h-[calc(100vh-2rem)] w-full max-w-5xl overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Latest row updates</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">{rowName}</h3>
            <p className="mt-1 text-sm text-slate-600">
              Review every recorded cell change in a single audit table.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={downloadChangeLog}
              disabled={updateRows.length === 0}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={14} />
              Download CSV
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>

        <div className="max-h-[calc(100vh-11rem)] overflow-y-auto p-5">
          {updateRows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              No edits have been recorded for this row yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">Change log</p>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                  {updateRows.length} changes
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="w-48 border-b border-slate-200 px-4 py-3">Date</th>
                      <th className="w-44 border-b border-slate-200 px-4 py-3">User</th>
                      <th className="w-48 border-b border-slate-200 px-4 py-3">Field</th>
                      <th className="min-w-56 border-b border-slate-200 px-4 py-3">Before</th>
                      <th className="min-w-56 border-b border-slate-200 px-4 py-3">After</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {updateRows.map((row) => (
                      <tr key={row.id} className="align-top transition hover:bg-slate-50">
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDateTimeValue(row.editedAt)}</td>
                        <td className="px-4 py-3 text-slate-600">{row.user}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{row.field}</td>
                        <td className="max-w-sm px-4 py-3 text-slate-600">
                          <span className="block whitespace-pre-wrap break-words">
                            {formatColumnValue(row.previousValue, 'text')}
                          </span>
                        </td>
                        <td className="max-w-sm px-4 py-3 font-medium text-slate-900">
                          <span className="block whitespace-pre-wrap break-words">
                            {formatColumnValue(row.nextValue, 'text')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusManagerModal({
  column,
  statusDraftValue,
  setStatusDraftValue,
  onClose,
  onAddStatus,
  onRenameStatus,
  onDeleteStatus,
  onUpdateStatusColor,
}) {
  if (!column || column.type !== 'status') return null

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/35 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status settings</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">{column.label}</h3>
            <p className="mt-1 text-sm text-slate-500">
              Rename statuses, add new ones, and choose the color shown in the table.
            </p>
          </div>
          <button
            type="button"
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {getStatusOptionsForColumn(column).map((option) => (
            <div key={option} className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusTone(option, column)}`}>
                {option}
              </span>
              <select
                className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none"
                value={getStatusTone(option, column)}
                onChange={(event) => onUpdateStatusColor(option, event.target.value)}
                aria-label={`Color for ${option}`}
              >
                {statusColorOptions.map((colorOption) => (
                  <option key={colorOption.id} value={colorOption.className}>
                    {colorOption.label} color
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="ml-auto rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                onClick={() => onRenameStatus(option)}
              >
                Edit
              </button>
              <button
                type="button"
                className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100 disabled:opacity-40"
                onClick={() => onDeleteStatus(option)}
                disabled={getStatusOptionsForColumn(column).length <= 1}
              >
                Delete
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-slate-200 pt-4">
          <input
            type="text"
            value={statusDraftValue}
            onChange={(event) => setStatusDraftValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                onAddStatus()
              }
            }}
            placeholder="Add status"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none"
          />
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            onClick={onAddStatus}
          >
            <Plus size={14} />
            Add
          </button>
        </div>
      </div>
    </div>
  )
}

export default BoardTable
