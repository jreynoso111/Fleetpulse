import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { initialWorkspace } from '../data/pulseWorkspace'
import { supabase } from '../lib/supabaseClient'

const PulseWorkspaceContext = createContext(null)

const defaultSettings = {
  timezone: 'America/Mexico_City',
  locale: 'en-US',
  defaultBoardView: 'table',
  boardViews: {},
  notificationsEnabled: true,
  dashboardRefreshSeconds: 30,
  homePage: 'dashboard',
  density: 'comfortable',
  themeAccent: 'blue',
  sidebarCollapsed: false,
}

const accentThemes = {
  blue: {
    accent: '#2563eb',
    accentSoft: '#dbeafe',
    accentContrast: '#eff6ff',
    appBg: '#eef4ff',
    appBgSoft: '#f8fbff',
    surface: '#ffffff',
    surfaceMuted: '#f4f8ff',
    border: '#c9ddff',
    textPrimary: '#0f172a',
    textSecondary: '#47607f',
  },
  amber: {
    accent: '#d97706',
    accentSoft: '#fef3c7',
    accentContrast: '#fffbeb',
    appBg: '#fff5e8',
    appBgSoft: '#fffaf2',
    surface: '#fffdf8',
    surfaceMuted: '#fff7e6',
    border: '#f3d3a2',
    textPrimary: '#3b2410',
    textSecondary: '#7c5a32',
  },
  emerald: {
    accent: '#059669',
    accentSoft: '#d1fae5',
    accentContrast: '#ecfdf5',
    appBg: '#ebfaf4',
    appBgSoft: '#f5fdf9',
    surface: '#fbfffd',
    surfaceMuted: '#eefcf5',
    border: '#b7ebd4',
    textPrimary: '#10261f',
    textSecondary: '#47675b',
  },
  rose: {
    accent: '#e11d48',
    accentSoft: '#ffe4e6',
    accentContrast: '#fff1f2',
    appBg: '#fff0f3',
    appBgSoft: '#fff8f9',
    surface: '#fffdfd',
    surfaceMuted: '#fff2f4',
    border: '#f7c8d1',
    textPrimary: '#32121b',
    textSecondary: '#7b4a57',
  },
  indigo: {
    accent: '#4f46e5',
    accentSoft: '#e0e7ff',
    accentContrast: '#eef2ff',
    appBg: '#eef2ff',
    appBgSoft: '#f8faff',
    surface: '#ffffff',
    surfaceMuted: '#eef2ff',
    border: '#c7d2fe',
    textPrimary: '#1e1b4b',
    textSecondary: '#5b5ea6',
  },
  teal: {
    accent: '#0f766e',
    accentSoft: '#ccfbf1',
    accentContrast: '#f0fdfa',
    appBg: '#e6fffb',
    appBgSoft: '#f4fffd',
    surface: '#fbfffe',
    surfaceMuted: '#e8fbf7',
    border: '#99f6e4',
    textPrimary: '#102a27',
    textSecondary: '#41756f',
  },
  coral: {
    accent: '#ea580c',
    accentSoft: '#ffedd5',
    accentContrast: '#fff7ed',
    appBg: '#fff1e8',
    appBgSoft: '#fff8f4',
    surface: '#fffefd',
    surfaceMuted: '#fff3ea',
    border: '#fdba74',
    textPrimary: '#3a1d10',
    textSecondary: '#8a583c',
  },
  violet: {
    accent: '#7c3aed',
    accentSoft: '#ede9fe',
    accentContrast: '#f5f3ff',
    appBg: '#f3efff',
    appBgSoft: '#faf8ff',
    surface: '#ffffff',
    surfaceMuted: '#f3efff',
    border: '#d8b4fe',
    textPrimary: '#2e1065',
    textSecondary: '#6b46a9',
  },
  lime: {
    accent: '#65a30d',
    accentSoft: '#ecfccb',
    accentContrast: '#f7fee7',
    appBg: '#f6ffe8',
    appBgSoft: '#fbfff3',
    surface: '#fefff9',
    surfaceMuted: '#f3fbdc',
    border: '#bef264',
    textPrimary: '#24340d',
    textSecondary: '#627244',
  },
  copper: {
    accent: '#b45309',
    accentSoft: '#fde6d3',
    accentContrast: '#fff7f1',
    appBg: '#fff3ea',
    appBgSoft: '#fff9f5',
    surface: '#fffefd',
    surfaceMuted: '#fff1e4',
    border: '#f5c39d',
    textPrimary: '#3a2214',
    textSecondary: '#82593e',
  },
  slate: {
    accent: '#334155',
    accentSoft: '#e2e8f0',
    accentContrast: '#f8fafc',
    appBg: '#eef2f6',
    appBgSoft: '#f8fafc',
    surface: '#ffffff',
    surfaceMuted: '#f1f5f9',
    border: '#d5dde7',
    textPrimary: '#111827',
    textSecondary: '#526071',
  },
  'blue-inverted': {
    accent: '#bfdbfe',
    accentSoft: '#1d4ed8',
    accentContrast: '#0f172a',
    appBg: '#0f172a',
    appBgSoft: '#162033',
    surface: '#111c2e',
    surfaceMuted: '#1b2a43',
    border: '#27476f',
    textPrimary: '#eff6ff',
    textSecondary: '#bfd6f6',
  },
  'emerald-inverted': {
    accent: '#a7f3d0',
    accentSoft: '#047857',
    accentContrast: '#081c15',
    appBg: '#081c15',
    appBgSoft: '#0d261d',
    surface: '#102b22',
    surfaceMuted: '#15352a',
    border: '#225244',
    textPrimary: '#ecfdf5',
    textSecondary: '#b7e9d1',
  },
  'rose-inverted': {
    accent: '#fecdd3',
    accentSoft: '#be123c',
    accentContrast: '#2a0d15',
    appBg: '#2a0d15',
    appBgSoft: '#34111b',
    surface: '#3f1621',
    surfaceMuted: '#4a1d2a',
    border: '#733049',
    textPrimary: '#fff1f2',
    textSecondary: '#f6c5cf',
  },
  'slate-inverted': {
    accent: '#cbd5e1',
    accentSoft: '#475569',
    accentContrast: '#0f172a',
    appBg: '#020617',
    appBgSoft: '#0b1220',
    surface: '#111827',
    surfaceMuted: '#182235',
    border: '#334155',
    textPrimary: '#f8fafc',
    textSecondary: '#cbd5e1',
  },
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function ensureUniqueSlug(name, existingBoards, excludedBoardId) {
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

function createStableId(prefix) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function ensureUniqueItemIds(items = []) {
  const seenIds = new Set()

  return items.map((item) => {
    const nextId = item.id && !seenIds.has(item.id) ? item.id : createStableId('item')
    seenIds.add(nextId)
    return {
      ...item,
      id: nextId,
    }
  })
}

function formatDateKey(value) {
  return new Date(value).toISOString().slice(0, 10)
}

function getTimelineValue(item) {
  return item.due_date || item.start_date || item.work_date || item.last_updated || new Date().toISOString()
}

function getRecentDateKeys(items, totalDays) {
  const latestTimestamp = items.reduce((latest, item) => {
    const current = new Date(getTimelineValue(item)).getTime()
    return Number.isNaN(current) ? latest : Math.max(latest, current)
  }, Date.now())

  return Array.from({ length: totalDays }, (_, index) => {
    const date = new Date(latestTimestamp)
    date.setDate(date.getDate() - (totalDays - index - 1))
    return formatDateKey(date)
  })
}

function getRecentWeekKeys(items, totalWeeks) {
  const latestTimestamp = items.reduce((latest, item) => {
    const current = new Date(getTimelineValue(item)).getTime()
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

function createBoardTemplate(name, slug, preferredView, currentUser) {
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

function getBoardPermission(board, currentUserId) {
  if (!board || !currentUserId) return null
  if ((board.deletedFor || []).some((entry) => entry.userId === currentUserId)) return null
  if (board.ownerUserId === currentUserId) return 'owner'
  const sharedEntry = board.sharedWith.find((entry) => entry.userId === currentUserId)
  if (!sharedEntry?.accepted) return null
  return sharedEntry.permission || null
}

function canAccessBoard(board, currentUserId) {
  return Boolean(getBoardPermission(board, currentUserId))
}

function getDefaultGroupByKey(board) {
  return board.columns.find((column) => column.key === 'category')?.key || ''
}

function mergeSettings(settings) {
  return {
    ...defaultSettings,
    ...(settings || {}),
    boardViews: settings?.boardViews || {},
  }
}

function mapBoardRecord(record, workspaceUsersById) {
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
    columns: record.columns || [],
    items: ensureUniqueItemIds(record.items || []),
  }
}

function mapAutomationRecord(record) {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    triggerType: record.trigger_type,
    actionType: record.action_type,
    enabled: record.enabled,
    lastRunAt: record.last_run_at,
    nextRunAt: record.next_run_at,
  }
}

function mapNotificationRecord(record) {
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

function boardToRecord(board, workspaceId) {
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
    columns: board.columns || [],
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
    ] = await Promise.all([
      supabase.from('pulse_workspaces').select('*').eq('id', profile.workspace_id).single(),
      supabase.from('pulse_profiles').select('*').eq('workspace_id', profile.workspace_id).order('name'),
      supabase.from('pulse_boards').select('*').eq('workspace_id', profile.workspace_id).order('created_at'),
      supabase.from('pulse_automations').select('*').eq('workspace_id', profile.workspace_id).order('created_at'),
      supabase.from('pulse_notifications').select('*').order('created_at', { ascending: false }),
      supabase.from('pulse_board_view_preferences').select('*').eq('user_id', session.user.id),
    ])

    if (workspaceError) throw workspaceError
    if (usersError) throw usersError
    if (boardsError) throw boardsError
    if (automationsError) throw automationsError
    if (notificationsError) throw notificationsError
    if (boardPreferencesError) throw boardPreferencesError

    const usersById = new Map((userRows || []).map((user) => [user.id, user]))
    const normalizedSettings = mergeSettings(preferenceRow?.settings)

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
    setAllBoards((boardRows || []).map((board) => mapBoardRecord(board, usersById)))
    setAutomations((automationRows || []).map(mapAutomationRecord))
    setNotifications((notificationRows || []).map(mapNotificationRecord))
    setBoardViewPreferences(
      Object.fromEntries((boardPreferenceRows || []).map((row) => [row.board_id, row.preferences || {}])),
    )
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
  const unreadNotificationsCount = useMemo(
    () => currentUserNotifications.filter((notification) => !notification.read).length,
    [currentUserNotifications],
  )

  const allItems = useMemo(
    () => boards.flatMap((board) => board.items.map((item) => ({ ...item, boardId: board.id }))),
    [boards],
  )

  const dashboardData = useMemo(() => {
    const totalItems = allItems.length
    const completedItems = allItems.filter((item) => item.status === 'Done' || item.shipment_status === 'Done').length
    const blockedItems = allItems.filter((item) => item.status === 'Stuck' || item.shipment_status === 'Stuck' || item.blocked).length
    const activeAutomations = automations.filter((automation) => automation.enabled).length
    const recentDays = getRecentDateKeys(allItems, 7)
    const recentWeeks = getRecentWeekKeys(allItems, 6)

    const completedByDay = allItems.reduce((accumulator, item) => {
      const status = item.status || item.shipment_status
      if (status !== 'Done') return accumulator
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
      const status = item.status || item.shipment_status

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
        const status = item.status || item.shipment_status || 'Working on it'
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

    return {
      kpis: [
        { key: 'total-items', label: 'Total items', value: totalItems, tone: 'text-blue-600' },
        { key: 'completed', label: 'Completed', value: completedItems, tone: 'text-emerald-600' },
        { key: 'blocked', label: 'Blocked', value: blockedItems, tone: 'text-rose-600' },
        { key: 'active-automations', label: 'Active automations', value: activeAutomations, tone: 'text-amber-600' },
      ],
      weeklyThroughput,
      trendData,
      pieData,
    }
  }, [allItems, automations])

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
      automations,
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

        const nextSettings = {
          ...settings,
          ...updates,
        }

        setSettings(nextSettings)
        setCurrentUserProfile((current) => (current ? { ...current } : current))

        const { error } = await supabase.from('pulse_user_preferences').upsert({
          user_id: currentUserId,
          settings: nextSettings,
        })

        if (error) throw error
      },
      async updateCurrentUserProfile(updates) {
        if (!currentUserId) return

        const nextName = String(updates?.name || '').trim()
        const nextEmail = String(updates?.email || '').trim().toLowerCase()

        if (!nextName || !nextEmail) {
          throw new Error('Name and email are required.')
        }

        const { error: authError } = await supabase.auth.updateUser({
          email: nextEmail !== currentUser?.email ? nextEmail : undefined,
          data: {
            full_name: nextName,
          },
        })

        if (authError) throw new Error(authError.message)

        const { error: profileError } = await supabase
          .from('pulse_profiles')
          .update({
            name: nextName,
            email: nextEmail,
          })
          .eq('id', currentUserId)

        if (profileError) throw new Error(profileError.message)

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
          groupedSectionCollapsedByField: storedPreferences.groupedSectionCollapsedByField || {},
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
          columnPreferences: storedPreferences.columnPreferences || {},
          textSize: storedPreferences.textSize || 'medium',
        }
      },
      async updateBoardViewPreferences(boardId, updates) {
        const existingPreferences = boardViewPreferences[boardId] || {}
        const nextPreferences = {
          ...existingPreferences,
          ...updates,
        }

        setBoardViewPreferences((current) => ({
          ...current,
          [boardId]: nextPreferences,
        }))

        const { error } = await supabase.from('pulse_board_view_preferences').upsert({
          user_id: currentUserId,
          board_id: boardId,
          preferences: nextPreferences,
        })

        if (error) throw error
      },
      async markNotificationRead(notificationId) {
        setNotifications((current) =>
          current.map((notification) =>
            notification.id === notificationId ? { ...notification, read: true } : notification,
          ),
        )

        const { error } = await supabase
          .from('pulse_notifications')
          .update({ read: true })
          .eq('id', notificationId)

        if (error) throw error
      },
      async markAllNotificationsRead() {
        const unreadIds = currentUserNotifications.filter((notification) => !notification.read).map((notification) => notification.id)
        if (unreadIds.length === 0) return

        setNotifications((current) =>
          current.map((notification) =>
            unreadIds.includes(notification.id) ? { ...notification, read: true } : notification,
          ),
        )

        const { error } = await supabase
          .from('pulse_notifications')
          .update({ read: true })
          .in('id', unreadIds)

        if (error) throw error
      },
      async deleteNotification(notificationId) {
        setNotifications((current) => current.filter((notification) => notification.id !== notificationId))

        const { error } = await supabase
          .from('pulse_notifications')
          .delete()
          .eq('id', notificationId)

        if (error) throw error
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

        if (error) throw error

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

        setNotifications((current) =>
          current.filter((notification) => notification.id !== notificationId),
        )

        const { error } = await supabase
          .from('pulse_notifications')
          .delete()
          .eq('id', notificationId)

        if (error) throw error
      },
      async toggleAutomation(automationId) {
        const targetAutomation = automations.find((automation) => automation.id === automationId)
        if (!targetAutomation) return

        const nextAutomation = {
          ...targetAutomation,
          enabled: !targetAutomation.enabled,
        }
        setAutomations((current) =>
          current.map((automation) => (automation.id === automationId ? nextAutomation : automation)),
        )

        const { error } = await supabase
          .from('pulse_automations')
          .update({ enabled: nextAutomation.enabled })
          .eq('id', automationId)

        if (error) throw error
      },
    }),
    [
      allBoards,
      authReady,
      automations,
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
      workspace,
      workspaceLoading,
      workspaceUsers,
      boardViewPreferences,
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
