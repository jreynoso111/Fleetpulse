import { PencilLine } from 'lucide-react'
import { useEffect, useState } from 'react'
import { usePulseWorkspace } from '../context/PulseWorkspaceContext'

const appearanceThemes = [
  { id: 'blue', label: 'Blue', swatch: '#2563eb' },
  { id: 'amber', label: 'Amber', swatch: '#d97706' },
  { id: 'emerald', label: 'Emerald', swatch: '#059669' },
  { id: 'rose', label: 'Rose', swatch: '#e11d48' },
  { id: 'indigo', label: 'Indigo', swatch: '#4f46e5' },
  { id: 'teal', label: 'Teal', swatch: '#0f766e' },
  { id: 'coral', label: 'Coral', swatch: '#ea580c' },
  { id: 'violet', label: 'Violet', swatch: '#7c3aed' },
  { id: 'lime', label: 'Lime', swatch: '#65a30d' },
  { id: 'copper', label: 'Copper', swatch: '#b45309' },
  { id: 'slate', label: 'Slate', swatch: '#334155' },
  { id: 'blue-inverted', label: 'Blue Inverted', swatch: 'linear-gradient(135deg, #1d4ed8 0%, #bfdbfe 100%)' },
  { id: 'emerald-inverted', label: 'Emerald Inverted', swatch: 'linear-gradient(135deg, #047857 0%, #a7f3d0 100%)' },
  { id: 'rose-inverted', label: 'Rose Inverted', swatch: 'linear-gradient(135deg, #be123c 0%, #fecdd3 100%)' },
  { id: 'slate-inverted', label: 'Slate Inverted', swatch: 'linear-gradient(135deg, #1f2937 0%, #cbd5e1 100%)' },
]

function SettingsPage() {
  const { changePassword, currentUser, settings, updateCurrentUserProfile, updateUserPreferences, workspaceUsers, manageWorkspaceUser } = usePulseWorkspace()
  const [adminMode, setAdminMode] = useState('create')
  const [profileForm, setProfileForm] = useState({ name: '', email: '' })
  const [passwordForm, setPasswordForm] = useState({ password: '', confirmPassword: '' })
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [showProfileEditor, setShowProfileEditor] = useState(false)
  const [showPasswordEditor, setShowPasswordEditor] = useState(false)
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    role: 'member',
    password: '',
  })
  const [adminMessage, setAdminMessage] = useState('')
  const [adminError, setAdminError] = useState('')
  const [adminSaving, setAdminSaving] = useState(false)

  useEffect(() => {
    setProfileForm({
      name: currentUser?.name || '',
      email: currentUser?.email || '',
    })
  }, [currentUser?.email, currentUser?.name])

  async function handleProfileSubmit(event) {
    event.preventDefault()
    setProfileError('')
    setProfileMessage('')
    setProfileSaving(true)

    try {
      await updateCurrentUserProfile(profileForm)
      setProfileMessage('Profile updated successfully.')
      setShowProfileEditor(false)
    } catch (error) {
      setProfileError(error.message)
    } finally {
      setProfileSaving(false)
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault()
    setPasswordError('')
    setPasswordMessage('')

    if (passwordForm.password.length < 6) {
      setPasswordError('Password must be at least 6 characters.')
      return
    }

    if (passwordForm.password !== passwordForm.confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }

    setPasswordSaving(true)

    try {
      await changePassword(passwordForm.password)
      setPasswordMessage('Password updated successfully.')
      setPasswordForm({ password: '', confirmPassword: '' })
      setShowPasswordEditor(false)
    } catch (error) {
      setPasswordError(error.message)
    } finally {
      setPasswordSaving(false)
    }
  }

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

  async function handleUserDelete(user) {
    const confirmed = window.confirm(`Delete ${user.email}? This will remove the user from Pulse permanently.`)
    if (!confirmed) return

    setAdminError('')
    setAdminMessage('')

    try {
      const result = await manageWorkspaceUser({
        mode: 'delete',
        userId: user.id,
      })

      setAdminMessage(`User ${result.email} was deleted successfully.`)
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
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Profile</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPasswordError('')
                  setPasswordMessage('')
                  setPasswordForm({ password: '', confirmPassword: '' })
                  setShowPasswordEditor(true)
                }}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:bg-slate-50"
              >
                Change password
              </button>
              <button
                type="button"
                onClick={() => {
                  setProfileError('')
                  setProfileMessage('')
                  setShowProfileEditor(true)
                }}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:bg-slate-50"
              >
                <PencilLine size={13} />
                Edit
              </button>
            </div>
          </div>
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
          {(profileMessage || profileError || passwordMessage || passwordError) && (
            <div
              className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
                profileError || passwordError
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
            >
              {profileError || passwordError || profileMessage || passwordMessage}
            </div>
          )}
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
                  style={{ background: theme.swatch }}
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
                    <span className="flex justify-end gap-2">
                      {user.id !== currentUser?.id && (
                        <>
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
                          <button
                            type="button"
                            onClick={() => handleUserDelete(user)}
                            className="rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </article>
        )}
      </div>

      {showProfileEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[1.5rem] border border-white/60 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-slate-900">Edit profile</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Update the information attached to your Pulse account.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileEditor(false)}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <form className="mt-5 space-y-4" onSubmit={handleProfileSubmit}>
              <label className="block space-y-1">
                <span className="text-sm text-slate-500">Name</span>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-sky-200 focus:ring"
                  value={profileForm.name}
                  onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Full name"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-sm text-slate-500">Email</span>
                <input
                  type="email"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-sky-200 focus:ring"
                  value={profileForm.email}
                  onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="name@company.com"
                />
              </label>

              {profileError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {profileError}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProfileEditor(false)}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ backgroundColor: 'var(--pulse-accent)' }}
                >
                  {profileSaving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPasswordEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[1.5rem] border border-white/60 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-slate-900">Change password</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Update your password for future sign-ins.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordEditor(false)}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <form className="mt-5 space-y-4" onSubmit={handlePasswordSubmit}>
              <label className="block space-y-1">
                <span className="text-sm text-slate-500">New password</span>
                <input
                  type="password"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-sky-200 focus:ring"
                  value={passwordForm.password}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Enter new password"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-sm text-slate-500">Confirm password</span>
                <input
                  type="password"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-sky-200 focus:ring"
                  value={passwordForm.confirmPassword}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                  placeholder="Confirm new password"
                />
              </label>

              {passwordError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {passwordError}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordEditor(false)}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ backgroundColor: 'var(--pulse-accent)' }}
                >
                  {passwordSaving ? 'Saving...' : 'Update password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

export default SettingsPage
