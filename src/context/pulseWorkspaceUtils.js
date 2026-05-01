import { defaultSettings } from './pulseWorkspaceConfig'

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

export function createStableId(prefix) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function ensureUniqueSlug(name, existingBoards, excludedBoardId) {
  const baseSlug = slugify(name) || `board-${Date.now()}`
  const existingSlugs = new Set(
    existingBoards.filter((board) => board.id !== excludedBoardId).map((board) => board.slug),
  )

  if (!existingSlugs.has(baseSlug)) return baseSlug

  let suffix = 2
  let nextSlug = `${baseSlug}-${suffix}`
  while (existingSlugs.has(nextSlug)) {
    suffix += 1
    nextSlug = `${baseSlug}-${suffix}`
  }

  return nextSlug
}

export function ensureUniqueItemIds(items = []) {
  const normalizedItems = normalizeBoardItems(items)
  const seenIds = new Set()

  return normalizedItems.map((item) => {
    const nextId = item.id && !seenIds.has(item.id) ? item.id : createStableId('item')
    seenIds.add(nextId)
    return {
      ...item,
      id: nextId,
    }
  })
}

export function normalizeBoardItems(items = []) {
  if (Array.isArray(items)) {
    return items.filter((item) => item && typeof item === 'object' && !Array.isArray(item))
  }

  if (!items || typeof items !== 'object') return []

  const objectValues = Object.values(items)
  if (
    objectValues.length > 0 &&
    objectValues.every((item) => item && typeof item === 'object' && !Array.isArray(item))
  ) {
    return objectValues
  }

  return [items]
}

export function normalizeBoardColumns(columns = []) {
  if (Array.isArray(columns)) {
    return columns.filter((column) => column && typeof column === 'object' && !Array.isArray(column))
  }

  if (!columns || typeof columns !== 'object') return []

  const objectValues = Object.values(columns)
  if (
    objectValues.length > 0 &&
    objectValues.every((column) => column && typeof column === 'object' && !Array.isArray(column))
  ) {
    return objectValues
  }

  return []
}

