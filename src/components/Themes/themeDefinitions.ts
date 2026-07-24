import { Theme } from '../../store/appStore'

export interface ThemeConfig {
  name: string
  description: string
  isDark: boolean
}

export const themes: Record<Theme, ThemeConfig> = {
  light: {
    name: 'Light',
    description: 'Clean light theme',
    isDark: false,
  },
  dark: {
    name: 'Dark',
    description: 'Classic dark theme',
    isDark: true,
  },
  'github-dark': {
    name: 'GitHub Dark',
    description: 'GitHub-inspired dark theme',
    isDark: true,
  },
  monokai: {
    name: 'Monokai',
    description: 'Popular code editor theme',
    isDark: true,
  },
  nord: {
    name: 'Nord',
    description: 'Arctic, north-bluish theme',
    isDark: true,
  },
  dracula: {
    name: 'Dracula',
    description: 'Dark theme with purple accents',
    isDark: true,
  },
  solarized: {
    name: 'Solarized',
    description: 'Precision colors for machines and people',
    isDark: true,
  },
  'one-dark': {
    name: 'One Dark',
    description: 'Atom One Dark theme',
    isDark: true,
  },
  material: {
    name: 'Material',
    description: 'Material Design inspired theme',
    isDark: true,
  },
  paper: {
    name: 'Paper',
    description: 'Light paper-like theme',
    isDark: false,
  },
  newsprint: {
    name: 'Newsprint',
    description: 'Vintage newspaper style',
    isDark: false,
  },
}

export const themeList = Object.entries(themes).map(([key, value]) => ({
  id: key as Theme,
  ...value,
}))
