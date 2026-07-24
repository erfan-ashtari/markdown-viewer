import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ChevronRight,
  ChevronDown,
  Puzzle,
  RefreshCw,
  Terminal,
  Zap,
  FileText,
  FolderOpen,
} from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import type { SidebarPanel } from '@mdview/plugin-api'
import { SidebarPanelRenderer } from './sidebar-panel/SidebarPanelRenderer'

interface RuntimePlugin {
  name: string
  description: string
  enabled: boolean
  state: Record<string, any>
}

interface PanelData {
  pluginName: string
  panel: SidebarPanel
  state: Record<string, any>
}

interface RuntimePluginSidebarProps {
  isOpen: boolean
}

const PluginItem: React.FC<{
  plugin: RuntimePlugin
  commands: Array<{ id: string; name: string; description: string; when?: string }>
  panel?: PanelData
  onExecuteCommand: (commandId: string) => void
  onUIInteraction: (pluginName: string, elementId: string, eventType: string, payload: any) => void
}> = React.memo(({ plugin, commands, panel, onExecuteCommand, onUIInteraction }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [runningCommandId, setRunningCommandId] = useState<string | null>(null)

  const pluginCommands = commands.filter((cmd) => {
    if (!cmd.when) return true
    return cmd.when === plugin.name
  })

  const handleExecute = async (commandId: string) => {
    setRunningCommandId(commandId)
    try {
      await onExecuteCommand(commandId)
    } finally {
      setRunningCommandId(null)
    }
  }

  const handleUIInteraction = useCallback((elementId: string, eventType: string, payload: any) => {
    onUIInteraction(plugin.name, elementId, eventType, payload)
  }, [plugin.name, onUIInteraction])

  const hasPanel = !!panel
  const hasCommands = pluginCommands.length > 0

  return (
    <div style={{ marginBottom: '2px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 8px',
          cursor: 'pointer',
          borderRadius: '4px',
          margin: '0 4px',
          fontSize: '13px',
          color: 'var(--text-primary)',
          transition: 'background-color 0.15s',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
      >
        {isExpanded ? (
          <ChevronDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        ) : (
          <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        )}
        <Puzzle size={16} style={{ color: 'var(--accent-color)', flexShrink: 0 }} />
        <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
          <div
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {(plugin as any).displayName || plugin.name}
          </div>
          {plugin.description && (
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {plugin.description}
            </div>
          )}
        </div>
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: plugin.enabled ? 'var(--accent-color)' : 'var(--text-muted)',
            flexShrink: 0,
          }}
          title={plugin.enabled ? 'Enabled' : 'Disabled'}
        />
      </div>

      {isExpanded && (
        <div style={{ paddingLeft: '16px', paddingBottom: '8px' }}>
          {hasPanel ? (
            <SidebarPanelRenderer
              panel={panel!.panel}
              state={panel!.state}
              onInteraction={handleUIInteraction}
            />
          ) : hasCommands ? (
            pluginCommands.map((cmd, index) => {
              const isRunning = runningCommandId === cmd.id
              return (
                <button
                  key={cmd.id || `cmd-${index}`}
                  onClick={() => handleExecute(cmd.id)}
                  disabled={isRunning}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '6px 8px',
                    border: 'none',
                    borderRadius: '4px',
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary)',
                    cursor: isRunning ? 'wait' : 'pointer',
                    fontSize: '12px',
                    textAlign: 'left',
                    transition: 'background-color 0.15s',
                    opacity: isRunning ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isRunning) e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <Terminal size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{cmd.name}</span>
                  {isRunning && (
                    <RefreshCw
                      size={12}
                      style={{
                        color: 'var(--text-muted)',
                        animation: 'spin 1s linear infinite',
                      }}
                    />
                  )}
                </button>
              )
            })
          ) : (
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                padding: '4px 8px',
              }}
            >
              No UI elements registered
            </div>
          )}

          {plugin.state && Object.keys(plugin.state).length > 0 && process.env.NODE_ENV === 'development' && (
            <div
              style={{
                marginTop: '8px',
                padding: '8px',
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'monospace',
              }}
            >
              <div
                style={{
                  color: 'var(--text-muted)',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                State
              </div>
              {Object.entries(plugin.state).map(([key, value]) => (
                <div key={key} style={{ display: 'flex', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ color: 'var(--accent-color)' }}>{key}:</span>
                  <span style={{ color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                    {typeof value === 'object' ? (() => { try { return JSON.stringify(value) } catch { return '[Circular]' } })() : String(value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
})

export const RuntimePluginSidebar: React.FC<RuntimePluginSidebarProps> = ({ isOpen }) => {
  const [plugins, setPlugins] = useState<RuntimePlugin[]>([])
  const [commands, setCommands] = useState<Array<{ id: string; name: string; description: string; when?: string }>>([])
  const [panels, setPanels] = useState<PanelData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const currentFile = useAppStore((s) => s.currentFile)
  const currentDirectory = useAppStore((s) => s.currentDirectory)
  const pluginSidebarWidth = useAppStore((s) => s.pluginSidebarWidth)
  const setPluginSidebarWidth = useAppStore((s) => s.setPluginSidebarWidth)

  const fetchData = useCallback(async () => {
    try {
      const [pluginsData, commandsData, panelsData] = await Promise.all([
        window.electronAPI?.getPlugins(),
        window.electronAPI?.getCommands(),
        window.electronAPI?.getSidebarPanels(),
      ])
      if (pluginsData && Array.isArray(pluginsData)) {
        const runtimeOnly = pluginsData.filter((p: any) => p.runtime === true)
        setPlugins(runtimeOnly.map((p: any) => ({ ...p, state: p.state || {} })))
      }
      if (commandsData && Array.isArray(commandsData)) {
        setCommands(commandsData)
      }
      if (panelsData && Array.isArray(panelsData)) {
        setPanels(panelsData)
      }
    } catch (error) {
      console.error('Failed to fetch plugin data:', error)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen, fetchData])

  useEffect(() => {
    if (!isOpen) return

    const handlePluginsChanged = () => {
      fetchData()
    }

    const handleStateUpdated = (data: any) => {
      setPlugins((prev) =>
        prev.map((p) =>
          p.name === data.name ? { ...p, state: data.state, enabled: data.enabled } : p
        )
      )
    }

    const handleCommandLog = (data: { command: string; plugin: string; logs: Array<{ level: string; args: any[] }> }) => {
      for (const log of data.logs) {
        const prefix = `[Plugin:${data.plugin}]`
        if (log.level === 'error') {
          console.error(prefix, ...log.args)
        } else if (log.level === 'warn') {
          console.warn(prefix, ...log.args)
        } else {
          // console.log(prefix, ...log.args)
        }
      }
    }

    const handlePanelRegistered = (data: PanelData) => {
      setPanels((prev) => [...prev, data])
    }

    const handlePanelUpdated = (data: { pluginName: string; panel: SidebarPanel; state?: Record<string, any> }) => {
      setPanels((prev) =>
        prev.map((p) =>
          p.pluginName === data.pluginName ? { ...p, panel: data.panel, state: data.state ?? p.state } : p
        )
      )
    }

    const handlePanelStateUpdated = (data: { pluginName: string; state: Record<string, any> }) => {
      setPanels((prev) =>
        prev.map((p) =>
          p.pluginName === data.pluginName ? { ...p, state: data.state } : p
        )
      )
    }

    const handlePanelRemoved = (data: { pluginName: string }) => {
      setPanels((prev) => prev.filter((p) => p.pluginName !== data.pluginName))
    }

    window.electronAPI?.onPluginsChanged?.(handlePluginsChanged)
    window.electronAPI?.onPluginStateUpdated?.(handleStateUpdated)
    window.electronAPI?.onPluginCommandLog?.(handleCommandLog)
    window.electronAPI?.onSidebarPanelRegistered?.(handlePanelRegistered)
    window.electronAPI?.onSidebarPanelUpdated?.(handlePanelUpdated)
    window.electronAPI?.onSidebarPanelStateUpdated?.(handlePanelStateUpdated)
    window.electronAPI?.onSidebarPanelRemoved?.(handlePanelRemoved)

    return () => {
      window.electronAPI?.offPluginsChanged?.(handlePluginsChanged)
      window.electronAPI?.offPluginStateUpdated?.(handleStateUpdated)
      window.electronAPI?.offPluginCommandLog?.(handleCommandLog)
      window.electronAPI?.offSidebarPanelRegistered?.(handlePanelRegistered)
      window.electronAPI?.offSidebarPanelUpdated?.(handlePanelUpdated)
      window.electronAPI?.offSidebarPanelStateUpdated?.(handlePanelStateUpdated)
      window.electronAPI?.offSidebarPanelRemoved?.(handlePanelRemoved)
    }
  }, [isOpen, fetchData])

  const handleExecuteCommand = useCallback(
    async (commandId: string) => {
      try {
        await window.electronAPI?.executeCommand(commandId)
        await fetchData()
      } catch (error) {
        console.error('Failed to execute command:', error)
      }
    },
    [fetchData]
  )

  const handleUIInteraction = useCallback(
    async (pluginName: string, elementId: string, eventType: string, payload: any) => {
      try {
        await window.electronAPI?.handleUIInteraction(pluginName, elementId, eventType, payload)
      } catch (error) {
        console.error('Failed to handle UI interaction:', error)
      }
    },
    []
  )

  const handleRefresh = useCallback(() => {
    setIsLoading(true)
    fetchData().finally(() => setIsLoading(false))
  }, [fetchData])

  // Resize handle via mouse drag (left edge since this is a right sidebar)
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = pluginSidebarWidth

    const onMouseMove = (e: MouseEvent) => {
      const delta = startX - e.clientX
      setPluginSidebarWidth(startWidth + delta)
    }

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [pluginSidebarWidth, setPluginSidebarWidth])

  const panelMap = useMemo(() => {
    const map = new Map<string, PanelData>()
    for (const p of panels) map.set(p.pluginName, p)
    return map
  }, [panels])

  if (!isOpen) return null

  return (
    <div
      style={{
        width: `${pluginSidebarWidth}px`,
        height: '100%',
        backgroundColor: 'var(--sidebar-bg)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        flexShrink: 0,
        borderLeft: '1px solid var(--border-color)',
      }}
    >
      {/* Resize handle (left edge) */}
      <div
        onMouseDown={handleResizeMouseDown}
        style={{
          position: 'absolute',
          top: 0,
          left: -3,
          width: 6,
          height: '100%',
          cursor: 'col-resize',
          zIndex: 10,
        }}
      />
      <div
        style={{
          padding: '12px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: 'var(--text-secondary)',
          }}
        >
          Plugins
        </span>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button
            onClick={handleRefresh}
            title="Refresh plugins"
            style={{
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <RefreshCw size={14} className={isLoading ? 'sidebar-spin' : ''} />
          </button>
        </div>
      </div>

      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid var(--border-color)',
          fontSize: '11px',
          color: 'var(--text-muted)',
        }}
      >
        {currentFile ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={12} />
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {currentFile.fileName}
            </span>
          </div>
        ) : currentDirectory ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FolderOpen size={12} />
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {currentDirectory.split(/[\\/]/).pop() || currentDirectory}
            </span>
          </div>
        ) : (
          <span>No file or folder selected</span>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
        {plugins.length === 0 ? (
          <div
            style={{
              padding: '32px 16px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '13px',
            }}
          >
            <Zap size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p>No plugins installed</p>
            <p style={{ marginTop: '8px', fontSize: '12px' }}>
              Drop plugin folders into the plugins directory
            </p>
          </div>
        ) : (
          plugins.map((plugin) => (
            <PluginItem
              key={plugin.name}
              plugin={plugin}
              commands={commands}
              panel={panelMap.get(plugin.name)}
              onExecuteCommand={handleExecuteCommand}
              onUIInteraction={handleUIInteraction}
            />
          ))
        )}
      </div>
    </div>
  )
}
