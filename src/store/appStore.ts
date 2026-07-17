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
  zoomLevel: number
  contentWidth: 'full' | 'medium' | 'a4'
  currentTheme: Theme
  currentFont: string
  openInNewTab: boolean
  isFullscreen: boolean

  // Actions
  addTab: (filePath: string, content: string, fileName: string, type?: 'markdown' | 'other') => void
  closeTab: (tabId: string) => void
  closeOtherTabs: (tabId: string) => void
  closeAllTabs: () => void
  setActiveTab: (tabId: string) => void
  toggleSidebar: () => void
  setZoomLevel: (level: number) => void
  toggleContentWidth: () => void
  setTheme: (theme: Theme) => void
  setCurrentFont: (fontId: string) => void
  setOpenInNewTab: (value: boolean) => void
  setIsFullscreen: (value: boolean) => void
  setDirFiles: (files: DirFile[]) => void
  navigateToAdjacentFile: (direction: 'prev' | 'next') => Promise<void>
}

export const useAppStore = create<AppState>((set, get) => ({
  // File state
  tabs: [],
  activeTabId: null,
  dirFiles: [],
  
  // UI state
  sidebarOpen: true,
  zoomLevel: 100,
  contentWidth: 'full',
  currentTheme: 'github-dark',
  currentFont: 'default',
  openInNewTab: true,
  isFullscreen: false,
  
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

  setOpenInNewTab: (value) => set({ openInNewTab: value }),

  setIsFullscreen: (value) => set({ isFullscreen: value }),

  setDirFiles: (files) => set({ dirFiles: files }),

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
