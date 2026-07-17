import React, { useEffect, useCallback } from 'react'
import { useAppStore } from './store/appStore'
import { Sidebar } from './components/Layout/Sidebar'
import { Header } from './components/Layout/Header'
import { Tabs } from './components/Layout/Tabs'
import { MarkdownRenderer } from './components/Markdown/MarkdownRenderer'
import { FontLoader } from './components/FontLoader'
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

  // Keyboard shortcuts for zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault()
        setZoomLevel(zoomLevel + 10)
      } else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault()
        setZoomLevel(zoomLevel - 10)
      } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault()
        setZoomLevel(100)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [zoomLevel, setZoomLevel])

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
    window.electronAPI?.onLoadFile?.((data: { content: string; fileName: string; filePath: string }) => {
      const isMd = /\.(md|markdown)$/i.test(data.fileName)
      addTab(data.filePath, data.content, data.fileName, isMd ? 'markdown' : 'other')
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

  const handleNonMarkdownFile = (path: string, name: string) => {
    addTab(path, '', name, 'other')
  }

  const handleTabSelect = (tab: any) => {
    // Tab is already activated in the Tabs component
  }

  const handleExportPDF = async () => {
    if (!activeTab) return
    
    try {
      // Dynamic import for html2canvas and jspdf
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')
      
      const markdownBody = document.querySelector('.markdown-body')
      if (!markdownBody) return
      
      const canvas = await html2canvas(markdownBody as HTMLElement, {
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim(),
        scale: 2,
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`${activeTab.fileName.replace(/\.md$/, '')}.pdf`)
    } catch (error) {
      console.error('Export PDF failed:', error)
      alert('Failed to export PDF. Please try again.')
    }
  }

  const handleExportHTML = () => {
    if (!activeTab) return
    
    const markdownBody = document.querySelector('.markdown-body')
    if (!markdownBody) return
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${activeTab.fileName}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
      line-height: 1.6;
      color: #24292e;
      background-color: #ffffff;
    }
    /* Add your styles here */
  </style>
</head>
<body>
  ${markdownBody.innerHTML}
</body>
</html>
    `
    
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeTab.fileName.replace(/\.md$/, '')}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
    }}>
      <FontLoader />
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
        />
        
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <Tabs onTabSelect={handleTabSelect} isFullscreen={isFullscreen} />
          
          <div style={{ 
            flex: 1, 
            overflow: 'auto',
            backgroundColor: 'var(--bg-primary)',
          }}>
            {activeTab ? (
              activeTab.type === 'markdown' ? (
                <MarkdownRenderer
                  content={activeTab.content}
                  zoomLevel={zoomLevel}
                  contentWidth={contentWidth}
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
                      This file type cannot be previewed
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
