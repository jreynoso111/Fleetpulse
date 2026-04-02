import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

const isAppRoute = window.location.pathname.startsWith('/app')
const rootElement = document.getElementById('root')
const landingElement = document.getElementById('marketing-landing')

if (isAppRoute && rootElement) {
  rootElement.hidden = false
  if (landingElement) landingElement.hidden = true

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </React.StrictMode>,
  )
} else {
  if (rootElement) rootElement.hidden = true
  if (landingElement) landingElement.hidden = false
}
