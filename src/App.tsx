import React, { useEffect, useState, useRef } from 'react'
import { useAppStore } from './store/appStore'
import { Sidebar } from './components/Layout/Sidebar'
import { Header } from './components/Layout/Header'
import { Tabs } from './components/Layout/Tabs'
import { MarkdownRenderer } from './components/Markdown/MarkdownRenderer'
import { TextRenderer } from './components/Text/TextRenderer'
import { FindBar } from './components/FindBar/FindBar'
import { FontLoader } from './components/FontLoader'
import { HighlightThemeLoader } from './components/HighlightThemeLoader'
import { ExportManager } from './export/ExportManager'
import { ExportFormat } from './export/types/ExportOptions'
import {
  File, FileText, FileCode, FileImage, FileJson, FileCog, FileArchive
} from 'lucide-react'

const getFileIconLarge = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase()
  const iconProps = { size: 48, strokeWidth: 1.2 }

  switch (ext) {
    case 'js': case 'ts': case 'jsx': case 'tsx': case 'py': case 'java':
    case 'cpp': case 'c': case 'h': case 'cs': case 'go': case 'rs': case 'rb':
      return <FileCode {...iconProps} style={{ color: '#f0db4f', opacity: 0.7 }} />
    case 'json':
      return <FileJson {...iconProps} style={{ color: '#a8b9ff', opacity: 0.7 }} />
    case 'png': case 'jpg': case 'jpeg': case 'gif': case 'svg': case 'webp':
      return <FileImage {...iconProps} style={{ color: '#c9a0dc', opacity: 0.7 }} />
    case 'zip': case 'tar': case 'gz': case 'rar':
      return <FileArchive {...iconProps} style={{ color: '#f97583', opacity: 0.7 }} />
    case 'yml': case 'yaml': case 'toml': case 'ini': case 'env':
      return <FileCog {...iconProps} style={{ color: '#8b949e', opacity: 0.7 }} />
    case 'pdf':
      return <FileText {...iconProps} style={{ color: '#f97583', opacity: 0.7 }} />
    default:
      return <File {...iconProps} style={{ color: '#8b949e', opacity: 0.7 }} />
  }
}

const exportManager = ExportManager.create()

