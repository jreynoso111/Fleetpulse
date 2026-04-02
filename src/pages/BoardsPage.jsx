import BoardTable from '../components/BoardTable'

function BoardsPage() {
  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Boards</h1>
        <p className="max-w-3xl text-sm text-slate-600">
          Monday-style operational board with editable cells, horizontal scrolling, sticky column headers, and clean
          Excel-like grid styling.
        </p>
      </div>

      <BoardTable />
    </section>
  )
}

export default BoardsPage
