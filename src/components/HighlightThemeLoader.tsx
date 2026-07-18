import { useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { Theme } from '../store/appStore'

const themeToHighlight: Record<Theme, string> = {
  light: 'github',
  paper: 'github',
  newsprint: 'github',
  dark: 'atom-one-dark',
  'github-dark': 'github-dark',
  monokai: 'monokai',
  nord: 'nord',
  dracula: 'monokai-sublime',
  solarized: 'paraiso-dark',
  'one-dark': 'atom-one-dark',
  material: 'androidstudio',
}

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles'

export const HighlightThemeLoader: React.FC = () => {
  const currentTheme = useAppStore(state => state.currentTheme)

  useEffect(() => {
    const hljsName = themeToHighlight[currentTheme] || 'github-dark'
    const href = `${CDN_BASE}/${hljsName}.min.css`

    let link = document.getElementById('hljs-theme') as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.id = 'hljs-theme'
      link.rel = 'stylesheet'
      document.head.appendChild(link)
    }
    link.href = href
  }, [currentTheme])

  return null
}
