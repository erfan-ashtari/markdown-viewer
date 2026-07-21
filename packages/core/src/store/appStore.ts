import { create } from 'zustand'

export type Theme = 'light' | 'dark' | 'github-dark' | 'monokai' | 'nord' | 'dracula' | 'solarized' | 'one-dark' | 'material' | 'paper' | 'newsprint'

export interface Tab {
  id: string
  filePath: string
  fileName: string
  content: string
  type: 'markdown' | 'other'
}

interface DirFile {
  name: string
  path: string
}

interface AppState {
  // File state
  tabs: Tab[]
  activeTabId: string | null
  dirFiles: DirFile[]

  // UI state
  sidebarOpen: boolean
  sidebarWidth: number
  rightSidebarOpen: boolean
  zoomLevel: number
  contentWidth: 'full' | 'medium' | 'a4'
  currentTheme: Theme
  currentFont: string
  isFullscreen: boolean

  // Plugin state
  enabledPlugins: string[]
  runtimeExporters: Array<{ id: string; name: string; description: string }>
  runtimeCommands: Array<{ id: string; name: string; description: string; when?: string }>
  currentFile: { filePath: string; fileName: string; content: string } | null
  currentDirectory: string | null

  // Actions
  addTab: (filePath: string, content: string, fileName: string, type?: 'markdown' | 'other') => void
  removeTab: (tabId: string) => void
  closeTab: (tabId: string) => void
  closeOtherTabs: (tabId: string) => void
  closeAllTabs: () => void
  setActiveTab: (tabId: string) => void
  toggleSidebar: () => void
  setSidebarWidth: (width: number) => void
  toggleRightSidebar: () => void
  setZoomLevel: (level: number) => void
  toggleContentWidth: () => void
  setTheme: (theme: Theme) => void
  setCurrentFont: (fontId: string) => void
  setIsFullscreen: (value: boolean) => void
  setDirFiles: (files: DirFile[]) => void
  navigateToAdjacentFile: (direction: 'prev' | 'next') => Promise<void>
  enablePlugin: (name: string) => void
  disablePlugin: (name: string) => void
  setRuntimeExporters: (items: Array<{ id: string; name: string; description: string }>) => void
  setRuntimeCommands: (items: Array<{ id: string; name: string; description: string; when?: string }>) => void
  setCurrentFile: (file: { filePath: string; fileName: string; content: string } | null) => void
  setCurrentDirectory: (dir: string | null) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // File state
  tabs: [],
  activeTabId: null,
  dirFiles: [],
  
  // UI state
  sidebarOpen: true,
  rightSidebarOpen: false,
  enabledPlugins: JSON.parse(typeof localStorage !== 'undefined' ? localStorage.getItem('mdview-enabled-plugins') || '[]' : '[]'),
  sidebarWidth: 260,
  zoomLevel: 100,
  contentWidth: 'full',
  currentTheme: 'github-dark',
  currentFont: 'default',
  isFullscreen: false,

  // Runtime plugin state
  runtimeExporters: [],
  runtimeCommands: [],
  currentFile: null,
  currentDirectory: null,
  
  // Actions
  addTab: (filePath, content, fileName, type = 'markdown') => {
    const state = get()
    const existingTab = state.tabs.find(t => t.filePath === filePath)

    if (existingTab) {
      set({ activeTabId: existingTab.id })
    } else {
      const newTab: Tab = {
        id: `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        filePath,
        fileName,
        content,
        type,
      }
      set({
        tabs: [...state.tabs, newTab],
        activeTabId: newTab.id,
      })
    }
  },

  removeTab: (tabId) => {
    const state = get()
    const newTabs = state.tabs.filter(t => t.id !== tabId)
    let newActiveTabId = state.activeTabId
    if (state.activeTabId === tabId) {
      const idx = state.tabs.findIndex(t => t.id === tabId)
      newActiveTabId = newTabs.length > 0 ? newTabs[Math.min(idx, newTabs.length - 1)].id : null
    }
    set({ tabs: newTabs, activeTabId: newActiveTabId })
  },

  closeTab: (tabId) => {
    const state = get()
    const newTabs = state.tabs.filter(t => t.id !== tabId)
    let newActiveTabId = state.activeTabId
    
    if (state.activeTabId === tabId) {
      // If closing the active tab, activate the next tab or the previous one
      const closedTabIndex = state.tabs.findIndex(t => t.id === tabId)
      if (newTabs.length > 0) {
        newActiveTabId = newTabs[Math.min(closedTabIndex, newTabs.length - 1)].id
      } else {
        newActiveTabId = null
      }
    }
    
    set({
      tabs: newTabs,
      activeTabId: newActiveTabId,
    })
  },

  closeOtherTabs: (tabId) => {
    const state = get()
    const kept = state.tabs.filter(t => t.id === tabId)
    set({
      tabs: kept,
      activeTabId: tabId,
    })
  },

  closeAllTabs: () => {
    set({ tabs: [], activeTabId: null })
  },

  setActiveTab: (tabId) => set({ activeTabId: tabId }),
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  setSidebarWidth: (width) => set({ sidebarWidth: Math.max(180, Math.min(500, width)) }),
  
  toggleRightSidebar: () => set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),
  
  setZoomLevel: (level) => set({
    zoomLevel: Math.max(50, Math.min(300, level)),
  }),

  toggleContentWidth: () => set((state) => ({
    contentWidth: state.contentWidth === 'full' ? 'medium' : state.contentWidth === 'medium' ? 'a4' : 'full',
  })),

  setTheme: (theme) => {
    document.documentElement.setAttribute('data-theme', theme)
    set({ currentTheme: theme })
  },

  setCurrentFont: (fontId) => {
    document.documentElement.setAttribute('data-font', fontId)
    set({ currentFont: fontId })
  },

  setIsFullscreen: (value) => set({ isFullscreen: value }),

  setDirFiles: (files) => set({ dirFiles: files }),
  setRuntimeExporters: (items) => set({ runtimeExporters: items }),
  setRuntimeCommands: (items) => set({ runtimeCommands: items }),

  enablePlugin: (name) => {
    const current = get().enabledPlugins
    if (!current.includes(name)) {
      const updated = [...current, name]
      localStorage.setItem('mdview-enabled-plugins', JSON.stringify(updated))
      set({ enabledPlugins: updated })
    }
  },

  disablePlugin: (name) => {
    const updated = get().enabledPlugins.filter(n => n !== name)
    localStorage.setItem('mdview-enabled-plugins', JSON.stringify(updated))
    set({ enabledPlugins: updated })
  },

  setCurrentFile: (file) => set({ currentFile: file }),
  setCurrentDirectory: (dir) => set({ currentDirectory: dir }),

  navigateToAdjacentFile: async (direction) => {
    const state = get()
    const activeTab = state.tabs.find(t => t.id === state.activeTabId)
    if (!activeTab || activeTab.type !== 'markdown') return

    const currentIndex = state.dirFiles.findIndex(f => f.path === activeTab.filePath)
    if (currentIndex === -1) return

    const targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1
    if (targetIndex < 0 || targetIndex >= state.dirFiles.length) return

    const targetFile = state.dirFiles[targetIndex]
    try {
      const result = await window.electronAPI?.readFile(targetFile.path)
      if (result) {
        // Update existing tab content
        set({
          tabs: state.tabs.map(t =>
            t.id === state.activeTabId
              ? { ...t, filePath: result.filePath, fileName: result.fileName, content: result.content }
              : t
          ),
        })
      }
    } catch (error) {
      console.error('Failed to navigate to file:', error)
    }
  },
}))
