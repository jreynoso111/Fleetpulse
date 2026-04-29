import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { initialWorkspace } from '../data/pulseWorkspace'
import { supabase } from '../lib/supabaseClient'
import { accentThemes, defaultSettings } from './pulseWorkspaceConfig'
import {
  applyBoardItemRows,
  automationToRecord,
  boardToRecord,
  canAccessBoard,
  clone,
  createStableId,
  createBoardTemplate,
  ensureUniqueSlug,
  formatDateKey,
  getBoardPermission,
  getDefaultGroupByKey,
  hasColumnStructureChanges,
  getRecentDateKeys,
  getRecentWeekKeys,
  getTimelineValue,
  mapAutomationRecord,
  mapBoardRecord,
  mapNotificationRecord,
  mergeSettings,
} from './pulseWorkspaceUtils'

const PulseWorkspaceContext = createContext(null)
const AUTOMATION_NOTIFICATION_TYPE = 'automation'
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function parseAutomationDate(value) {
  if (value == null || value === '') return null

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  const normalizedValue = typeof value === 'string' ? value.trim() : value
  if (typeof normalizedValue === 'string' && DATE_ONLY_PATTERN.test(normalizedValue)) {
    const [year, month, day] = normalizedValue.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  const parsed = new Date(normalizedValue)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function normalizeAutomationValue(value, columnType) {
  if (value == null || value === '') return null

  if (columnType === 'number' || columnType === 'currency') {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? null : parsed
  }

  if (columnType === 'boolean') {
    return value === true || value === 'true'
  }

  if (columnType === 'date') {
    return parseAutomationDate(value)?.getTime() ?? null
  }

  return String(value).trim().toLowerCase()
}

function getItemStatus(item) {
  return item.status || item.shipment_status || 'Working on it'
}

function getItemDueDate(item) {
  return parseAutomationDate(item.due_date || item.work_date || item.shipping_date)
}

function isDoneItem(item) {
  return getItemStatus(item) === 'Done'
}

function isBlockedItem(item) {
  return getItemStatus(item) === 'Stuck' || item.blocked === true
}

function getCompletionRate(completedItems, totalItems) {
  return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
}

function matchesAutomationRule(item, board, config) {
  const targetColumn = board.columns.find((column) => column.key === config.columnKey)
  if (!targetColumn) return false

  if (config.operator === 'date_passed') {
    const rawValue = item[config.columnKey]
    if (!rawValue) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const valueDate = parseAutomationDate(rawValue)
    if (!valueDate) return false
    valueDate.setHours(0, 0, 0, 0)
    return valueDate.getTime() < today.getTime()
  }

  const left = normalizeAutomationValue(item[config.columnKey], targetColumn.type)
  const right = normalizeAutomationValue(config.value, targetColumn.type)
  const secondary = normalizeAutomationValue(config.secondaryValue, targetColumn.type)

  switch (config.operator) {
    case 'equals':
      return left === right
    case 'not_equals':
      return left !== right
    case 'contains':
      return left != null && String(left).includes(String(right ?? ''))
    case 'greater_than':
      return left != null && right != null && left > right
    case 'less_than':
      return left != null && right != null && left < right
    case 'is_empty':
      return item[config.columnKey] == null || item[config.columnKey] === ''
    case 'is_not_empty':
      return item[config.columnKey] != null && item[config.columnKey] !== ''
    case 'between':
      return left != null && right != null && secondary != null && left >= right && left <= secondary
    default:
      return false
  }
}

function buildAutomationNotificationPayload(automation, board, item) {
  const ruleConfig = automation.config || {}
  const column = board.columns.find((entry) => entry.key === ruleConfig.columnKey)
  const value = column ? item[column.key] : ''
  const signature = [automation.id, board.id, item.id, ruleConfig.columnKey, ruleConfig.operator, String(value)].join('::')

  return {
    title: automation.name,
    description:
      automation.config?.message?.trim() ||
      `${item.name || 'A row'} matched the automation rule on ${board.name}.`,
    link: `/app/boards/${board.slug}`,
    type: AUTOMATION_NOTIFICATION_TYPE,
    meta: {
      automationId: automation.id,
      automationSignature: signature,
      boardId: board.id,
      boardName: board.name,
      rowId: item.id,
      rowName: item.name || '',
      columnKey: ruleConfig.columnKey || '',
      columnLabel: column?.label || '',
      operator: ruleConfig.operator || '',
      value,
    },
  }
}

function normalizeAutomationScheduleTime(value) {
  if (typeof value !== 'string') return '09:00'
  const normalized = value.trim()
  return /^\d{2}:\d{2}$/.test(normalized) ? normalized : '09:00'
}

function getNextAutomationRunAt(scheduleTime, fromValue = new Date()) {
  const baseDate = fromValue instanceof Date ? new Date(fromValue) : new Date(fromValue)
  if (Number.isNaN(baseDate.getTime())) return null

  const [hours, minutes] = normalizeAutomationScheduleTime(scheduleTime).split(':').map(Number)
  const nextRun = new Date(baseDate)
  nextRun.setHours(hours, minutes, 0, 0)

  if (nextRun.getTime() <= baseDate.getTime()) {
    nextRun.setDate(nextRun.getDate() + 1)
  }

  return nextRun.toISOString()
}

function shouldAutomationRunNow(automation, referenceDate = new Date()) {
  const scheduleTime = normalizeAutomationScheduleTime(automation?.config?.scheduleTime)
  const [hours, minutes] = scheduleTime.split(':').map(Number)
  const scheduledDate = new Date(referenceDate)
  scheduledDate.setHours(hours, minutes, 0, 0)

  if (referenceDate.getTime() < scheduledDate.getTime()) return false

  const lastRunAt = automation?.lastRunAt ? new Date(automation.lastRunAt) : null
  if (!lastRunAt || Number.isNaN(lastRunAt.getTime())) return true

  return (
    lastRunAt.getFullYear() !== referenceDate.getFullYear() ||
    lastRunAt.getMonth() !== referenceDate.getMonth() ||
    lastRunAt.getDate() !== referenceDate.getDate()
  )
}

function stripBoardHistoryPreferences(preferences) {
  if (!preferences || typeof preferences !== 'object' || Array.isArray(preferences)) {
    return {}
  }

  const { undoStack, redoStack, ...rest } = preferences
  return rest
}

export function PulseWorkspaceProvider({ children }) {
  const [authReady, setAuthReady] = useState(false)
  const [workspaceLoading, setWorkspaceLoading] = useState(false)
  const [workspaceError, setWorkspaceError] = useState('')
  const [session, setSession] = useState(null)
  const [workspace, setWorkspace] = useState(clone(initialWorkspace.workspace))
  const [currentUserProfile, setCurrentUserProfile] = useState(null)
  const [settings, setSettings] = useState(defaultSettings)
  const [workspaceUsers, setWorkspaceUsers] = useState([])
  const [allBoards, setAllBoards] = useState([])
  const [automations, setAutomations] = useState([])
  const [notifications, setNotifications] = useState([])
  const [boardViewPreferences, setBoardViewPreferences] = useState({})

  const currentUserId = session?.user?.id || ''
  const currentUser = currentUserProfile
    ? {
        ...currentUserProfile,
        preferences: settings,
      }
    : null

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setAuthReady(true)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      setSession(nextSession)
      setAuthReady(true)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const theme = accentThemes[settings.themeAccent] || accentThemes.blue
    document.documentElement.style.setProperty('--pulse-accent', theme.accent)
    document.documentElement.style.setProperty('--pulse-accent-soft', theme.accentSoft)
    document.documentElement.style.setProperty('--pulse-accent-contrast', theme.accentContrast)
    document.documentElement.style.setProperty('--app-bg', theme.appBg)
    document.documentElement.style.setProperty('--app-bg-soft', theme.appBgSoft)
    document.documentElement.style.setProperty('--surface', theme.surface)
    document.documentElement.style.setProperty('--surface-muted', theme.surfaceMuted)
    document.documentElement.style.setProperty('--border-subtle', theme.border)
    document.documentElement.style.setProperty('--text-primary', theme.textPrimary)
    document.documentElement.style.setProperty('--text-secondary', theme.textSecondary)
  }, [settings.themeAccent])

  const loadWorkspaceData = useCallback(async () => {
    if (!session?.user) return

    await supabase.rpc('pulse_purge_expired_boards')

    const [{ data: profile, error: profileError }, { data: preferenceRow, error: preferenceError }] = await Promise.all([
      supabase.from('pulse_profiles').select('*').eq('id', session.user.id).single(),
      supabase.from('pulse_user_preferences').select('*').eq('user_id', session.user.id).maybeSingle(),
    ])

    if (profileError) throw profileError
    if (preferenceError) throw preferenceError

    if (profile.disabled === true) {
      await supabase.auth.signOut()
      throw new Error('This profile has been disabled by an administrator.')
    }

    const [
      { data: workspaceRow, error: workspaceError },
      { data: userRows, error: usersError },
      { data: boardRows, error: boardsError },
      { data: automationRows, error: automationsError },
      { data: notificationRows, error: notificationsError },
      { data: boardPreferenceRows, error: boardPreferencesError },
      { data: boardItemRows, error: boardItemsError },
    ] = await Promise.all([
      supabase.from('pulse_workspaces').select('*').eq('id', profile.workspace_id).single(),
      supabase.from('pulse_profiles').select('*').eq('workspace_id', profile.workspace_id).order('name'),
      supabase.from('pulse_boards').select('*').eq('workspace_id', profile.workspace_id).order('created_at'),
      supabase.from('pulse_automations').select('*').eq('workspace_id', profile.workspace_id).order('created_at'),
      supabase
        .from('pulse_notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false }),
      supabase.from('pulse_board_view_preferences').select('*').eq('user_id', session.user.id),
      supabase
        .from('pulse_board_items')
        .select('*')
        .eq('workspace_id', profile.workspace_id)
        .order('board_id')
        .order('position'),
    ])

    if (workspaceError) throw workspaceError
    if (usersError) throw usersError
    if (boardsError) throw boardsError
    if (automationsError) throw automationsError
    if (notificationsError) throw notificationsError
    if (boardPreferencesError) throw boardPreferencesError
    const shouldUseBoardItemRows = !boardItemsError
    if (boardItemsError && boardItemsError.code !== 'PGRST205') throw boardItemsError

    const usersById = new Map((userRows || []).map((user) => [user.id, user]))
    const mappedBoardRows = (boardRows || []).map((board) => mapBoardRecord(board, usersById))
    const normalizedSettings = mergeSettings(preferenceRow?.settings)
    const rawBoardPreferences = boardPreferenceRows || []
    const sanitizedBoardPreferences = rawBoardPreferences.map((row) => {
      const cleanedPreferences = stripBoardHistoryPreferences(row.preferences)

      return {
        ...row,
        preferences: cleanedPreferences,
        hadHistory:
          Array.isArray(row.preferences?.undoStack) ||
          Array.isArray(row.preferences?.redoStack),
      }
    })

    setWorkspace({
      id: workspaceRow.id,
      name: workspaceRow.name,
      companyName: workspaceRow.company_name,
      supportEmail: workspaceRow.support_email,
      description: workspaceRow.description,
    })
    setCurrentUserProfile({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      disabled: profile.disabled === true,
      mustChangePassword: profile.must_change_password === true,
      workspaceId: profile.workspace_id,
    })
    setSettings(normalizedSettings)
    setWorkspaceUsers(
      (userRows || []).map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        disabled: user.disabled === true,
        mustChangePassword: user.must_change_password === true,
        workspaceId: user.workspace_id,
      })),
    )
    setAllBoards(shouldUseBoardItemRows ? applyBoardItemRows(mappedBoardRows, boardItemRows || []) : mappedBoardRows)
    setAutomations((automationRows || []).map(mapAutomationRecord))
    setNotifications(
      (notificationRows || [])
        .filter((notification) => notification.user_id === session.user.id)
        .map(mapNotificationRecord),
    )
    setBoardViewPreferences(
      Object.fromEntries(sanitizedBoardPreferences.map((row) => [row.board_id, row.preferences || {}])),
    )

    const preferencesWithHistory = sanitizedBoardPreferences.filter((row) => row.hadHistory)
    if (preferencesWithHistory.length > 0) {
      Promise.all(
        preferencesWithHistory.map((row) =>
          supabase.from('pulse_board_view_preferences').upsert({
            user_id: row.user_id,
            board_id: row.board_id,
            preferences: row.preferences,
          }),
        ),
      ).catch((error) => {
        console.error('Failed to prune stored board history preferences.', error)
      })
    }
  }, [session?.user])

  useEffect(() => {
    if (!authReady) return

    if (!session?.user) {
      setWorkspaceLoading(false)
      setWorkspaceError('')
      setCurrentUserProfile(null)
      setWorkspaceUsers([])
      setAllBoards([])
      setAutomations([])
      setNotifications([])
      setBoardViewPreferences({})
      setWorkspace(clone(initialWorkspace.workspace))
      setSettings(defaultSettings)
      return
    }

    let active = true

    async function syncWorkspaceData() {
      setWorkspaceLoading(true)
      setWorkspaceError('')
      await loadWorkspaceData()
      if (!active) return
      setWorkspaceLoading(false)
    }

    syncWorkspaceData().catch((error) => {
      console.error('Failed to load Pulse workspace data.', error)
      if (!active) return
      setWorkspaceLoading(false)
      setWorkspaceError(error instanceof Error ? error.message : 'Unable to load workspace data.')
    })

    return () => {
      active = false
    }
  }, [authReady, session?.user?.id])

  const boards = useMemo(
    () => allBoards.filter((board) => canAccessBoard(board, currentUserId)),
    [allBoards, currentUserId],
  )
  const userNotifications = useMemo(
    () => notifications.filter((notification) => notification.userId === currentUserId),
    [currentUserId, notifications],
  )

  const currentUserNotifications = useMemo(
    () =>
      userNotifications
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()),
    [userNotifications],
  )
  const visibleAutomations = useMemo(
    () =>
      automations.filter(
        (automation) =>
          !automation.targetUserId ||
          automation.targetUserId === currentUserId ||
          automation.createdByUserId === currentUserId,
      ),
    [automations, currentUserId],
  )
  const unreadNotificationsCount = useMemo(
    () => currentUserNotifications.filter((notification) => !notification.read).length,
    [currentUserNotifications],
  )

  const allItems = useMemo(
    () =>
      boards.flatMap((board) =>
        board.items.map((item) => ({
          ...item,
          boardId: board.id,
          boardName: board.name,
          boardSlug: board.slug,
        })),
      ),
    [boards],
  )

  const dashboardData = useMemo(() => {
    const totalItems = allItems.length
    const completedItems = allItems.filter(isDoneItem).length
    const activeItems = allItems.filter((item) => !isDoneItem(item)).length
    const blockedItems = allItems.filter(isBlockedItem).length
    const activeAutomations = visibleAutomations.filter((automation) => automation.enabled).length
    const recentDays = getRecentDateKeys(allItems, 7)
    const recentWeeks = getRecentWeekKeys(allItems, 6)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 7)
    const completionRate = getCompletionRate(completedItems, totalItems)

    const overdueItems = allItems.filter((item) => {
      if (isDoneItem(item)) return false
      const dueDate = getItemDueDate(item)
      if (!dueDate) return false
      dueDate.setHours(0, 0, 0, 0)
      return dueDate < today
    })

    const dueSoonItems = allItems.filter((item) => {
      if (isDoneItem(item)) return false
      const dueDate = getItemDueDate(item)
      if (!dueDate) return false
      dueDate.setHours(0, 0, 0, 0)
      return dueDate >= today && dueDate <= nextWeek
    })
    const overdueItemIds = new Set(overdueItems.map((item) => item.id))
    const dueSoonItemIds = new Set(dueSoonItems.map((item) => item.id))

    const completedByDay = allItems.reduce((accumulator, item) => {
      if (!isDoneItem(item)) return accumulator
      const key = formatDateKey(getTimelineValue(item))
      accumulator[key] = (accumulator[key] || 0) + 1
      return accumulator
    }, {})

    const weeklyThroughput = recentDays.map((dateKey) => ({
      day: new Date(dateKey).toLocaleDateString('en-US', { weekday: 'short' }),
      completed: completedByDay[dateKey] || 0,
    }))

    const countsByWeek = allItems.reduce((accumulator, item) => {
      const date = new Date(getTimelineValue(item))
      if (Number.isNaN(date.getTime())) return accumulator

      const start = new Date(date)
      start.setDate(date.getDate() - date.getDay())
      const weekKey = formatDateKey(start)
      const status = getItemStatus(item)

      if (!accumulator[weekKey]) accumulator[weekKey] = { active: 0, completed: 0 }
      if (status === 'Done') accumulator[weekKey].completed += 1
      else accumulator[weekKey].active += 1
      return accumulator
    }, {})

    const trendData = recentWeeks.map((weekKey, index) => ({
      week: `W${index + 1}`,
      active: countsByWeek[weekKey]?.active || 0,
      completed: countsByWeek[weekKey]?.completed || 0,
    }))

    const totals = allItems.reduce(
      (accumulator, item) => {
        const status = getItemStatus(item)
        accumulator[status] = (accumulator[status] || 0) + 1
        return accumulator
      },
      { Done: 0, 'Working on it': 0, Stuck: 0 },
    )

    const pieData = [
      { name: 'Done', value: totals.Done, color: '#10b981' },
      { name: 'Working on it', value: totals['Working on it'], color: '#f59e0b' },
      { name: 'Stuck', value: totals.Stuck, color: '#ef4444' },
    ].filter((item) => item.value > 0)

    const boardHealth = boards
      .map((board) => {
        const boardItems = board.items || []
        const boardTotal = boardItems.length
        const boardCompleted = boardItems.filter(isDoneItem).length
        const boardBlocked = boardItems.filter(isBlockedItem).length
        const boardOverdue = boardItems.filter((item) => {
          if (isDoneItem(item)) return false
          const dueDate = getItemDueDate(item)
          if (!dueDate) return false
          dueDate.setHours(0, 0, 0, 0)
          return dueDate < today
        }).length
        const boardDueSoon = boardItems.filter((item) => {
          if (isDoneItem(item)) return false
          const dueDate = getItemDueDate(item)
          if (!dueDate) return false
          dueDate.setHours(0, 0, 0, 0)
          return dueDate >= today && dueDate <= nextWeek
        }).length
        const rate = getCompletionRate(boardCompleted, boardTotal)
        const riskScore = boardBlocked * 3 + boardOverdue * 2 + boardDueSoon

        return {
          id: board.id,
          name: board.name,
          slug: board.slug,
          total: boardTotal,
          active: boardTotal - boardCompleted,
          completed: boardCompleted,
          blocked: boardBlocked,
          overdue: boardOverdue,
          dueSoon: boardDueSoon,
          completionRate: rate,
          riskScore,
        }
      })
      .sort((left, right) => right.riskScore - left.riskScore || right.active - left.active)

    const ownerWorkload = Object.values(
      allItems.reduce((accumulator, item) => {
        const owner = item.owner || item.point_of_contact || item.poc || 'Unassigned'
        if (!accumulator[owner]) {
          accumulator[owner] = { owner, active: 0, completed: 0, blocked: 0, overdue: 0 }
        }
        if (isDoneItem(item)) accumulator[owner].completed += 1
        else accumulator[owner].active += 1
        if (isBlockedItem(item)) accumulator[owner].blocked += 1
        if (overdueItemIds.has(item.id)) accumulator[owner].overdue += 1
        return accumulator
      }, {}),
    )
      .sort((left, right) => right.active - left.active || right.blocked - left.blocked)
      .slice(0, 7)

    const priorityItems = allItems
      .filter((item) => !isDoneItem(item) && (isBlockedItem(item) || overdueItemIds.has(item.id) || dueSoonItemIds.has(item.id)))
      .map((item) => {
        const dueDate = getItemDueDate(item)
        const dueTime = dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER
        return {
          ...item,
          status: getItemStatus(item),
          dueDate: dueDate ? formatDateKey(dueDate) : '',
          riskLabel: isBlockedItem(item)
            ? 'Blocked'
            : overdueItemIds.has(item.id)
              ? 'Overdue'
              : 'Due soon',
          riskScore: (isBlockedItem(item) ? 100 : 0) + (overdueItemIds.has(item.id) ? 50 : 0) - dueTime / 100000000,
        }
      })
      .sort((left, right) => right.riskScore - left.riskScore)
      .slice(0, 8)

    const recentCompleted = allItems
      .filter(isDoneItem)
      .map((item) => ({
        ...item,
        completedDate: formatDateKey(getTimelineValue(item)),
      }))
      .sort((left, right) => new Date(right.completedDate).getTime() - new Date(left.completedDate).getTime())
      .slice(0, 5)

    return {
      kpis: [
        { key: 'total-items', label: 'Total items', value: totalItems, helper: `${activeItems} active`, tone: 'text-blue-600' },
        { key: 'completed', label: 'Completion rate', value: `${completionRate}%`, helper: `${completedItems} done`, tone: 'text-emerald-600' },
        { key: 'blocked', label: 'Blocked', value: blockedItems, helper: 'Needs action', tone: 'text-rose-600' },
        { key: 'overdue', label: 'Overdue', value: overdueItems.length, helper: 'Past due date', tone: 'text-orange-600' },
        { key: 'due-soon', label: 'Due this week', value: dueSoonItems.length, helper: 'Next 7 days', tone: 'text-sky-600' },
        { key: 'active-automations', label: 'Active automations', value: activeAutomations, helper: `${visibleAutomations.length} total`, tone: 'text-amber-600' },
      ],
      weeklyThroughput,
      trendData,
      pieData,
      totalItems,
      completedItems,
      activeItems,
      blockedItems,
      overdueItems,
      dueSoonItems,
      activeAutomations,
      completionRate,
      boardHealth,
      ownerWorkload,
      priorityItems,
      recentCompleted,
    }
  }, [allItems, boards, visibleAutomations])

  const shellData = useMemo(
    () => ({
      workspaceName: workspace.name,
      companyName: workspace.companyName,
      supportEmail: workspace.supportEmail,
      notificationsEnabled: settings.notificationsEnabled,
    }),
    [settings.notificationsEnabled, workspace],
  )

  async function updateBoardRecord(board) {
    const { error } = await supabase
      .from('pulse_boards')
      .update(boardToRecord(board, currentUser.workspaceId))
      .eq('id', board.id)

    if (error) throw error

    setAllBoards((current) => current.map((entry) => (entry.id === board.id ? board : entry)))
    return board
  }

  const evaluateNotificationAutomations = useCallback(
    async (candidateAutomations = automations, candidateBoards = boards) => {
      if (!currentUserId) return

      const evaluationTimestamp = new Date()

      const enabledNotificationAutomations = (candidateAutomations || []).filter(
        (automation) =>
          automation.enabled &&
          automation.actionType === 'Notification' &&
          automation.targetUserId === currentUserId &&
          shouldAutomationRunNow(automation, evaluationTimestamp),
      )
      if (enabledNotificationAutomations.length === 0) return

      const existingSignatures = new Set(
        notifications
          .filter((notification) => notification.type === AUTOMATION_NOTIFICATION_TYPE)
          .map((notification) => notification.meta?.automationSignature)
          .filter(Boolean),
      )

      const pendingNotifications = []
      const touchedAutomationIds = new Set()

      enabledNotificationAutomations.forEach((automation) => {
        const scopedBoards =
          automation.config?.boardScope === 'single' && automation.config?.boardId
            ? candidateBoards.filter((board) => board.id === automation.config.boardId)
            : candidateBoards

        scopedBoards.forEach((board) => {
          board.items.forEach((item) => {
            if (!matchesAutomationRule(item, board, automation.config || {})) return

            const nextNotification = buildAutomationNotificationPayload(automation, board, item)
            const signature = nextNotification.meta.automationSignature
            if (existingSignatures.has(signature)) return

            existingSignatures.add(signature)
            pendingNotifications.push({
              user_id: currentUserId,
              ...nextNotification,
            })
            touchedAutomationIds.add(automation.id)
          })
        })
      })

      if (pendingNotifications.length === 0) return

      const timestamp = evaluationTimestamp.toISOString()
      const { data: insertedNotifications, error: insertError } = await supabase
        .from('pulse_notifications')
        .insert(pendingNotifications)
        .select('*')

      if (insertError) throw insertError

      if (touchedAutomationIds.size > 0) {
        const automationIds = Array.from(touchedAutomationIds)
        const touchedAutomations = enabledNotificationAutomations.filter((automation) => touchedAutomationIds.has(automation.id))
        const nextRunAtById = Object.fromEntries(
          touchedAutomations.map((automation) => [
            automation.id,
            getNextAutomationRunAt(automation.config?.scheduleTime, evaluationTimestamp),
          ]),
        )

        await Promise.all(
          automationIds.map((automationId) =>
            supabase
              .from('pulse_automations')
              .update({
                last_run_at: timestamp,
                next_run_at: nextRunAtById[automationId],
              })
              .eq('id', automationId),
          ),
        )
      }

      if (insertedNotifications?.length) {
        setNotifications((current) => [
          ...insertedNotifications.map(mapNotificationRecord),
          ...current,
        ])
      }

      if (touchedAutomationIds.size > 0) {
        const touchedAutomations = enabledNotificationAutomations.filter((automation) => touchedAutomationIds.has(automation.id))
        const nextRunAtById = Object.fromEntries(
          touchedAutomations.map((automation) => [
            automation.id,
            getNextAutomationRunAt(automation.config?.scheduleTime, evaluationTimestamp),
          ]),
        )

        setAutomations((current) =>
          current.map((automation) =>
            touchedAutomationIds.has(automation.id)
              ? {
                  ...automation,
                  lastRunAt: timestamp,
                  nextRunAt: nextRunAtById[automation.id] || automation.nextRunAt,
                }
              : automation,
          ),
        )
      }
    },
    [automations, boards, currentUserId, notifications],
  )

  useEffect(() => {
    if (!currentUserId || !boards.length || !automations.length) return

    evaluateNotificationAutomations().catch((error) => {
      console.error('Failed to evaluate notification automations.', error)
    })
  }, [automations, boards, currentUserId, evaluateNotificationAutomations])

  const persistBoardPreferences = useCallback(
    async (boardId, updater) => {
      if (!currentUserId) throw new Error('No active user session.')

      const previousPreferences = clone(boardViewPreferences)
      const existingPreferences = stripBoardHistoryPreferences(boardViewPreferences[boardId] || {})
      const nextPreferences =
        stripBoardHistoryPreferences(
          typeof updater === 'function' ? updater(existingPreferences) : { ...existingPreferences, ...updater },
        )

      setBoardViewPreferences((current) => ({
        ...current,
        [boardId]: nextPreferences,
      }))

      try {
        const { error } = await supabase.from('pulse_board_view_preferences').upsert({
          user_id: currentUserId,
          board_id: boardId,
          preferences: nextPreferences,
        })

        if (error) throw error
      } catch (error) {
        setBoardViewPreferences(previousPreferences)
        throw error
      }

      return nextPreferences
    },
    [boardViewPreferences, currentUserId],
  )

  const value = useMemo(
    () => ({
      authReady,
      workspaceLoading,
      workspaceError,
      isAuthenticated: Boolean(session?.user),
      workspace,
      currentUser,
      settings,
      boards,
      workspaceUsers,
      automations: visibleAutomations,
      notifications: currentUserNotifications,
      unreadNotificationsCount,
      shellData,
      dashboardData,
      async login({ email, password }) {
        const normalizedEmail = email.trim().toLowerCase()
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        })

        if (error) throw new Error(error.message)
      },
      async logout() {
        const { error } = await supabase.auth.signOut()
        if (error) throw new Error(error.message)
      },
      async requestPasswordReset(email) {
        const normalizedEmail = String(email || '').trim().toLowerCase()
        if (!normalizedEmail) {
          throw new Error('Email is required.')
        }

        const redirectTo = `${window.location.origin}/reset-password`
        const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo,
        })

        if (error) throw new Error(error.message)
      },
      async changePassword(nextPassword) {
        if (!currentUserId) throw new Error('No active user session.')
        const trimmedPassword = String(nextPassword || '').trim()
        if (trimmedPassword.length < 6) {
          throw new Error('Password must be at least 6 characters.')
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: trimmedPassword,
        })

        if (passwordError) throw new Error(passwordError.message)

        const { error: profileError } = await supabase
          .from('pulse_profiles')
          .update({ must_change_password: false })
          .eq('id', currentUserId)

        if (profileError) throw new Error(profileError.message)

        setCurrentUserProfile((current) =>
          current
            ? {
                ...current,
                mustChangePassword: false,
              }
            : current,
        )
      },
      async updateUserPreferences(updates) {
        if (!currentUserId) return

        const previousSettings = clone(settings)
        const nextSettings = {
          ...settings,
          ...updates,
        }

        setSettings(nextSettings)
        setCurrentUserProfile((current) => (current ? { ...current } : current))

        try {
          const { error } = await supabase.from('pulse_user_preferences').upsert({
            user_id: currentUserId,
            settings: nextSettings,
          })

          if (error) throw error
        } catch (error) {
          setSettings(previousSettings)
          setCurrentUserProfile((current) => (current ? { ...current } : current))
          throw error
        }
      },
      async updateCurrentUserProfile(updates) {
        if (!currentUserId) return

        const nextName = String(updates?.name || '').trim()
        const nextEmail = String(updates?.email || '').trim().toLowerCase()

        if (!nextName || !nextEmail) {
          throw new Error('Name and email are required.')
        }

        const { data, error } = await supabase.functions.invoke('pulse-update-profile', {
          body: {
            name: nextName,
            email: nextEmail,
          },
        })

        if (error) throw new Error(error.message || 'Unable to update profile.')
        if (data?.error) throw new Error(data.error)

        setCurrentUserProfile((current) =>
          current
            ? {
                ...current,
                name: nextName,
                email: nextEmail,
              }
            : current,
        )

        setWorkspaceUsers((current) =>
          current.map((user) =>
            user.id === currentUserId
              ? {
                  ...user,
                  name: nextName,
                  email: nextEmail,
                }
              : user,
          ),
        )
      },
      async manageWorkspaceUser(payload) {
        const { data, error } = await supabase.functions.invoke('pulse-admin-users', {
          body: payload,
        })

        if (error) throw new Error(error.message || 'Unable to manage workspace user.')

        await loadWorkspaceData()
        return data
      },
      async createBoard(name, preferredView = 'table') {
        if (!currentUser) return null
        const trimmed = name.trim()
        if (!trimmed) return null

        const board = createBoardTemplate(trimmed, ensureUniqueSlug(trimmed, allBoards), preferredView, currentUser)
        const { error } = await supabase
          .from('pulse_boards')
          .insert(boardToRecord(board, currentUser.workspaceId))

        if (error) throw error

        setAllBoards((current) => [...current, board])
        return board
      },
      async updateBoard(boardId, nextBoard) {
        const previousBoard = allBoards.find((board) => board.id === boardId)
        if (!previousBoard) return null
        const boardPermission = getBoardPermission(previousBoard, currentUserId)

        if (!boardPermission) {
          throw new Error('You do not have permission to update this board.')
        }

        if (
          nextBoard?.columns &&
          boardPermission !== 'owner' &&
          hasColumnStructureChanges(previousBoard.columns, nextBoard.columns)
        ) {
          throw new Error('Only the board owner can add or remove columns.')
        }

        const requestedName = typeof nextBoard.name === 'string' ? nextBoard.name.trim() : ''
        const mergedBoard = {
          ...previousBoard,
          ...clone(nextBoard),
          name: requestedName || previousBoard.name,
        }
        const boardToSave = {
          ...mergedBoard,
          slug: ensureUniqueSlug(mergedBoard.name, allBoards, boardId),
          ownerUserId: previousBoard.ownerUserId,
          ownerEmail: previousBoard.ownerEmail,
        }
        return updateBoardRecord(boardToSave)
      },
      async deleteBoard(boardId) {
        const board = allBoards.find((entry) => entry.id === boardId)
        if (!board || !currentUser) return
        if (getBoardPermission(board, currentUserId) !== 'owner') {
          throw new Error('Only the board owner can delete this board.')
        }
        const { error } = await supabase.rpc('pulse_delete_board', {
          target_board_id: boardId,
        })

        if (error) throw error

        await loadWorkspaceData()

        setBoardViewPreferences((current) => {
          const next = { ...current }
          delete next[boardId]
          return next
        })
      },
      async shareBoard(boardId, email, permission, viewColumns = []) {
        const normalizedEmail = email.trim().toLowerCase()
        const targetUser = workspaceUsers.find((user) => user.email === normalizedEmail)
        const board = allBoards.find((entry) => entry.id === boardId)
        if (!board || !targetUser || !currentUser) return
        const normalizedViewColumns =
          permission === 'view' ? Array.from(new Set((viewColumns || []).filter(Boolean))) : []

        const nextSharedWith = board.sharedWith.some((entry) => entry.userId === targetUser.id)
          ? board.sharedWith.map((entry) =>
              entry.userId === targetUser.id
                ? {
                    ...entry,
                    email: targetUser.email,
                    permission,
                    accepted: entry.accepted === true,
                    viewColumns: normalizedViewColumns,
                  }
                : entry,
            )
          : [
              ...board.sharedWith,
              {
                userId: targetUser.id,
                email: targetUser.email,
                permission,
                accepted: false,
                viewColumns: normalizedViewColumns,
              },
            ]

        await updateBoardRecord({ ...board, sharedWith: nextSharedWith })

        await supabase.from('pulse_notifications').insert({
          user_id: targetUser.id,
          title: 'Board share request',
          description: `Accept ${board.name} to add it to your workspace with ${permission} access.`,
          link: `/app/boards/${board.slug}`,
          type: 'board-share-request',
          meta: {
            boardId,
            permission,
            ownerUserId: currentUser.id,
            ownerEmail: currentUser.email,
            accepted: false,
          },
        })
      },
      async removeBoardShare(boardId, email) {
        const board = allBoards.find((entry) => entry.id === boardId)
        const targetUser = workspaceUsers.find((user) => user.email === email)
        if (!board || !targetUser) return

        await updateBoardRecord({
          ...board,
          sharedWith: board.sharedWith.filter((entry) => entry.userId !== targetUser.id),
        })

        await supabase.from('pulse_notifications').insert({
          user_id: targetUser.id,
          title: 'Board access removed',
          description: 'A board was removed from your workspace access list.',
          link: '/app/boards',
          type: 'general',
          meta: { boardId },
        })
      },
      getBoardPermission(board) {
        return getBoardPermission(board, currentUserId)
      },
      getBoardViewPreferences(boardId, board) {
        const storedPreferences = boardViewPreferences[boardId] || {}

        return {
          preferredView: storedPreferences.preferredView || board.preferredView || settings.defaultBoardView,
          groupByKey:
            typeof storedPreferences.groupByKey === 'string'
              ? storedPreferences.groupByKey
              : getDefaultGroupByKey(board),
          secondaryGroupByKey:
            typeof storedPreferences.secondaryGroupByKey === 'string' ? storedPreferences.secondaryGroupByKey : '',
          sortConfig:
            storedPreferences.sortConfig &&
            typeof storedPreferences.sortConfig.columnKey === 'string' &&
            typeof storedPreferences.sortConfig.direction === 'string'
              ? storedPreferences.sortConfig
              : null,
          groupedSectionCollapsedByField: storedPreferences.groupedSectionCollapsedByField || {},
          groupedSectionOrderByField: storedPreferences.groupedSectionOrderByField || {},
          groupedSectionColorByField: storedPreferences.groupedSectionColorByField || {},
          ganttGroupByKey:
            typeof storedPreferences.ganttGroupByKey === 'string' ? storedPreferences.ganttGroupByKey : '',
          ganttStartKey:
            typeof storedPreferences.ganttStartKey === 'string' ? storedPreferences.ganttStartKey : '',
          ganttEndKey:
            typeof storedPreferences.ganttEndKey === 'string' ? storedPreferences.ganttEndKey : '',
          kanbanGroupBy: storedPreferences.kanbanGroupBy || board.kanbanGroupBy || 'status',
          kanbanPrimaryField: storedPreferences.kanbanPrimaryField || 'name',
          kanbanCardFields: storedPreferences.kanbanCardFields || board.kanbanCardFields || [],
          kanbanCollapsedLaneIdsByField: storedPreferences.kanbanCollapsedLaneIdsByField || {},
          kanbanLaneSortDirectionByField: storedPreferences.kanbanLaneSortDirectionByField || {},
          conditionalFormattingRules: storedPreferences.conditionalFormattingRules || [],
          columnPreferences: storedPreferences.columnPreferences || {},
          textSize: storedPreferences.textSize || 'medium',
        }
      },
      async updateBoardViewPreferences(boardId, updates) {
        return persistBoardPreferences(boardId, (existingPreferences) => ({
          ...existingPreferences,
          ...updates,
        }))
      },
      async markNotificationRead(notificationId) {
        const previousNotifications = clone(notifications)
        setNotifications((current) =>
          current.map((notification) =>
            notification.id === notificationId ? { ...notification, read: true } : notification,
          ),
        )

        try {
          const { error } = await supabase
            .from('pulse_notifications')
            .update({ read: true })
            .eq('id', notificationId)
            .eq('user_id', currentUserId)

          if (error) throw error
        } catch (error) {
          setNotifications(previousNotifications)
          throw error
        }
      },
      async markAllNotificationsRead() {
        const unreadIds = currentUserNotifications.filter((notification) => !notification.read).map((notification) => notification.id)
        if (unreadIds.length === 0) return

        const previousNotifications = clone(notifications)
        setNotifications((current) =>
          current.map((notification) =>
            unreadIds.includes(notification.id) ? { ...notification, read: true } : notification,
          ),
        )

        try {
          const { error } = await supabase
            .from('pulse_notifications')
            .update({ read: true })
            .in('id', unreadIds)
            .eq('user_id', currentUserId)

          if (error) throw error
        } catch (error) {
          setNotifications(previousNotifications)
          throw error
        }
      },
      async deleteNotification(notificationId) {
        const previousNotifications = clone(notifications)
        setNotifications((current) => current.filter((notification) => notification.id !== notificationId))

        try {
          const { error } = await supabase
            .from('pulse_notifications')
            .delete()
            .eq('id', notificationId)
            .eq('user_id', currentUserId)

          if (error) throw error
        } catch (error) {
          setNotifications(previousNotifications)
          throw error
        }
      },
      async acceptBoardShare(notificationId) {
        const targetNotification = notifications.find((notification) => notification.id === notificationId)
        const targetBoardId = targetNotification?.meta?.boardId
        if (!targetBoardId || !currentUser) return null

        const board = allBoards.find((entry) => entry.id === targetBoardId)
        if (!board) return null

        const nextSharedWith = board.sharedWith.map((entry) =>
          entry.userId === currentUser.id ? { ...entry, accepted: true } : entry,
        )

        const updatedBoard = await updateBoardRecord({
          ...board,
          sharedWith: nextSharedWith,
        })

        const previousNotifications = clone(notifications)
        setNotifications((current) =>
          current.map((notification) =>
            notification.id === notificationId
              ? {
                  ...notification,
                  read: true,
                  title: 'Board added to your workspace',
                  description: 'This shared board is now available in your boards list.',
                  meta: {
                    ...notification.meta,
                    accepted: true,
                  },
                }
              : notification,
          ),
        )

        try {
          const { error } = await supabase
            .from('pulse_notifications')
            .update({
              read: true,
              title: 'Board added to your workspace',
              description: 'This shared board is now available in your boards list.',
              meta: {
                ...targetNotification.meta,
                accepted: true,
              },
            })
            .eq('id', notificationId)
            .eq('user_id', currentUserId)

          if (error) throw error
        } catch (error) {
          setNotifications(previousNotifications)
          throw error
        }

        return updatedBoard.slug
      },
      async rejectBoardShare(notificationId) {
        const targetNotification = notifications.find((notification) => notification.id === notificationId)
        const targetBoardId = targetNotification?.meta?.boardId
        if (!targetBoardId || !currentUser) return

        const board = allBoards.find((entry) => entry.id === targetBoardId)
        if (board) {
          await updateBoardRecord({
            ...board,
            sharedWith: board.sharedWith.filter((entry) => entry.userId !== currentUser.id),
          })
        }

        const previousNotifications = clone(notifications)
        setNotifications((current) =>
          current.filter((notification) => notification.id !== notificationId),
        )

        try {
          const { error } = await supabase
            .from('pulse_notifications')
            .delete()
            .eq('id', notificationId)
            .eq('user_id', currentUserId)

          if (error) throw error
        } catch (error) {
          setNotifications(previousNotifications)
          throw error
        }
      },
      async toggleAutomation(automationId) {
        const targetAutomation = automations.find((automation) => automation.id === automationId)
        if (!targetAutomation) return

        const previousAutomations = clone(automations)
        const nextAutomation = {
          ...targetAutomation,
          enabled: !targetAutomation.enabled,
          nextRunAt: !targetAutomation.enabled
            ? getNextAutomationRunAt(targetAutomation.config?.scheduleTime)
            : null,
        }
        setAutomations((current) =>
          current.map((automation) => (automation.id === automationId ? nextAutomation : automation)),
        )

        try {
          const { error } = await supabase
            .from('pulse_automations')
            .update({
              enabled: nextAutomation.enabled,
              next_run_at: nextAutomation.nextRunAt,
            })
            .eq('id', automationId)

          if (error) throw error
        } catch (error) {
          setAutomations(previousAutomations)
          throw error
        }
      },
      async createAutomation(payload) {
        if (!currentUser) throw new Error('No active user session.')

        const scheduleTime = normalizeAutomationScheduleTime(payload?.config?.scheduleTime)

        const automation = {
          id: createStableId('auto'),
          name: String(payload?.name || '').trim(),
          description: String(payload?.description || '').trim(),
          triggerType: payload?.triggerType || 'Row condition',
          actionType: 'Notification',
          enabled: payload?.enabled !== false,
          lastRunAt: null,
          nextRunAt: getNextAutomationRunAt(scheduleTime),
          targetUserId: currentUser.id,
          createdByUserId: currentUser.id,
          config: {
            ...clone(payload?.config || {}),
            scheduleTime,
          },
        }

        if (!automation.name) {
          throw new Error('Automation name is required.')
        }

        const previousAutomations = clone(automations)
        setAutomations((current) => [...current, automation])

        try {
          const { error } = await supabase
            .from('pulse_automations')
            .insert(automationToRecord(automation, currentUser.workspaceId, currentUser.id))

          if (error) throw error

          await evaluateNotificationAutomations([...automations, automation], boards)
          return automation
        } catch (error) {
          setAutomations(previousAutomations)
          throw error
        }
      },
      async updateAutomation(automationId, payload) {
        if (!currentUser) throw new Error('No active user session.')

        const targetAutomation = automations.find((automation) => automation.id === automationId)
        if (!targetAutomation) throw new Error('Automation not found.')

        const scheduleTime = normalizeAutomationScheduleTime(payload?.config?.scheduleTime)
        const nextAutomation = {
          ...targetAutomation,
          name: String(payload?.name || targetAutomation.name).trim(),
          description: String(payload?.description || targetAutomation.description).trim(),
          triggerType: payload?.triggerType || targetAutomation.triggerType,
          enabled: payload?.enabled ?? targetAutomation.enabled,
          nextRunAt:
            payload?.enabled === false || targetAutomation.enabled === false
              ? (payload?.enabled ?? targetAutomation.enabled)
                ? getNextAutomationRunAt(scheduleTime)
                : null
              : getNextAutomationRunAt(scheduleTime),
          config: {
            ...clone(payload?.config || {}),
            scheduleTime,
          },
        }

        if (!nextAutomation.name) {
          throw new Error('Automation name is required.')
        }

        const previousAutomations = clone(automations)
        setAutomations((current) =>
          current.map((automation) => (automation.id === automationId ? nextAutomation : automation)),
        )

        try {
          const { error } = await supabase
            .from('pulse_automations')
            .update(automationToRecord(nextAutomation, currentUser.workspaceId, currentUser.id))
            .eq('id', automationId)

          if (error) throw error

          return nextAutomation
        } catch (error) {
          setAutomations(previousAutomations)
          throw error
        }
      },
      async deleteAutomation(automationId) {
        const previousAutomations = clone(automations)
        setAutomations((current) => current.filter((automation) => automation.id !== automationId))

        try {
          const { error } = await supabase.from('pulse_automations').delete().eq('id', automationId)
          if (error) throw error
        } catch (error) {
          setAutomations(previousAutomations)
          throw error
        }
      },
    }),
    [
      allBoards,
      authReady,
      boards,
      currentUser,
      currentUserId,
      currentUserNotifications,
      dashboardData,
      notifications,
      session?.user,
      settings,
      shellData,
      unreadNotificationsCount,
      automations,
      visibleAutomations,
      workspace,
      workspaceLoading,
      workspaceUsers,
      boardViewPreferences,
      evaluateNotificationAutomations,
      loadWorkspaceData,
      workspaceError,
    ],
  )

  return <PulseWorkspaceContext.Provider value={value}>{children}</PulseWorkspaceContext.Provider>
}

export function usePulseWorkspace() {
  const context = useContext(PulseWorkspaceContext)
  if (!context) throw new Error('usePulseWorkspace must be used inside PulseWorkspaceProvider')
  return context
}