const App: React.FC = () => {
  const {
    tabs,
    activeTabId,
    sidebarOpen,
    zoomLevel,
    contentWidth,
    currentFont,
    setZoomLevel,
    addTab,
    setTheme,
    currentTheme
  } = useAppStore()

  const activeTab = tabs.find(t => t.id === activeTabId)
  const isFullscreen = useAppStore(state => state.isFullscreen)
  const [dirToLoad, setDirToLoad] = useState<string | null>(null)
  const [findOpen, setFindOpen] = useState(false)
  const contentContainerRef = useRef<HTMLDivElement>(null)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return

      const ctrl = e.ctrlKey || e.metaKey
      const state = useAppStore.getState()

      // Ctrl+Tab / Ctrl+Shift+Tab — navigate between tabs
      if (ctrl && e.key === 'Tab') {
        e.preventDefault()
        const { tabs, activeTabId } = state
        if (tabs.length <= 1) return
        const currentIndex = tabs.findIndex(t => t.id === activeTabId)
        const nextIndex = e.shiftKey
          ? (currentIndex - 1 + tabs.length) % tabs.length
          : (currentIndex + 1) % tabs.length
        state.setActiveTab(tabs[nextIndex].id)
        return
      }

      // Ctrl+=/Ctrl++ — zoom in
      if (ctrl && (e.key === '=' || e.key === '+')) {
        e.preventDefault()
        state.setZoomLevel(state.zoomLevel + 10)
        return
      }

      // Ctrl+- — zoom out
      if (ctrl && e.key === '-') {
        e.preventDefault()
        state.setZoomLevel(state.zoomLevel - 10)
        return
      }

      // Ctrl+0 — reset zoom
      if (ctrl && e.key === '0') {
        e.preventDefault()
        state.setZoomLevel(100)
        return
      }

      // Ctrl+Shift+W — toggle width mode
      if (ctrl && e.shiftKey && e.key === 'W') {
        e.preventDefault()
        state.toggleContentWidth()
        return
      }

      // Ctrl+F — open find bar
      if (ctrl && e.key === 'f') {
        e.preventDefault()
        setFindOpen(true)
        return
      }

      // Ctrl+Shift+F — toggle fullscreen
      if (ctrl && e.shiftKey && e.key === 'F') {
        e.preventDefault()
        document.documentElement.requestFullscreen?.()
        return
      }

      // Ctrl+Shift+B — toggle sidebar
      if (ctrl && e.shiftKey && e.key === 'B') {
        e.preventDefault()
        state.toggleSidebar()
        return
      }

      // Ctrl+1..9 — switch to tab by position
      if (ctrl && e.key >= '1' && e.key <= '9') {
        e.preventDefault()
        const index = parseInt(e.key) - 1
        if (index < state.tabs.length) {
          state.setActiveTab(state.tabs[index].id)
        }
        return
      }

      // Ctrl+W — close current tab
      if (ctrl && e.key === 'w') {
        e.preventDefault()
        if (state.activeTabId) {
          state.closeTab(state.activeTabId)
        }
        return
      }

      // ArrowLeft / ArrowRight — navigate between .md files in directory
      if (e.key === 'ArrowLeft' && !ctrl) {
        e.preventDefault()
        state.navigateToAdjacentFile('prev')
        return
      }
      if (e.key === 'ArrowRight' && !ctrl) {
        e.preventDefault()
        state.navigateToAdjacentFile('next')
        return
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Fetch directory .md files when active tab changes
  useEffect(() => {
    if (!activeTab || activeTab.type !== 'markdown') return
    const dir = activeTab.filePath.replace(/[\\/][^\\/]+$/, '')
    window.electronAPI?.listMdFiles(dir).then((files) => {
      if (files) useAppStore.getState().setDirFiles(files)
    })
  }, [activeTab?.id])

  // Listen for settings changes from the settings window
  useEffect(() => {
    window.electronAPI?.onSettingsChanged?.((data: { key: string; value: any }) => {
      const state = useAppStore.getState()
      switch (data.key) {
        case 'theme':
          state.setTheme(data.value)
          break
        case 'font':
          state.setCurrentFont(data.value)
          break
        case 'contentWidth':
          useAppStore.setState({ contentWidth: data.value })
          break
        case 'zoomLevel':
          state.setZoomLevel(data.value)
          break
      }
    })
  }, [])

  // Handle file opening from OS (double-click, right-click Open with)
  // Reuses existing buildFileTree + readFile methods — same flow as clicking in sidebar
  useEffect(() => {
    window.electronAPI?.onFileAssociationOpen?.((data: { filePath: string; dirPath: string }) => {
      const state = useAppStore.getState()
      // 1. Open sidebar and load folder tree (same as user selecting a folder)
      if (!state.sidebarOpen) useAppStore.setState({ sidebarOpen: true })
      setDirToLoad(data.dirPath)
      window.electronAPI?.listMdFiles(data.dirPath).then((files) => {
        if (files) useAppStore.getState().setDirFiles(files)
      })
      // 2. Read the file and open it as a tab (same as user clicking a file in sidebar)
      window.electronAPI?.readFile(data.filePath).then((result) => {
        if (result) {
          useAppStore.getState().addTab(result.filePath, result.content, result.fileName, 'markdown')
        }
      })
    })
    window.electronAPI?.rendererReady?.()
  }, [])

  // Detect fullscreen changes via Electron IPC
  useEffect(() => {
    const handleFullscreenChanged = (isFs: boolean) => {
      useAppStore.getState().setIsFullscreen(isFs)
      if (isFs) {
        const { sidebarOpen } = useAppStore.getState()
        if (sidebarOpen) {
          useAppStore.getState().toggleSidebar()
        }
      }
    }
    window.electronAPI?.onFullscreenChanged?.(handleFullscreenChanged)
  }, [])

  // Handle Select All from context menu
  useEffect(() => {
    window.electronAPI?.onSelectAll?.(() => {
      const markdownBody = document.querySelector('.markdown-body')
      if (markdownBody) {
        const range = document.createRange()
        range.selectNodeContents(markdownBody)
        const selection = window.getSelection()
        selection?.removeAllRanges()
        selection?.addRange(range)
      }
    })
  }, [])

  // Handle file loading in new windows
  useEffect(() => {
    window.electronAPI?.onLoadFile?.((data: { content: string; fileName: string; filePath: string; dirPath?: string }) => {
      const isMd = /\.(md|markdown)$/i.test(data.fileName)
      addTab(data.filePath, data.content, data.fileName, isMd ? 'markdown' : 'other')
      // If dirPath is provided (new window from file association or tab detach), open sidebar and load folder
      if (data.dirPath) {
        if (!useAppStore.getState().sidebarOpen) useAppStore.setState({ sidebarOpen: true })
        setDirToLoad(data.dirPath)
        window.electronAPI?.listMdFiles(data.dirPath).then((files) => {
          if (files) useAppStore.getState().setDirFiles(files)
        })
      }
    })
  }, [addTab])

  // Initialize theme from system preference or default
  useEffect(() => {
    const savedTheme = localStorage.getItem('markdown-viewer-theme') as any
    if (savedTheme) {
      setTheme(savedTheme)
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(prefersDark ? 'github-dark' : 'light')
    }
  }, [])

  // Save theme to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('markdown-viewer-theme', currentTheme)
  }, [currentTheme])

  // Save zoom level to localStorage
  useEffect(() => {
    localStorage.setItem('markdown-viewer-zoom', zoomLevel.toString())
  }, [zoomLevel])

  // Load zoom level from localStorage on mount
  useEffect(() => {
    const savedZoom = localStorage.getItem('markdown-viewer-zoom')
    if (savedZoom) {
      useAppStore.getState().setZoomLevel(parseInt(savedZoom, 10))
    }
    const savedWidth = localStorage.getItem('markdown-viewer-content-width') as 'full' | 'medium' | 'a4' | null
    if (savedWidth && (savedWidth === 'full' || savedWidth === 'medium' || savedWidth === 'a4')) {
      useAppStore.setState({ contentWidth: savedWidth })
    }
    const savedFont = localStorage.getItem('markdown-viewer-font')
    if (savedFont) {
      useAppStore.getState().setCurrentFont(savedFont)
    }
  }, [])

  // Save content width to localStorage
  useEffect(() => {
    localStorage.setItem('markdown-viewer-content-width', contentWidth)
  }, [contentWidth])

  // Save font to localStorage
  useEffect(() => {
    localStorage.setItem('markdown-viewer-font', currentFont)
  }, [currentFont])

  const handleFileSelect = (path: string, content: string, name: string) => {
    addTab(path, content, name, 'markdown')
  }

  const handleNonMarkdownFile = (path: string, content: string, name: string) => {
    addTab(path, content, name, 'other')
  }

  const handleTabSelect = () => {
    // Tab is already activated in the Tabs component
  }

  const handleExportPDF = async () => {
    if (!activeTab) return

    try {
      let pdfMargins = { top: 0, bottom: 0, left: 0, right: 0 }
      try {
        const saved = localStorage.getItem('markdown-viewer-local-settings')
        if (saved) {
          const settings = JSON.parse(saved)
          if (settings.pdfMargins) {
            pdfMargins = settings.pdfMargins
          }
        }
      } catch {}

      await exportManager.export({
        format: ExportFormat.PDF,
        markdown: activeTab.content,
        title: activeTab.fileName.replace(/\.md$/, ''),
        theme: currentTheme,
        pdfMargins,
      })
    } catch (error) {
      console.error('Export PDF failed:', error)
      alert('Failed to export PDF. Please try again.')
    }
  }

  const handleExportHTML = async () => {
    if (!activeTab) return

    try {
      await exportManager.export({
        format: ExportFormat.HTML,
        markdown: activeTab.content,
        title: activeTab.fileName.replace(/\.md$/, ''),
        theme: currentTheme,
      })
    } catch (error) {
      console.error('Export HTML failed:', error)
      alert('Failed to export HTML. Please try again.')
    }
  }

  // Handle drag and drop for .md files — read content via FileReader, get real path via webUtils
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy'
      }
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const files = Array.from(e.dataTransfer?.files || [])
      if (files.length === 0) return

      for (const file of files) {
        if (/\.(md|markdown)$/i.test(file.name)) {
          // Get real file path via webUtils (works in packaged Electron apps)
          let realPath: string | null = null
          try {
            realPath = window.electronAPI?.getPathForFile?.(file) || null
          } catch (_) {}

          const reader = new FileReader()
          reader.onload = () => {
            const content = reader.result as string
            const filePath = realPath || file.name
            const state = useAppStore.getState()
            state.addTab(filePath, content, file.name, 'markdown')
            if (!state.sidebarOpen) {
              state.toggleSidebar()
            }
            // Load directory listing for arrow-key navigation
            if (realPath) {
              const dir = realPath.replace(/[\\/][^\\/]+$/, '')
              window.electronAPI?.listMdFiles(dir).then((files) => {
                if (files) useAppStore.getState().setDirFiles(files)
              })
            }
          }
          reader.readAsText(file)
        }
      }
    }

    // Use capture phase to ensure our handler runs before any inner element handlers
    window.addEventListener('dragover', handleDragOver, true)
    window.addEventListener('drop', handleDrop, true)
    return () => {
      window.removeEventListener('dragover', handleDragOver, true)
      window.removeEventListener('drop', handleDrop, true)
    }
  }, [])

  return (
    <div
      style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
    }}>
      <FontLoader />
      <HighlightThemeLoader />
      {/* Fullscreen hover trigger zone */}
      {isFullscreen && (
        <div
          onMouseEnter={() => {
            useAppStore.getState().setIsFullscreen(true)
            // Trigger header visibility via a custom event
            window.dispatchEvent(new CustomEvent('fullscreen-hover-top'))
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            zIndex: 10001,
          }}
        />
      )}

      <Header
        onExportPDF={handleExportPDF}
        onExportHTML={handleExportHTML}
      />
      
      <div style={{ 
        display: 'flex', 
        flex: 1, 
        overflow: 'hidden' 
      }}>
        <Sidebar
          onFileSelect={handleFileSelect}
          onNonMarkdownFile={handleNonMarkdownFile}
          isOpen={sidebarOpen}
          dirToLoad={dirToLoad}
        />
        
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <Tabs onTabSelect={handleTabSelect} isFullscreen={isFullscreen} />
          
          <div
            ref={contentContainerRef}
            style={{
              flex: 1,
              overflow: 'auto',
              backgroundColor: 'var(--bg-primary)',
              position: 'relative',
            }}
          >
            {findOpen && activeTab && (
              <FindBar
                onClose={() => setFindOpen(false)}
                containerRef={contentContainerRef}
              />
            )}
            {activeTab ? (
              activeTab.type === 'markdown' ? (
                <MarkdownRenderer
                  content={activeTab.content}
                  zoomLevel={zoomLevel}
                  contentWidth={contentWidth}
                  onZoomChange={setZoomLevel}
                />
              ) : activeTab.content ? (
                <TextRenderer
                  content={activeTab.content}
                  fileName={activeTab.fileName}
                  zoomLevel={zoomLevel}
                  onZoomChange={setZoomLevel}
                />
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'var(--text-muted)',
                  gap: '16px',
                  padding: '2rem',
                }}>
                  {getFileIconLarge(activeTab.fileName)}
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '18px', marginBottom: '8px' }}>
                      {activeTab.fileName}
                    </p>
                    <p style={{ fontSize: '14px' }}>
                      Cannot preview this file type
                    </p>
                  </div>
                </div>
              )
            ) : (
              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--text-muted)',
                gap: '16px',
              }}>
                <svg 
                  width="64" 
                  height="64" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5"
                  style={{ opacity: 0.5 }}
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '18px', marginBottom: '8px' }}>
                    No file open
                  </p>
                  <p style={{ fontSize: '14px' }}>
                    Open a Markdown file from the sidebar or use File → Open
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
