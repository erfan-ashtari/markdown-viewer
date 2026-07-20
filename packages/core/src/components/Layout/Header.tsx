import React, { useState, useRef, useEffect, useMemo } from 'react'
import {
  PanelLeftClose,
  PanelLeft,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Palette,
  Download,
  FileText,
  Settings,
  Maximize2,
  FileOutput,
  Type
} from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { themeList } from '../Themes/themeDefinitions'
import { fontCombos } from '../Themes/fontDefinitions'
import { Slot } from '../Slot'

interface HeaderProps {
  onExportPDF: () => void
  onExportHTML: () => void
  pluginToolbarItems?: Array<{
    id: string
    icon: any
    tooltip: string
    onClick: () => void
  }>
}

export const Header: React.FC<HeaderProps> = React.memo(({ onExportPDF, onExportHTML, pluginToolbarItems = [] }) => {
  const sidebarOpen = useAppStore(s => s.sidebarOpen)
  const toggleSidebar = useAppStore(s => s.toggleSidebar)
  const zoomLevel = useAppStore(s => s.zoomLevel)
  const setZoomLevel = useAppStore(s => s.setZoomLevel)
  const contentWidth = useAppStore(s => s.contentWidth)
  const toggleContentWidth = useAppStore(s => s.toggleContentWidth)
  const currentTheme = useAppStore(s => s.currentTheme)
  const setTheme = useAppStore(s => s.setTheme)
  const currentFont = useAppStore(s => s.currentFont)
  const setCurrentFont = useAppStore(s => s.setCurrentFont)
  const tabs = useAppStore(s => s.tabs)
  const activeTabId = useAppStore(s => s.activeTabId)
  const isFullscreen = useAppStore(s => s.isFullscreen)

  const [showThemeMenu, setShowThemeMenu] = useState(false)
  const [showFontMenu, setShowFontMenu] = useState(false)
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const [headerVisible, setHeaderVisible] = useState(true)
  const [headerPinned, setHeaderPinned] = useState(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId), [tabs, activeTabId])

  // Close all menus when clicking outside
  useEffect(() => {
    if (!showThemeMenu && !showFontMenu && !showSettingsMenu) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowThemeMenu(false)
        setShowFontMenu(false)
        setShowSettingsMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showThemeMenu, showFontMenu, showSettingsMenu])

  // Auto-hide header in fullscreen
  useEffect(() => {
    if (!isFullscreen) {
      setHeaderVisible(true)
      setHeaderPinned(false)
      if (hideTimer.current) clearTimeout(hideTimer.current)
      return
    }

    // Start hidden after entering fullscreen
    const enterTimer = setTimeout(() => {
      if (!headerPinned) setHeaderVisible(false)
    }, 500)
    return () => clearTimeout(enterTimer)
  }, [isFullscreen])

  // Detect mouse near top edge in fullscreen
  useEffect(() => {
    if (!isFullscreen) return

    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY <= 4) {
        if (hideTimer.current) clearTimeout(hideTimer.current)
        setHeaderVisible(true)
      }
    }

    const handleFullscreenHover = () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
      setHeaderVisible(true)
    }

    document.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('fullscreen-hover-top', handleFullscreenHover)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('fullscreen-hover-top', handleFullscreenHover)
    }
  }, [isFullscreen])

  // Unpin header when clicking outside
  useEffect(() => {
    if (!headerPinned || !isFullscreen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setHeaderPinned(false)
        // Start hide timer
        hideTimer.current = setTimeout(() => setHeaderVisible(false), 300)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [headerPinned, isFullscreen])

  const handleHeaderMouseEnter = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    setHeaderVisible(true)
  }

  const handleHeaderMouseLeave = () => {
    if (!isFullscreen || headerPinned) return
    hideTimer.current = setTimeout(() => setHeaderVisible(false), 800)
  }

  const handleHeaderClick = () => {
    if (!isFullscreen) return
    setHeaderPinned(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    setHeaderVisible(true)
  }

  return (
    <div
      ref={headerRef}
      className="titlebar-drag-region"
      onMouseEnter={handleHeaderMouseEnter}
      onMouseLeave={handleHeaderMouseLeave}
      onClick={handleHeaderClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        height: '48px',
        backgroundColor: 'var(--header-bg)',
        borderBottom: '1px solid var(--border-color)',
        gap: '12px',
        ...(isFullscreen ? {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10000,
          transition: 'transform 0.3s ease, opacity 0.3s ease',
          transform: headerVisible ? 'translateY(0)' : 'translateY(-100%)',
          opacity: headerVisible ? 1 : 0,
        } : {}),
      }}
    >
      {/* Left side: Sidebar toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={toggleSidebar}
          style={{
            padding: '8px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
            e.currentTarget.style.color = 'var(--text-primary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }}
          title={sidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
        >
          {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
        </button>
        
        {activeTab && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            color: 'var(--text-secondary)',
            fontSize: '13px',
          }}>
            <FileText size={14} />
            <span>{activeTab.fileName}</span>
          </div>
        )}

        {/* Plugin slot for header-right */}
        <Slot name="header-right" />

        {/* Plugin toolbar items */}
        {pluginToolbarItems.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            style={{
              padding: '6px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
            title={item.tooltip}
          >
            <item.icon size={16} />
          </button>
        ))}
      </div>

      {/* Center: Zoom controls */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '4px',
        padding: '4px',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '8px',
      }}>
        <button
          onClick={() => setZoomLevel(zoomLevel - 10)}
          style={{
            padding: '6px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>
        
        <span style={{ 
          padding: '0 8px', 
          fontSize: '12px', 
          color: 'var(--text-primary)',
          minWidth: '45px',
          textAlign: 'center',
        }}>
          {zoomLevel}%
        </span>
        
        <button
          onClick={() => setZoomLevel(zoomLevel + 10)}
          style={{
            padding: '6px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>
        
        <button
          onClick={() => setZoomLevel(100)}
          style={{
            padding: '6px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
          title="Reset Zoom"
        >
          <RotateCcw size={16} />
        </button>

        <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border-color)', margin: '0 2px' }} />

        <button
          onClick={toggleContentWidth}
          style={{
            padding: '6px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
          title={contentWidth === 'full' ? 'Switch to Medium Width' : contentWidth === 'medium' ? 'Switch to A4 Width' : 'Switch to Full Width'}
        >
          {contentWidth === 'full' ? <FileOutput size={16} /> : contentWidth === 'medium' ? <FileOutput size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

      {/* Right side: Theme, Export, Settings */}
      <div ref={menuRef} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {/* Theme selector */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowThemeMenu(!showThemeMenu)
              setShowFontMenu(false)
              setShowSettingsMenu(false)
            }}
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: showThemeMenu ? 'var(--bg-tertiary)' : 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
            }}
            onMouseLeave={(e) => {
              if (!showThemeMenu) {
                e.currentTarget.style.backgroundColor = 'transparent'
              }
            }}
            title="Change Theme"
          >
            <Palette size={18} />
          </button>
          
          {showThemeMenu && (
            <div 
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '8px',
                minWidth: '180px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                zIndex: 1000,
              }}
            >
              <div style={{ 
                padding: '4px 8px', 
                fontSize: '11px', 
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Themes
              </div>
              {themeList.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    setTheme(theme.id)
                    setShowThemeMenu(false)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px',
                    border: 'none',
                    borderRadius: '4px',
                    backgroundColor: currentTheme === theme.id ? 'var(--accent-color)' : 'transparent',
                    color: currentTheme === theme.id ? 'white' : 'var(--text-primary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '13px',
                  }}
                  onMouseEnter={(e) => {
                    if (currentTheme !== theme.id) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentTheme !== theme.id) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  <span>{theme.name}</span>
                  {theme.isDark && (
                    <span style={{ 
                      fontSize: '10px', 
                      opacity: 0.7,
                      marginLeft: 'auto',
                    }}>
                      Dark
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Font selector */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowFontMenu(!showFontMenu)
              setShowThemeMenu(false)
              setShowSettingsMenu(false)
            }}
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: showFontMenu ? 'var(--bg-tertiary)' : 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
            }}
            onMouseLeave={(e) => {
              if (!showFontMenu) {
                e.currentTarget.style.backgroundColor = 'transparent'
              }
            }}
            title="Change Font"
          >
            <Type size={18} />
          </button>

          {showFontMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '8px',
                minWidth: '220px',
                maxHeight: '400px',
                overflowY: 'auto',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                zIndex: 1000,
              }}
            >
              <div style={{
                padding: '4px 8px',
                fontSize: '11px',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                English
              </div>
              {fontCombos.filter(f => f.category === 'english').map((font) => (
                <button
                  key={font.id}
                  onClick={() => {
                    setCurrentFont(font.id)
                    setShowFontMenu(false)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px',
                    border: 'none',
                    borderRadius: '4px',
                    backgroundColor: currentFont === font.id ? 'var(--accent-color)' : 'transparent',
                    color: currentFont === font.id ? 'white' : 'var(--text-primary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontFamily: font.body,
                  }}
                  onMouseEnter={(e) => {
                    if (currentFont !== font.id) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentFont !== font.id) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  <span>{font.name}</span>
                </button>
              ))}

              <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }} />

              <div style={{
                padding: '4px 8px',
                fontSize: '11px',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Persian / فارسی
              </div>
              {fontCombos.filter(f => f.category === 'persian').map((font) => (
                <button
                  key={font.id}
                  onClick={() => {
                    setCurrentFont(font.id)
                    setShowFontMenu(false)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px',
                    border: 'none',
                    borderRadius: '4px',
                    backgroundColor: currentFont === font.id ? 'var(--accent-color)' : 'transparent',
                    color: currentFont === font.id ? 'white' : 'var(--text-primary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontFamily: font.body,
                  }}
                  onMouseEnter={(e) => {
                    if (currentFont !== font.id) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentFont !== font.id) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  <span>{font.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Export button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowSettingsMenu(!showSettingsMenu)
              setShowThemeMenu(false)
              setShowFontMenu(false)
            }}
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: showSettingsMenu ? 'var(--bg-tertiary)' : 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
            }}
            onMouseLeave={(e) => {
              if (!showSettingsMenu) {
                e.currentTarget.style.backgroundColor = 'transparent'
              }
            }}
            title="Export"
          >
            <Download size={18} />
          </button>

          {showSettingsMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '8px',
                minWidth: '180px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                zIndex: 1000,
              }}
            >
              <button
                onClick={() => {
                  onExportPDF()
                  setShowSettingsMenu(false)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '13px',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <Download size={14} />
                Export as PDF
              </button>
              <button
                onClick={() => {
                  onExportHTML()
                  setShowSettingsMenu(false)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '13px',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <Download size={14} />
                Export as HTML
              </button>
            </div>
          )}
        </div>

        {/* Settings button — opens settings window */}
        <button
          onClick={() => window.electronAPI?.openSettings()}
          style={{
            padding: '8px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          title="Settings"
        >
          <Settings size={18} />
        </button>
      </div>
    </div>
  )
})
