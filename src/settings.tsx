import React from 'react'
import ReactDOM from 'react-dom/client'
import { SettingsWindow } from './components/Settings/SettingsWindow'
import './styles/globals.css'

// Apply saved theme
const savedTheme = localStorage.getItem('markdown-viewer-theme') || 'github-dark'
document.documentElement.setAttribute('data-theme', savedTheme)

// Apply saved font
const savedFont = localStorage.getItem('markdown-viewer-font') || 'default'
document.documentElement.setAttribute('data-font', savedFont)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SettingsWindow />
  </React.StrictMode>
)
