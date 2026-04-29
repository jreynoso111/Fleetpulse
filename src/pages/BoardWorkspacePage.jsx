import { ArrowDownToLine, ArrowLeft, ArrowUpToLine, FilterX, PencilLine, Search, Share2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import BoardTable from '../components/BoardTable'
import { usePulseWorkspace } from '../context/PulseWorkspaceContext'

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function resolveBoardColumns(boardColumns, columnPreferences, restrictedColumnKeys = []) {
  const mergedColumns = boardColumns.map((column, index) => {
    const preferences = columnPreferences[column.key] || {}

    return {
      ...column,
      hidden: preferences.hidden ?? column.hidden ?? false,
      minWidth: preferences.minWidth ?? column.minWidth,
      position: preferences.position ?? column.position ?? index + 1,
    }
  })

  const sortedColumns = mergedColumns.sort((left, right) => (left.position || 0) - (right.position || 0))

  if (!restrictedColumnKeys.length) {
    return sortedColumns
  }

  const positionByKey = new Map(restrictedColumnKeys.map((key, index) => [key, index + 1]))

  return sortedColumns
    .filter((column) => positionByKey.has(column.key))
    .map((column) => ({
      ...column,
      hidden: false,
      position: positionByKey.get(column.key) || column.position,
    }))
    .sort((left, right) => (left.position || 0) - (right.position || 0))
}

function sanitizeSharedColumns(currentColumns, nextColumns) {
  return nextColumns.map((column, index) => {
    const currentColumn = currentColumns.find((entry) => entry.key === column.key)

    return {
      ...currentColumn,
      id: currentColumn?.id || column.id,
      key: column.key,
      label: column.label,
      type: column.type,
      statusOptions: column.statusOptions ?? currentColumn?.statusOptions,
      statusColors: column.statusColors ?? currentColumn?.statusColors,
      position: currentColumn?.position ?? index + 1,
      minWidth: currentColumn?.minWidth ?? column.minWidth ?? 170,
    }
  })
}

function toCsvValue(value) {
  const normalized = value == null ? '' : String(value)
  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`
  }
  return normalized
}

function normalizeHeader(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

function createImportedRowId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `item-${crypto.randomUUID()}`
  }

  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function formatImportedPhone(value) {
  const digits = String(value ?? '')
    .replace(/\D/g, '')
    .slice(0, 10)

  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
}

function parseDateValue(value) {
  if (value == null || value === '') return null

  const normalizedValue = typeof value === 'string' ? value.trim() : value

  if (typeof normalizedValue === 'string' && DATE_ONLY_PATTERN.test(normalizedValue)) {
    const [year, month, day] = normalizedValue.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  const date = new Date(normalizedValue)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatDateKey(value) {
  const date = parseDateValue(value)
  if (!date) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeImportedValue(column, value) {
  if (value == null) return ''
  if (column.type === 'number' || column.type === 'currency') {
    const normalized = Number(String(value).replace(/[^0-9.-]+/g, ''))
    return Number.isNaN(normalized) ? 0 : normalized
  }
  if (column.type === 'boolean') {
    const normalized = String(value).trim().toLowerCase()
    return normalized === 'true' || normalized === 'yes' || normalized === '1'
  }
  if (column.type === 'phone') {
    return formatImportedPhone(value)
  }
  if (column.type === 'date') {
    const normalizedDate = formatDateKey(value)
    return normalizedDate || String(value).trim()
  }
  return String(value).trim()
}

function normalizeKeyValue(value) {
  return String(value ?? '').trim().toLowerCase()
}

function getImportedDefaultValue(column) {
  if (column.type === 'number' || column.type === 'currency') return 0
  if (column.type === 'boolean') return false
  if (column.type === 'status') return column.statusOptions?.[0] || ''
  return ''
}

function BoardWorkspacePage() {
  const navigate = useNavigate()
  const { boardSlug } = useParams()
  const [shareEmail, setShareEmail] = useState('')
  const [sharePermission, setSharePermission] = useState('view')
  const [localTableSearchQuery, setLocalTableSearchQuery] = useState('')
  const [clearTableFiltersToken, setClearTableFiltersToken] = useState(0)
  const [editPageForm, setEditPageForm] = useState({ name: '', description: '' })
  const [showEditPageModal, setShowEditPageModal] = useState(false)
  const [showSharingModal, setShowSharingModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadHeaders, setUploadHeaders] = useState([])
  const [uploadRows, setUploadRows] = useState([])
  const [uploadFileName, setUploadFileName] = useState('')
  const [uploadBoardKey, setUploadBoardKey] = useState('')
  const [uploadFeedback, setUploadFeedback] = useState(null)
  const [uploadError, setUploadError] = useState('')
  const [uploadBusy, setUploadBusy] = useState(false)
  const uploadInputRef = useRef(null)
  const {
    boards,
    currentUser,
    getBoardPermission,
    getBoardViewPreferences,
    removeBoardShare,
    settings,
    shareBoard,
    updateBoard,
    updateBoardViewPreferences,
    workspaceUsers,
  } = usePulseWorkspace()
  const board = useMemo(() => boards.find((entry) => entry.slug === boardSlug) || null, [boardSlug, boards])
  const boardPermission = board ? getBoardPermission(board) : null
  const canEditBoard = boardPermission === 'owner' || boardPermission === 'edit'
  const canManageColumns = boardPermission === 'owner'
  const canManageSharing = boardPermission === 'owner'
  const boardViewPreferences = board ? getBoardViewPreferences(board.id, board) : null
  const currentShareEntry = board?.sharedWith.find((entry) => entry.userId === currentUser?.id) || null
  const restrictedColumnKeys = boardPermission === 'view' ? currentShareEntry?.viewColumns || [] : []
  const resolvedColumns = useMemo(
    () => (board ? resolveBoardColumns(board.columns, boardViewPreferences?.columnPreferences || {}, restrictedColumnKeys) : []),
    [board, boardViewPreferences, restrictedColumnKeys],
  )
  const matchedUploadColumns = useMemo(() => {
    if (!board || uploadHeaders.length === 0) return []

    return uploadHeaders
      .map((header) => {
        const normalized = normalizeHeader(header)
        const boardColumn =
          board.columns.find((column) => normalizeHeader(column.label) === normalized) ||
          board.columns.find((column) => normalizeHeader(column.key) === normalized)

        if (!boardColumn) return null

        return {
          header,
          column: boardColumn,
        }
      })
      .filter(Boolean)
  }, [board, uploadHeaders])
  const uploadKeyMatch = useMemo(
    () => matchedUploadColumns.find((entry) => entry.column.key === uploadBoardKey) || null,
    [matchedUploadColumns, uploadBoardKey],
  )
  const availableUsers = workspaceUsers.filter(
    (user) =>
      user.disabled !== true &&
      user.email !== currentUser?.email &&
      !board?.sharedWith.some((entry) => entry.email === user.email),
  )

  useEffect(() => {
    if (!board) return
    setEditPageForm({
      name: board.name || '',
      description: board.description || '',
    })
    setUploadBoardKey(board.columns[0]?.key || '')
  }, [board])

  if (!board && boards.length > 0) {
    return <Navigate to="/app/boards" replace />
  }

  if (!board) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Board not found</h1>
        <p className="text-sm text-slate-600">The requested workspace page does not exist anymore.</p>
        <Link
          to="/app/boards"
          className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Back to boards
        </Link>
      </section>
    )
  }

  function handleBoardChange(nextBoard) {
    const nextColumns = sanitizeSharedColumns(board.columns, nextBoard.columns)
    updateBoard(board.id, { ...board, columns: nextColumns, items: nextBoard.items }).catch((error) => {
      console.error('Failed to update board data.', error)
    })
  }

  async function handleShareSubmit(event) {
    event.preventDefault()
    if (!shareEmail) return
    await shareBoard(board.id, shareEmail, sharePermission, sharePermission === 'view' ? board.columns.map((column) => column.key) : [])
    setShareEmail('')
    setSharePermission('view')
  }

  async function handleEditPageSubmit(event) {
    event.preventDefault()
    const nextBoard = await updateBoard(board.id, {
      name: editPageForm.name,
      description: editPageForm.description,
    })

    if (!nextBoard) return

    setShowEditPageModal(false)
    if (nextBoard.slug !== board.slug) {
      navigate(`/app/boards/${nextBoard.slug}`, { replace: true })
    }
  }

  function handleDownloadData() {
    if (!resolvedColumns.length) return

    const header = resolvedColumns.map((column) => toCsvValue(column.label)).join(',')
    const rows = board.items.map((item) =>
      resolvedColumns.map((column) => toCsvValue(item[column.key] ?? '')).join(','),
    )
    const csvContent = [header, ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const downloadUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `${board.slug || 'board-data'}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(downloadUrl)
  }

  async function handleUploadFileChange(event) {
    const [file] = Array.from(event.target.files || [])
    if (!file) return

    setUploadBusy(true)
    setUploadError('')
    setUploadFeedback(null)

    try {
      const [{ read, utils }, fileBuffer] = await Promise.all([
        import('xlsx'),
        file.arrayBuffer(),
      ])
      const workbook = read(fileBuffer, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const firstSheet = workbook.Sheets[firstSheetName]
      const rowsAsArrays = utils.sheet_to_json(firstSheet, { header: 1, defval: '', raw: false })

      if (!rowsAsArrays.length) {
        throw new Error('The selected file is empty.')
      }

      const [rawHeaders, ...rawRows] = rowsAsArrays
      const headers = rawHeaders.map((value) => String(value || '').trim()).filter(Boolean)

      if (!headers.length) {
        throw new Error('The selected file does not contain a header row.')
      }

      const parsedRows = rawRows
        .filter((row) => row.some((value) => String(value || '').trim() !== ''))
        .map((row) =>
          headers.reduce((accumulator, header, index) => {
            accumulator[header] = row[index] ?? ''
            return accumulator
          }, {}),
        )

      setUploadFileName(file.name)
      setUploadHeaders(headers)
      setUploadRows(parsedRows)
    } catch (error) {
      setUploadError(error.message || 'Could not read the selected file.')
      setUploadHeaders([])
      setUploadRows([])
      setUploadFileName('')
    } finally {
      setUploadBusy(false)
      event.target.value = ''
    }
  }

  async function handleUploadDataSubmit(event) {
    event.preventDefault()
    if (!board || !uploadRows.length || !uploadBoardKey || !uploadKeyMatch) return

    const matchedEntries = matchedUploadColumns.filter((entry) => entry.column.key)
    if (!matchedEntries.length) {
      setUploadError('No matching column names were found between the file and this board.')
      return
    }

    const existingRows = [...board.items]
    const rowIndexByKey = new Map(
      existingRows
        .map((item, index) => [normalizeKeyValue(item[uploadBoardKey]), index])
        .filter(([key]) => key),
    )

    let inserted = 0
    let updated = 0
    let skipped = 0
    let nextColumns = [...board.columns]

    uploadRows.forEach((sourceRow) => {
      const sourceKey = normalizeKeyValue(sourceRow[uploadKeyMatch.header])
      if (!sourceKey) {
        skipped += 1
        return
      }

      const payload = matchedEntries.reduce((accumulator, entry) => {
        accumulator[entry.column.key] = normalizeImportedValue(entry.column, sourceRow[entry.header])
        return accumulator
      }, {})

      nextColumns = nextColumns.map((column) => {
        if (column.type !== 'status' || !Object.prototype.hasOwnProperty.call(payload, column.key)) return column
        const nextValue = payload[column.key]
        if (!nextValue || column.statusOptions?.includes(nextValue)) return column
        return {
          ...column,
          statusOptions: [...(column.statusOptions || []), nextValue],
        }
      })

      const existingIndex = rowIndexByKey.get(sourceKey)
      if (existingIndex == null) {
        const newRow = nextColumns.reduce((accumulator, column) => {
          accumulator[column.key] = payload[column.key] ?? getImportedDefaultValue(column)
          return accumulator
        }, { id: createImportedRowId() })
        existingRows.push(newRow)
        rowIndexByKey.set(sourceKey, existingRows.length - 1)
        inserted += 1
        return
      }

      existingRows[existingIndex] = {
        ...existingRows[existingIndex],
        ...payload,
      }
      updated += 1
    })

    try {
      await updateBoard(board.id, {
        ...board,
        columns: sanitizeSharedColumns(board.columns, nextColumns),
        items: existingRows,
      })
      setUploadFeedback({ inserted, updated, skipped, matched: matchedEntries.length })
      setUploadError('')
    } catch (error) {
      setUploadError(error.message || 'Could not import the selected data.')
    }
  }

  return (
    <section className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
        <div className="min-w-0 space-y-3">
          <Link
            to="/app/boards"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-800"
          >
            <ArrowLeft size={16} />
            All boards
          </Link>
          <div className="grid gap-3 2xl:grid-cols-[auto_minmax(0,1fr)] 2xl:items-center 2xl:gap-4">
            <h1 className="break-words text-3xl font-semibold tracking-tight text-slate-900">{board.name}</h1>
            <div className="grid w-full max-w-4xl gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-soft">
                <Search size={16} className="text-slate-400" />
                <input
                  type="search"
                  value={localTableSearchQuery}
                  onChange={(event) => setLocalTableSearchQuery(event.target.value)}
                  className="w-full min-w-0 border-none bg-transparent text-sm text-slate-700 outline-none"
                  placeholder="Search this table only..."
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setLocalTableSearchQuery('')
                  setClearTableFiltersToken((current) => current + 1)
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-soft transition hover:bg-slate-50 sm:whitespace-nowrap"
              >
                <FilterX size={16} />
                Clear table filters
              </button>
            </div>
          </div>
        </div>

        <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 xl:mx-0 xl:justify-end xl:px-0">
          {canEditBoard && (
            <>
              <button
                type="button"
                onClick={handleDownloadData}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <ArrowDownToLine size={15} />
                Download data
              </button>
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <ArrowUpToLine size={15} />
                Upload data
              </button>
            </>
          )}
          {canManageSharing && (
            <>
              <button
                type="button"
                onClick={() => setShowSharingModal(true)}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Share2 size={15} />
                Sharing
              </button>
              <button
                type="button"
                onClick={() => setShowEditPageModal(true)}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <PencilLine size={15} />
                Edit page
              </button>
            </>
          )}
        </div>
      </div>
      <BoardTable
        key={board.id}
        columns={resolvedColumns}
        rows={board.items}
        loading={false}
        error={null}
        currentUser={currentUser}
        readOnly={!canEditBoard}
        canManageColumns={canManageColumns}
        initialViewMode={boardViewPreferences?.preferredView || board.preferredView || settings.defaultBoardView}
        initialGroupByKey={boardViewPreferences?.groupByKey}
        initialSecondaryGroupByKey={boardViewPreferences?.secondaryGroupByKey || ''}
        initialSortConfig={boardViewPreferences?.sortConfig || null}
        initialGroupedSectionCollapsedByField={boardViewPreferences?.groupedSectionCollapsedByField || {}}
        initialGroupedSectionOrderByField={boardViewPreferences?.groupedSectionOrderByField || {}}
        initialGroupedSectionColorByField={boardViewPreferences?.groupedSectionColorByField || {}}
        initialGanttGroupByKey={boardViewPreferences?.ganttGroupByKey || ''}
        initialGanttStartKey={boardViewPreferences?.ganttStartKey || ''}
        initialGanttEndKey={boardViewPreferences?.ganttEndKey || ''}
        initialKanbanGroupKey={boardViewPreferences?.kanbanGroupBy || board.kanbanGroupBy}
        initialKanbanPrimaryField={boardViewPreferences?.kanbanPrimaryField || 'name'}
        initialKanbanCardFields={boardViewPreferences?.kanbanCardFields || board.kanbanCardFields}
        initialKanbanCollapsedLaneIdsByField={boardViewPreferences?.kanbanCollapsedLaneIdsByField || {}}
        initialKanbanLaneSortDirectionByField={boardViewPreferences?.kanbanLaneSortDirectionByField || {}}
        initialConditionalFormattingRules={boardViewPreferences?.conditionalFormattingRules || []}
        initialTextSize={boardViewPreferences?.textSize || 'medium'}
        clearFiltersToken={clearTableFiltersToken}
        externalSearchQuery={localTableSearchQuery}
        hasExternalFilters={Boolean(localTableSearchQuery.trim())}
        onClearExternalFilters={() => setLocalTableSearchQuery('')}
        onDataChange={handleBoardChange}
        onViewConfigChange={(updates) => {
          updateBoardViewPreferences(board.id, updates).catch((error) => {
            console.error('Failed to save board view preferences.', error)
          })
        }}
      />

      {showSharingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className="max-h-[calc(100vh-1.5rem)] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-white/60 bg-white p-4 shadow-[0_24px_80px_rgba(15,23,42,0.24)] sm:max-h-[calc(100vh-2rem)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Share2 size={16} className="text-slate-500" />
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Sharing</p>
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Manage access</h2>
                <p className="text-sm text-slate-600">
                  Share this board with another user and choose whether they can only view it or also edit it.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSharingModal(false)}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="mt-4">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Owner: {board.ownerEmail}
              </span>
            </div>

            {canManageSharing ? (
              <>
                <form className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end" onSubmit={handleShareSubmit}>
                <label className="w-full flex-1 space-y-1 sm:min-w-[240px]">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">User</span>
                  <select
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                    value={shareEmail}
                    onChange={(event) => setShareEmail(event.target.value)}
                  >
                    <option value="">Select a user</option>
                    {availableUsers.map((user) => (
                      <option key={user.email} value={user.email}>
                        {user.name} · {user.email}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="w-full space-y-1 sm:w-[180px]">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Permission</span>
                  <select
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                    value={sharePermission}
                    onChange={(event) => setSharePermission(event.target.value)}
                  >
                    <option value="view">View</option>
                    <option value="edit">Edit</option>
                  </select>
                </label>

                <button
                  type="submit"
                  className="rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                  style={{ backgroundColor: 'var(--pulse-accent)' }}
                >
                  Share board
                </button>
                </form>

              </>
            ) : (
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Only the board owner can manage sharing. Your current access is <span className="font-semibold">{boardPermission}</span>.
              </div>
            )}

            <div className="mt-5">
              {board.sharedWith.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  This board is not shared with anyone yet.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-[1.25rem] border border-slate-200">
                  <table className="min-w-full border-collapse text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="border-b border-slate-200 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                          User
                        </th>
                        <th className="border-b border-slate-200 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                          Email
                        </th>
                        <th className="border-b border-slate-200 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                          Permission
                        </th>
                        <th className="border-b border-slate-200 px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {board.sharedWith.map((entry) => {
                        const sharedUser = workspaceUsers.find((user) => user.email === entry.email)

                        return (
                          <tr key={entry.email} className="bg-white">
                            <td className="border-b border-slate-200 px-4 py-3 font-medium text-slate-900">
                              {sharedUser?.name || entry.email}
                            </td>
                            <td className="border-b border-slate-200 px-4 py-3 text-slate-600">{entry.email}</td>
                            <td className="border-b border-slate-200 px-4 py-3">
                              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                                {entry.permission}
                              </span>
                              {entry.permission === 'view' && entry.viewColumns?.length > 0 && (
                                <p className="mt-2 text-xs text-slate-500">
                                  {entry.viewColumns.length} columns curated
                                </p>
                              )}
                            </td>
                            <td className="border-b border-slate-200 px-4 py-3 text-right">
                              {canManageSharing && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const shouldRemove = window.confirm(`Remove access for "${entry.email}"?`)
                                    if (!shouldRemove) return
                                  removeBoardShare(board.id, entry.email).catch((error) => {
                                    console.error('Failed to remove board sharing.', error)
                                  })
                                }}
                                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                                >
                                  Remove
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showEditPageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className="max-h-[calc(100vh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-white/60 bg-white p-4 shadow-[0_24px_80px_rgba(15,23,42,0.24)] sm:max-h-[calc(100vh-2rem)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <PencilLine size={16} className="text-slate-500" />
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Edit page</p>
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Update board details</h2>
                <p className="text-sm text-slate-600">
                  Adjust the page name and summary without changing the board data itself.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditPageModal(false)}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <form className="mt-6 space-y-5" onSubmit={handleEditPageSubmit}>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-900">Page name</span>
                <input
                  autoFocus
                  value={editPageForm.name}
                  onChange={(event) => setEditPageForm((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-2 ring-transparent transition focus:border-slate-300 focus:ring-slate-200"
                  placeholder="Operations tracker, hiring pipeline, logistics board..."
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-900">Description</span>
                <textarea
                  rows={4}
                  value={editPageForm.description}
                  onChange={(event) =>
                    setEditPageForm((current) => ({ ...current, description: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-2 ring-transparent transition focus:border-slate-300 focus:ring-slate-200"
                  placeholder="Short summary for what this board tracks and how the team should use it."
                />
              </label>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current mode</p>
                  <p className="mt-1 text-sm text-slate-700">
                    Table workspace
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Owner</p>
                  <p className="mt-1 text-sm text-slate-700">{board.ownerEmail}</p>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditPageModal(false)}
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
            </form>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className="max-h-[calc(100vh-1.5rem)] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-white/60 bg-white p-4 shadow-[0_24px_80px_rgba(15,23,42,0.24)] sm:max-h-[calc(100vh-2rem)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ArrowUpToLine size={16} className="text-slate-500" />
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Upload data</p>
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Insert or update rows</h2>
                <p className="text-sm text-slate-600">
                  Upload a CSV or Excel file, choose the key columns, and Pulse will only import matching columns by name.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <form className="mt-6 space-y-5" onSubmit={handleUploadDataSubmit}>
              <div className="space-y-2">
                <span className="text-sm font-medium text-slate-900">File</span>
                <input
                  ref={uploadInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleUploadFileChange}
                  className="hidden"
                />
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => uploadInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <ArrowUpToLine size={15} />
                    Choose file
                  </button>
                  <span className="text-sm text-slate-500">
                    {uploadFileName || 'No file selected yet'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">Accepted formats: CSV, XLSX, XLS</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-900">Board key column</span>
                  <select
                    value={uploadBoardKey}
                    onChange={(event) => setUploadBoardKey(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-2 ring-transparent transition focus:border-slate-300 focus:ring-slate-200"
                  >
                    {board.columns.map((column) => (
                      <option key={column.key} value={column.key}>
                        {column.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="space-y-2">
                  <span className="text-sm font-medium text-slate-900">Matched file key</span>
                  <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    {uploadKeyMatch
                      ? `${uploadKeyMatch.header} → ${uploadKeyMatch.column.label}`
                      : uploadHeaders.length === 0
                        ? 'Upload a file first'
                        : 'No matching file column found for the selected board key'}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Column match summary</p>
                <p className="mt-1 text-sm text-slate-700">
                  {matchedUploadColumns.length} matching columns will be imported. Columns without matching names are ignored.
                </p>
                {matchedUploadColumns.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {matchedUploadColumns.map((entry) => (
                      <span key={`${entry.header}-${entry.column.key}`} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                        {entry.header} → {entry.column.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {uploadError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {uploadError}
                </div>
              )}

              {uploadFeedback && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  Imported {uploadFeedback.inserted} new rows, updated {uploadFeedback.updated}, skipped {uploadFeedback.skipped}, across {uploadFeedback.matched} matching columns.
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  Only matching column names are imported. This does not create new columns.
                </div>
                <button
                  type="submit"
                  disabled={uploadBusy || uploadRows.length === 0 || !uploadBoardKey || !uploadKeyMatch}
                  className="rounded-full px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ backgroundColor: 'var(--pulse-accent)' }}
                >
                  {uploadBusy ? 'Reading file...' : 'Apply import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

export default BoardWorkspacePage