function parseDateValue(value) {
  if (value == null || value === '') return null

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  const normalizedValue = typeof value === 'string' ? value.trim() : value

  if (typeof normalizedValue === 'string' && DATE_ONLY_PATTERN.test(normalizedValue)) {
    const [year, month, day] = normalizedValue.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  const date = new Date(normalizedValue)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDateKey(value) {
  const date = parseDateValue(value)
  if (!date) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getTimelineValue(item) {
  return item.due_date || item.start_date || item.work_date || item.last_updated || new Date().toISOString()
}

export function getRecentDateKeys(items, totalDays) {
  const latestTimestamp = items.reduce((latest, item) => {
    const current = parseDateValue(getTimelineValue(item))?.getTime() ?? Number.NaN
    return Number.isNaN(current) ? latest : Math.max(latest, current)
  }, Date.now())

  return Array.from({ length: totalDays }, (_, index) => {
    const date = new Date(latestTimestamp)
    date.setDate(date.getDate() - (totalDays - index - 1))
    return formatDateKey(date)
  })
}

export function getRecentWeekKeys(items, totalWeeks) {
  const latestTimestamp = items.reduce((latest, item) => {
    const current = parseDateValue(getTimelineValue(item))?.getTime() ?? Number.NaN
    return Number.isNaN(current) ? latest : Math.max(latest, current)
  }, Date.now())

  return Array.from({ length: totalWeeks }, (_, index) => {
    const date = new Date(latestTimestamp)
    date.setDate(date.getDate() - index * 7)
    const start = new Date(date)
    start.setDate(date.getDate() - date.getDay())
    return formatDateKey(start)
  }).reverse()
}

export function createBoardTemplate(name, slug, preferredView, currentUser) {
  const boardId = createStableId('board')

  return {
    id: boardId,
    slug,
    name,
    description: 'New work board for planning, ownership, and status tracking.',
    preferredView,
    kanbanGroupBy: 'status',
    kanbanCardFields: ['owner', 'due_date', 'priority'],
    ownerUserId: currentUser.id,
    ownerEmail: currentUser.email,
    sharedWith: [],
    columns: [
      { id: `${boardId}-name`, key: 'name', label: 'Task', type: 'text', position: 1, minWidth: 240 },
      { id: `${boardId}-category`, key: 'category', label: 'Category', type: 'text', position: 2, minWidth: 170 },
      { id: `${boardId}-status`, key: 'status', label: 'Status', type: 'status', statusOptions: ['Working on it', 'Stuck', 'Done'], position: 3, minWidth: 160 },
      { id: `${boardId}-start`, key: 'start_date', label: 'Start date', type: 'date', position: 4, minWidth: 150 },
      { id: `${boardId}-due`, key: 'due_date', label: 'Due date', type: 'date', position: 5, minWidth: 150 },
      { id: `${boardId}-owner`, key: 'owner', label: 'Owner', type: 'text', position: 6, minWidth: 180 },
      { id: `${boardId}-priority`, key: 'priority', label: 'Priority', type: 'text', position: 7, minWidth: 140 },
    ],
    items: [
      {
        id: createStableId(`${boardId}-item`),
        name: `${name} kickoff`,
        category: 'General',
        status: 'Working on it',
        start_date: formatDateKey(new Date()),
        due_date: formatDateKey(new Date(Date.now() + 1000 * 60 * 60 * 24 * 5)),
        owner: currentUser.name,
        priority: 'Medium',
      },
    ],
  }
}

export function getBoardPermission(board, currentUserId) {
  if (!board || !currentUserId) return null
  if ((board.deletedFor || []).some((entry) => entry.userId === currentUserId)) return null
  if (board.ownerUserId === currentUserId) return 'owner'
  const sharedEntry = board.sharedWith.find((entry) => entry.userId === currentUserId)
  if (!sharedEntry?.accepted) return null
  return sharedEntry.permission || null
}

export function canAccessBoard(board, currentUserId) {
  return Boolean(getBoardPermission(board, currentUserId))
}

export function hasColumnStructureChanges(currentColumns = [], nextColumns = []) {
  if (currentColumns.length !== nextColumns.length) return true

  const currentKeys = new Set(currentColumns.map((column) => column.key))
  const nextKeys = new Set(nextColumns.map((column) => column.key))

  if (currentKeys.size !== nextKeys.size) return true

  for (const key of currentKeys) {
    if (!nextKeys.has(key)) return true
  }

  return false
}

export function getDefaultGroupByKey(board) {
  return board.columns.find((column) => column.key === 'category')?.key || ''
}

export function mergeSettings(settings) {
  return {
    ...defaultSettings,
    ...(settings || {}),
    boardViews: settings?.boardViews || {},
  }
}

export function mapBoardRecord(record, workspaceUsersById) {
  const owner = workspaceUsersById.get(record.owner_user_id)

  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    description: record.description,
    preferredView: record.preferred_view,
    kanbanGroupBy: record.kanban_group_by,
    kanbanCardFields: record.kanban_card_fields || [],
    ownerUserId: record.owner_user_id,
    ownerEmail: owner?.email || '',
    sharedWith: (record.shared_with || []).map((entry) => ({
      userId: entry.userId,
      email: entry.email || workspaceUsersById.get(entry.userId)?.email || '',
      permission: entry.permission || 'view',
      accepted: entry.accepted === true,
      viewColumns: Array.isArray(entry.viewColumns) ? entry.viewColumns : [],
    })),
    deletedFor: (record.deleted_for || []).map((entry) => ({
      userId: entry.userId,
      deletedAt: entry.deletedAt,
    })),
    deleteAfter: record.delete_after,
    columns: normalizeBoardColumns(record.columns),
    items: ensureUniqueItemIds(record.items || []),
  }
}

export function applyBoardItemRows(boardRecords, itemRows = []) {
  if (!Array.isArray(itemRows) || itemRows.length === 0) return boardRecords

  const activeItemsByBoardId = itemRows.reduce((accumulator, row) => {
    if (!row?.board_id || row.is_deleted === true) return accumulator

    const rowData = row.row_data && typeof row.row_data === 'object' && !Array.isArray(row.row_data)
      ? row.row_data
      : {}
    const item = {
      ...rowData,
      id: row.item_id || rowData.id,
    }

    if (!accumulator.has(row.board_id)) {
      accumulator.set(row.board_id, [])
    }

    accumulator.get(row.board_id).push({
      item,
      position: row.position ?? 0,
      updatedAt: row.updated_at || '',
    })
    return accumulator
  }, new Map())

  return boardRecords.map((board) => {
    const itemEntries = activeItemsByBoardId.get(board.id)
    if (!itemEntries?.length) return board

    return {
      ...board,
      items: ensureUniqueItemIds(
        itemEntries
          .sort((left, right) => {
            if (left.position !== right.position) return left.position - right.position
            return String(left.updatedAt).localeCompare(String(right.updatedAt))
          })
          .map((entry) => entry.item),
      ),
    }
  })
}

export function mapAutomationRecord(record) {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    triggerType: record.trigger_type,
    actionType: record.action_type,
    enabled: record.enabled,
    lastRunAt: record.last_run_at,
    nextRunAt: record.next_run_at,
    config: record.configuration || {},
    targetUserId: record.target_user_id || '',
    createdByUserId: record.created_by_user_id || '',
  }
}

export function automationToRecord(automation, workspaceId, currentUserId) {
  const hasTargetUser = Object.prototype.hasOwnProperty.call(automation, 'targetUserId')

  return {
    id: automation.id,
    workspace_id: workspaceId,
    name: automation.name,
    description: automation.description,
    trigger_type: automation.triggerType,
    action_type: automation.actionType,
    enabled: automation.enabled,
    last_run_at: automation.lastRunAt || null,
    next_run_at: automation.nextRunAt || null,
    configuration: automation.config || {},
    target_user_id: hasTargetUser ? automation.targetUserId || null : currentUserId,
    created_by_user_id: automation.createdByUserId || currentUserId,
  }
}

export function mapNotificationRecord(record) {
  return {
    id: record.id,
    userId: record.user_id,
    title: record.title,
    description: record.description,
    link: record.link,
    type: record.type,
    meta: record.meta || {},
    createdAt: record.created_at,
    read: record.read,
  }
}

export function boardToRecord(board, workspaceId) {
  return {
    id: board.id,
    workspace_id: workspaceId,
    slug: board.slug,
    name: board.name,
    description: board.description || '',
    preferred_view: board.preferredView || 'table',
    kanban_group_by: board.kanbanGroupBy || 'status',
    kanban_card_fields: board.kanbanCardFields || [],
    owner_user_id: board.ownerUserId,
    columns: normalizeBoardColumns(board.columns),
    items: ensureUniqueItemIds(board.items || []),
    shared_with: (board.sharedWith || []).map((entry) => ({
      userId: entry.userId,
      email: entry.email,
      permission: entry.permission,
      accepted: entry.accepted === true,
      viewColumns: Array.isArray(entry.viewColumns) ? entry.viewColumns : [],
    })),
    deleted_for: (board.deletedFor || []).map((entry) => ({
      userId: entry.userId,
      deletedAt: entry.deletedAt,
    })),
    delete_after: board.deleteAfter || null,
  }
}
