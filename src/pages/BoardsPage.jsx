import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePulseWorkspace } from '../context/PulseWorkspaceContext'

function BoardsPage() {
  const navigate = useNavigate()
  const { boards, createBoard, deleteBoard, getBoardPermission } = usePulseWorkspace()
  const [currentPage, setCurrentPage] = useState(1)
  const [deletingBoardId, setDeletingBoardId] = useState('')
  const pageSize = 8
  const totalPages = Math.max(1, Math.ceil(boards.length / pageSize))
  const paginatedBoards = useMemo(
    () => boards.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [boards, currentPage, pageSize],
  )

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [totalPages])

  async function handleCreateBoard() {
    const createdBoard = await createBoard(`New board ${boards.length + 1}`)
    if (!createdBoard) return
    navigate(`/app/boards/${createdBoard.slug}`)
  }

  async function handleDeleteBoard(board) {
    const confirmed = window.confirm(
      `Delete board "${board.name}"? This removes it from Pulse for everyone who can access it.`,
    )
    if (!confirmed) return

    setDeletingBoardId(board.id)
    try {
      await deleteBoard(board.id)
    } catch (error) {
      console.error('Failed to delete board.', error)
      window.alert(error?.message || 'Unable to delete board.')
    } finally {
      setDeletingBoardId('')
    }
  }

  return (
    <section className="flex min-h-[calc(100vh-9rem)] flex-col">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Boards</h1>
            <p className="text-sm text-slate-600">
              Each board is its own workspace page. New boards open directly as a table, and inside the same page you
              can switch between Table, Kanban, and Gantt views.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreateBoard}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: 'var(--pulse-accent)' }}
          >
            <Plus size={16} />
            New board
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 shadow-soft">
          <span
            className="rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white"
            style={{ backgroundColor: 'var(--pulse-accent)' }}
          >
            Card
          </span>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
              {boards.length} boards
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
              Page {currentPage} of {totalPages}
            </span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {paginatedBoards.map((board) => (
            <article
              key={board.id}
              className="group flex min-h-64 flex-col rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-soft transition hover:-translate-y-1 hover:border-slate-300"
            >
              <Link to={`/app/boards/${board.slug}`} className="flex flex-1 flex-col">
                <div className="flex items-center justify-between gap-3">
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.24em]"
                    style={{
                      backgroundColor: 'var(--pulse-accent-soft)',
                      color: 'var(--pulse-accent)',
                    }}
                  >
                    Table
                  </span>
                  <span className="text-xs text-slate-400">{board.items.length} items</span>
                </div>

                <div className="mt-4 space-y-1.5">
                  <h2 className="text-base font-semibold text-slate-900 transition group-hover:text-slate-700">
                    {board.name}
                  </h2>
                  <p className="line-clamp-2 text-xs leading-5 text-slate-600">
                    {board.description}
                  </p>
                  <p className="text-xs font-medium text-slate-500">
                    Owner: <span className="text-slate-700">{board.ownerEmail}</span>
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
                    {board.columns.length} columns
                  </span>
                  <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
                    {board.items.length} rows
                  </span>
                </div>
              </Link>

              <div className="mt-5 flex justify-end">
                {getBoardPermission(board) === 'owner' && (
                  <button
                    type="button"
                    onClick={() => handleDeleteBoard(board)}
                    disabled={deletingBoardId === board.id}
                    className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 disabled:cursor-wait disabled:opacity-60"
                    aria-label={`Delete ${board.name}`}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    {deletingBoardId === board.id ? 'Deleting' : 'Delete'}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>

        {boards.length > pageSize && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            <div className="flex flex-wrap items-center gap-2">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`h-10 min-w-10 rounded-full px-3 text-sm font-semibold transition ${
                    currentPage === page
                      ? 'text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                  style={currentPage === page ? { backgroundColor: 'var(--pulse-accent)' } : undefined}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

export default BoardsPage
