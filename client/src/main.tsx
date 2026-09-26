import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './features/dashboard/App'
import './shared/styles.css'
import './features/auth/onboarding.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)