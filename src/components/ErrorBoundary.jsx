import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || '' }
  }

  componentDidCatch(error) {
    console.error('Pulse runtime error:', error)
  }

  componentDidMount() {
    window.addEventListener('hashchange', this.handleRouteChange)
  }

  componentWillUnmount() {
    window.removeEventListener('hashchange', this.handleRouteChange)
  }

  handleRouteChange = () => {
    if (this.state.hasError) {
      this.setState({ hasError: false, message: '' })
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoToBoards = () => {
    this.setState({ hasError: false, message: '' }, () => {
      window.location.hash = '#/app/boards'
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
          <div className="w-full max-w-md rounded-xl border border-rose-200 bg-white p-6 text-center shadow-soft">
            <h1 className="text-lg font-semibold text-slate-900">Something went wrong</h1>
            <p className="mt-2 text-sm text-slate-500">
              The app hit an unexpected error. Please reload to continue.
            </p>
            {this.state.message && (
              <p className="mt-3 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {this.state.message}
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                onClick={this.handleGoToBoards}
              >
                Back to boards
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                onClick={this.handleReload}
              >
                Reload app
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
