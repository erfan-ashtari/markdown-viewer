import { useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { getFontCombo } from './Themes/fontDefinitions'

export const FontLoader: React.FC = () => {
  const currentFont = useAppStore(state => state.currentFont)

  useEffect(() => {
    const combo = getFontCombo(currentFont)

    // Remove existing font style if any
    const existing = document.getElementById('dynamic-font-style')
    if (existing) existing.remove()

    // Inject @import or link for Google Fonts
    if (combo.import) {
      if (combo.import.endsWith('.css')) {
        // Direct CSS file (e.g. IRANSans)
        const link = document.createElement('link')
        link.id = 'dynamic-font-style'
        link.rel = 'stylesheet'
        link.href = combo.import
        document.head.appendChild(link)
      } else {
        // Google Fonts @import
        const style = document.createElement('style')
        style.id = 'dynamic-font-style'
        style.textContent = `@import url('${combo.import}');`
        document.head.appendChild(style)
      }
    }

    // Apply CSS custom properties for fonts
    document.documentElement.style.setProperty('--font-body', combo.body)
    document.documentElement.style.setProperty('--font-heading', combo.heading)
    document.documentElement.style.setProperty('--font-code', combo.code)
    document.documentElement.style.setProperty('--font-math', combo.math)
  }, [currentFont])

  return null
}
