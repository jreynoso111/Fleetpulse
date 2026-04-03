import { useState } from 'react'
import { usePulseWorkspace } from '../context/PulseWorkspaceContext'

const appearanceThemes = [
  { id: 'blue', label: 'Blue' },
  { id: 'amber', label: 'Amber' },
  { id: 'emerald', label: 'Emerald' },
  { id: 'rose', label: 'Rose' },
  { id: 'indigo', label: 'Indigo' },
  { id: 'teal', label: 'Teal' },
  { id: 'coral', label: 'Coral' },
  { id: 'violet', label: 'Violet' },
  { id: 'lime', label: 'Lime' },
  { id: 'copper', label: 'Copper' },
  { id: 'slate', label: 'Slate' },
]

function SettingsPage() {
  const { currentUser, settings, updateUserPreferences, workspaceUsers, manageWorkspaceUser } = usePulseWorkspace()
  const [adminMode, setAdminMode] = useState('create')
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    role: 'member',
    password: '',
  })
  const [adminMessage, setAdminMessage] = useState('')
  const [adminError, setAdminError] = useState('')
  const [adminSaving, setAdminSaving] = useState(false)

  async function handleAdminSubmit(event) {
    event.preventDefault()
    setAdminError('')
    setAdminMessage('')
    setAdminSaving(true)

    try {
      const payload = {
        mode: adminMode,
        name: adminForm.name,
        email: adminForm.email,
        role: adminForm.role,
        password: adminForm.password,
      }
      const result = await manageWorkspaceUser(payload)
      setAdminMessage(
        adminMode === 'create'
          ? `User ${result.email} was created successfully and will be asked to change the temporary password on first login.`
          : `Invitation sent to ${result.email}.`,
      )
      setAdminForm({ name: '', email: '', role: 'member', password: '' })
    } catch (error) {
      setAdminError(error.message)
    } finally {
      setAdminSaving(false)
    }
  }

  async function handleUserStatusToggle(user, nextMode) {
    const actionLabel = nextMode === 'block' ? 'block' : 'unblock'
    const confirmed = window.confirm(`Do you want to ${actionLabel} ${user.email}?`)
    if (!confirmed) return

    setAdminError('')
    setAdminMessage('')

    try {
      const result = await manageWorkspaceUser({
        mode: nextMode,
        userId: user.id,
      })

      setAdminMessage(
        result.disabled
          ? `User ${result.email} has been blocked.`
          : `User ${result.email} has been re-enabled.`,
      )
    } catch (error) {
      setAdminError(error.message)
    }
  }

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Settings</h1>
        <p className="max-w-2xl text-sm text-slate-600">
          Personalize Pulse for your own account, preferences, and daily workflow.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Profile</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">User</dt>
              <dd className="mt-1 font-medium text-slate-900">{currentUser?.name}</dd>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Email</dt>
              <dd className="mt-1 break-all font-medium text-slate-900">{currentUser?.email}</dd>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Role</dt>
              <dd className="mt-1 font-medium capitalize text-slate-900">{currentUser?.role}</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Appearance</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {appearanceThemes.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => updateUserPreferences({ themeAccent: theme.id })}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                  settings.themeAccent === theme.id
                    ? 'border-slate-900 text-slate-900'
                    : 'border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
                style={
                  settings.themeAccent === theme.id
                    ? { backgroundColor: 'var(--pulse-accent-soft)' }
                    : undefined
                }
              >
                <span
                  className="h-4 w-4 rounded-full border border-black/10"
                  style={{
                    background:
                      theme.id === 'blue'
                        ? '#2563eb'
                        : theme.id === 'amber'
                          ? '#d97706'
                          : theme.id === 'emerald'
                            ? '#059669'
                            : theme.id === 'rose'
                              ? '#e11d48'
                              : theme.id === 'indigo'
                                ? '#4f46e5'
                                : theme.id === 'teal'
                                  ? '#0f766e'
                                  : theme.id === 'coral'
                                    ? '#ea580c'
                                    : theme.id === 'violet'
                                      ? '#7c3aed'
                                      : theme.id === 'lime'
                                        ? '#65a30d'
                                        : theme.id === 'copper'
                                          ? '#b45309'
                                          : '#334155',
                  }}
                />
                <span>{theme.label}</span>
              </button>
            ))}
          </div>
        </article>

        {currentUser?.role === 'admin' && (
          <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft xl:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">User access</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Create users, send invites, and block or re-enable workspace access.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-1">
                {['create', 'invite'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setAdminMode(mode)
                      setAdminError('')
                      setAdminMessage('')
                    }}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                      adminMode === mode
                        ? 'bg-white text-slate-900 shadow-soft'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <form className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px_180px_auto]" onSubmit={handleAdminSubmit}>
              <label className="space-y-1">
                <span className="text-slate-500">Name</span>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-sky-200 focus:ring"
                  value={adminForm.name}
                  onChange={(event) => setAdminForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Full name"
                />
              </label>
              <label className="space-y-1">
                <span className="text-slate-500">Email</span>
                <input
                  type="email"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-sky-200 focus:ring"
                  value={adminForm.email}
                  onChange={(event) => setAdminForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="name@company.com"
                />
              </label>
              <label className="space-y-1">
                <span className="text-slate-500">Role</span>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none ring-sky-200 focus:ring"
                  value={adminForm.role}
                  onChange={(event) => setAdminForm((current) => ({ ...current, role: event.target.value }))}
                >
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                  <option value="analyst">Analyst</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              {adminMode === 'create' ? (
                <label className="space-y-1">
                  <span className="text-slate-500">Temporary password</span>
                  <input
                    type="password"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-sky-200 focus:ring"
                    value={adminForm.password}
                    onChange={(event) => setAdminForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder="Temporary password"
                  />
                  <p className="text-[11px] text-slate-500">
                    The user will be required to change this password on first login.
                  </p>
                </label>
              ) : (
                <div className="space-y-1">
                  <span className="text-slate-500">Delivery</span>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    Email invite
                  </div>
                </div>
              )}
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={adminSaving}
                  className="w-full rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ backgroundColor: 'var(--pulse-accent)' }}
                >
                  {adminSaving ? 'Saving...' : adminMode === 'create' ? 'Create user' : 'Send invite'}
                </button>
              </div>
            </form>

            {(adminMessage || adminError) && (
              <div
                className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
                  adminError
                    ? 'border-rose-200 bg-rose-50 text-rose-700'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                }`}
              >
                {adminError || adminMessage}
              </div>
            )}

            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
              <div className="grid min-w-[760px] grid-cols-[minmax(0,1fr)_minmax(0,1fr)_100px_100px_140px] gap-3 bg-slate-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                <span>Name</span>
                <span>Email</span>
                <span>Role</span>
                <span>Status</span>
                <span className="text-right">Action</span>
              </div>
              <div className="divide-y divide-slate-200 bg-white">
                {workspaceUsers.map((user) => (
                  <div key={user.id} className="grid min-w-[760px] grid-cols-[minmax(0,1fr)_minmax(0,1fr)_100px_100px_140px] gap-3 px-4 py-3 text-sm">
                    <span className="font-medium text-slate-900">{user.name}</span>
                    <span className="truncate text-slate-600">{user.email}</span>
                    <span className="capitalize text-slate-600">{user.role}</span>
                    <span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                          user.disabled
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {user.disabled ? 'Blocked' : 'Active'}
                      </span>
                    </span>
                    <span className="text-right">
                      {user.id !== currentUser?.id && (
                        <button
                          type="button"
                          onClick={() => handleUserStatusToggle(user, user.disabled ? 'unblock' : 'block')}
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                            user.disabled
                              ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                          }`}
                        >
                          {user.disabled ? 'Unblock' : 'Block'}
                        </button>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </article>
        )}
      </div>
    </section>
  )
}

export default SettingsPage
