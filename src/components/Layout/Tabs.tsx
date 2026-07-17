import React, { useState } from 'react'
import { X, FileText, XCircle, FileX } from 'lucide-react'
import { useAppStore, Tab } from '../../store/appStore'

interface TabsProps {
  onTabSelect: (tab: Tab) => void
  isFullscreen?: boolean
}

export const Tabs: React.FC<TabsProps> = ({ onTabSelect, isFullscreen }) => {
  const { tabs, activeTabId, setActiveTab, closeTab, closeOtherTabs, closeAllTabs } = useAppStore()
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tabId: string } | null>(null)

  if (tabs.length === 0) return null
  if (isFullscreen) return null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'var(--tab-bg)',
        borderBottom: '1px solid var(--border-color)',
        overflowX: 'auto',
        overflowY: 'hidden',
        height: '40px',
      }}
    >
      {tabs.map((tab) => (
        <div
          key={tab.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0 16px',
            height: '100%',
            backgroundColor: tab.id === activeTabId ? 'var(--tab-active-bg)' : 'transparent',
            borderRight: '1px solid var(--border-color)',
            cursor: 'pointer',
            minWidth: '120px',
            maxWidth: '200px',
            borderBottom: tab.id === activeTabId ? '2px solid var(--accent-color)' : '2px solid transparent',
            transition: 'background-color 0.15s',
          }}
          onClick={() => {
            setActiveTab(tab.id)
            onTabSelect(tab)
          }}
          onContextMenu={(e) => {
            e.preventDefault()
            setContextMenu({ x: e.clientX, y: e.clientY, tabId: tab.id })
          }}
          onMouseEnter={(e) => {
            if (tab.id !== activeTabId) {
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
            }
          }}
          onMouseLeave={(e) => {
            if (tab.id !== activeTabId) {
              e.currentTarget.style.backgroundColor = 'transparent'
            }
          }}
        >
          <FileText size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <span
            style={{
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: '13px',
              color: tab.id === activeTabId ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
          >
            {tab.fileName}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              closeTab(tab.id)
            }}
            style={{
              padding: '2px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--text-muted)',
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
              e.currentTarget.style.color = 'var(--text-muted)'
            }}
          >
            <X size={14} />
          </button>
        </div>
      ))}

      {contextMenu && (
        <>
          <div
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998 }}
            onClick={() => setContextMenu(null)}
          />
          <div
            style={{
              position: 'fixed',
              left: contextMenu.x,
              top: contextMenu.y,
              zIndex: 9999,
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '4px 0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
              minWidth: '180px',
            }}
          >
            <ContextMenuItem
              icon={<X size={14} />}
              label="Close Tab"
              onClick={() => {
                closeTab(contextMenu.tabId)
                setContextMenu(null)
              }}
            />
            <ContextMenuItem
              icon={<FileX size={14} />}
              label="Close Other Tabs"
              onClick={() => {
                closeOtherTabs(contextMenu.tabId)
                setContextMenu(null)
              }}
            />
            <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }} />
            <ContextMenuItem
              icon={<XCircle size={14} />}
              label="Close All Tabs"
              onClick={() => {
                closeAllTabs()
                setContextMenu(null)
              }}
            />
          </div>
        </>
      )}
    </div>
  )
}

const ContextMenuItem: React.FC<{
  icon: React.ReactNode
  label: string
  onClick: () => void
}> = ({ icon, label, onClick }) => (
  <div
    style={{
      padding: '6px 12px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '13px',
      color: 'var(--text-primary)',
    }}
    onClick={onClick}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'transparent'
    }}
  >
    {icon}
    {label}
  </div>
)
