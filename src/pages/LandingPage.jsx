import { Link } from 'react-router-dom'

function LandingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12 text-slate-900">
      <section className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-soft sm:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">FleetOS</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Gestiona tu operación en un solo lugar</h1>
        <p className="mt-4 max-w-2xl text-sm text-slate-600 sm:text-base">
          Esta landing confirma que la aplicación está accesible y te permite entrar al panel principal con un clic.
          Desde ahí puedes revisar dashboard, tableros, automatizaciones y configuración.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/app/dashboard"
            className="inline-flex items-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Entrar al panel
          </Link>
          <Link
            to="/app/boards"
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Ver tableros
          </Link>
        </div>
      </section>
    </main>
  )
}

export default LandingPage
