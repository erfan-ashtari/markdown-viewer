import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'
import { loadPlugins } from './pluginLoader'

// Load plugins before rendering (async — waits for third-party dynamic imports)
loadPlugins().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}).catch((err) => {
  console.error('Failed to load plugins:', err)
  // Render anyway — built-in plugins still work
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
})
