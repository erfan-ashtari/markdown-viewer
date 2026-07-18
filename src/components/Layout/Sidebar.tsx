import React, { useState, useRef, useCallback, useEffect } from 'react'
import {
  Folder,
  File,
  ChevronRight,
  ChevronDown,
  FileText,
  FileCode,
  FileImage,
  FileJson,
  FileCog,
  FileArchive,
  FolderOpen,
  RefreshCw,
  ArrowUpAZ,
  ArrowDownAZ,
  Clock,
  FileType2,
} from 'lucide-react'
import { isTextFile } from '../Text/languageMap'
import { useAppStore } from '../../store/appStore'

interface FileNode {
  name: string
  path: string
  relativePath: string
  type: 'file' | 'directory'
  children?: FileNode[]
  mtimeMs?: number
}

type SortKey = 'name' | 'date' | 'type'

interface SidebarProps {
  onFileSelect: (path: string, content: string, name: string) => void
  onNonMarkdownFile: (path: string, content: string, name: string) => void
  isOpen: boolean
  dirToLoad?: string | null
}

const getFileIcon = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase()
  
  switch (ext) {
    case 'md':
    case 'markdown':
      return <FileText size={16} style={{ color: '#58a6ff' }} />
    case 'js':
    case 'ts':
    case 'jsx':
    case 'tsx':
    case 'py':
    case 'java':
    case 'cpp':
    case 'c':
    case 'h':
    case 'cs':
    case 'go':
    case 'rs':
    case 'rb':
      return <FileCode size={16} style={{ color: '#f0db4f' }} />
    case 'json':
      return <FileJson size={16} style={{ color: '#a8b9ff' }} />
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
      return <FileImage size={16} style={{ color: '#c9a0dc' }} />
    case 'zip':
    case 'tar':
    case 'gz':
    case 'rar':
      return <FileArchive size={16} style={{ color: '#f97583' }} />
    case 'yml':
    case 'yaml':
    case 'toml':
    case 'ini':
    case 'env':
      return <FileCog size={16} style={{ color: '#8b949e' }} />
    default:
      return <File size={16} style={{ color: '#8b949e' }} />
  }
}

function getExt(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : ''
}

function sortNodes(nodes: FileNode[], sortKey: SortKey, ascending: boolean): FileNode[] {
  const sorted = [...nodes].sort((a, b) => {
    // Directories always come first
    if (a.type === 'directory' && b.type !== 'directory') return -1
    if (a.type !== 'directory' && b.type === 'directory') return 1

    let cmp = 0
    switch (sortKey) {
      case 'name':
        cmp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
        break
      case 'date':
        cmp = (a.mtimeMs ?? 0) - (b.mtimeMs ?? 0)
        break
      case 'type': {
        const extA = a.type === 'directory' ? '' : getExt(a.name)
        const extB = b.type === 'directory' ? '' : getExt(b.name)
        cmp = extA.localeCompare(extB) || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
        break
      }
    }
    return ascending ? cmp : -cmp
  })

  return sorted.map((node) => ({
    ...node,
    children: node.children ? sortNodes(node.children, sortKey, ascending) : undefined,
  }))
}

const TreeItem: React.FC<{
  node: FileNode
  onFileSelect: (path: string, content: string, name: string) => void
  onNonMarkdownFile: (path: string, content: string, name: string) => void
  level?: number
}> = ({ node, onFileSelect, onNonMarkdownFile, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const isMarkdown = node.type === 'file' && /\.(md|markdown)$/i.test(node.name)

  const handleClick = async () => {
    if (node.type === 'directory') {
      setIsExpanded(!isExpanded)
    } else if (isMarkdown) {
      setIsLoading(true)
      try {
        if (window.electronAPI) {
          const result = await window.electronAPI.readFile(node.path)
          if (result) {
            onFileSelect(result.filePath, result.content, result.fileName)
          }
        }
      } catch (error) {
        console.error('Failed to read file:', error)
      } finally {
        setIsLoading(false)
      }
    } else {
      if (isTextFile(node.name)) {
        setIsLoading(true)
        try {
          if (window.electronAPI) {
            const result = await window.electronAPI.readFile(node.path)
            if (result) {
              onNonMarkdownFile(result.filePath, result.content, result.fileName)
            }
          }
        } catch (error) {
          console.error('Failed to read file:', error)
        } finally {
          setIsLoading(false)
        }
      } else {
        onNonMarkdownFile(node.path, '', node.name)
      }
    }
  }

  return (
    <div>
      <div
        className="tree-item"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 8px',
          paddingLeft: `${level * 16 + 8}px`,
          cursor: 'pointer',
          borderRadius: '4px',
          margin: '0 4px',
          fontSize: '13px',
          color: 'var(--text-primary)',
          transition: 'background-color 0.15s',
        }}
        onClick={handleClick}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
      >
        {node.type === 'directory' ? (
          <>
            {isExpanded ? (
              <ChevronDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            ) : (
              <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            )}
            {isExpanded ? (
              <FolderOpen size={16} style={{ color: '#f97583', flexShrink: 0 }} />
            ) : (
              <Folder size={16} style={{ color: '#f97583', flexShrink: 0 }} />
            )}
          </>
        ) : (
          <>
            <span style={{ width: '14px', flexShrink: 0 }} />
            {getFileIcon(node.name)}
          </>
        )}
        <span style={{ 
          flex: 1, 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap' 
        }}>
          {isLoading ? 'Loading...' : node.name}
        </span>
      </div>
      
      {node.type === 'directory' && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeItem
              key={child.path}
              node={child}
              onFileSelect={onFileSelect}
              onNonMarkdownFile={onNonMarkdownFile}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export const Sidebar: React.FC<SidebarProps> = ({ onFileSelect, onNonMarkdownFile, isOpen, dirToLoad }) => {
  const [fileTree, setFileTree] = useState<FileNode[]>([])
  const [rootPath, setRootPath] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortAsc, setSortAsc] = useState(true)
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false)
  const sidebarWidth = useAppStore((s) => s.sidebarWidth)
  const setSidebarWidth = useAppStore((s) => s.setSidebarWidth)

  const sidebarRef = useRef<HTMLDivElement>(null)
  const sortDropdownRef = useRef<HTMLDivElement>(null)
  const lastRootPath = useRef<string | null>(null)

  const loadTree = useCallback(async (folderPath: string) => {
    const result = await window.electronAPI?.buildFileTree?.(folderPath)
    if (result) {
      setFileTree(result.tree)
      setRootPath(result.name)
      lastRootPath.current = folderPath
    }
  }, [])

  // When dirToLoad changes (e.g. from file association), load that folder's tree
  const prevDirRef = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (dirToLoad && dirToLoad !== prevDirRef.current) {
      prevDirRef.current = dirToLoad
      loadTree(dirToLoad)
    }
  }, [dirToLoad, loadTree])

  // Close sort dropdown on outside click
  useEffect(() => {
    if (!sortDropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setSortDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [sortDropdownOpen])

  const handleRefresh = async () => {
    if (isRefreshing || !lastRootPath.current) return
    setIsRefreshing(true)
    await loadTree(lastRootPath.current)
    setTimeout(() => setIsRefreshing(false), 600)
  }

  const handleSortSelect = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(true)
    }
    setSortDropdownOpen(false)
  }

  const handleOpenFolder = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.openFolder()
      if (result) {
        setFileTree(result.tree)
        setRootPath(result.name)
        lastRootPath.current = result.name
      }
    }
  }

  const handleOpenFile = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.openFile()
      if (result) {
        const isMd = /\.(md|markdown)$/i.test(result.fileName)
        if (isMd) {
          onFileSelect(result.filePath, result.content, result.fileName)
        } else {
          onNonMarkdownFile(result.filePath, result.content, result.fileName)
        }
      }
    }
  }

  // Resize handle via mouse drag
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = sidebarWidth

    const onMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX
      setSidebarWidth(startWidth + delta)
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
  }, [sidebarWidth, setSidebarWidth])

  const sortedTree = sortNodes(fileTree, sortKey, sortAsc)

  const sortLabel: Record<SortKey, string> = {
    name: 'Name',
    date: 'Date Modified',
    type: 'Type',
  }

  if (!isOpen) return null

  return (
    <div
      ref={sidebarRef}
      style={{
        width: `${sidebarWidth}px`,
        height: '100%',
        backgroundColor: 'var(--sidebar-bg)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {/* Header */}
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
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}
        >
          {rootPath || 'Explorer'}
        </span>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={!lastRootPath.current}
            title="Refresh"
            style={{
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: 'transparent',
              color: lastRootPath.current ? 'var(--text-secondary)' : 'var(--text-muted)',
              cursor: lastRootPath.current ? 'pointer' : 'default',
              transition: 'background-color 0.15s',
              opacity: lastRootPath.current ? 1 : 0.4,
            }}
            onMouseEnter={(e) => {
              if (lastRootPath.current) e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <RefreshCw
              size={14}
              className={isRefreshing ? 'sidebar-spin' : ''}
            />
          </button>

          {/* Sort dropdown */}
          <div ref={sortDropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              title={`Sort by: ${sortLabel[sortKey]}${sortAsc ? ' (A-Z)' : ' (Z-A)'}`}
              style={{
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: sortDropdownOpen ? 'var(--bg-tertiary)' : 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
              }}
              onMouseLeave={(e) => {
                if (!sortDropdownOpen) e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              {sortKey === 'name' && (sortAsc ? <ArrowUpAZ size={14} /> : <ArrowDownAZ size={14} />)}
              {sortKey === 'date' && <Clock size={14} />}
              {sortKey === 'type' && <FileType2 size={14} />}
            </button>

            {sortDropdownOpen && (
              <div
                className="sidebar-sort-dropdown"
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '4px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  minWidth: '150px',
                  zIndex: 100,
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '4px 0' }}>
                  {(['name', 'date', 'type'] as SortKey[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => handleSortSelect(key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '6px 12px',
                        border: 'none',
                        backgroundColor: sortKey === key ? 'var(--bg-tertiary)' : 'transparent',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontSize: '12px',
                        textAlign: 'left',
                        transition: 'background-color 0.1s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
                      }}
                      onMouseLeave={(e) => {
                        if (sortKey !== key) e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      {key === 'name' && <ArrowUpAZ size={13} style={{ color: 'var(--text-muted)' }} />}
                      {key === 'date' && <Clock size={13} style={{ color: 'var(--text-muted)' }} />}
                      {key === 'type' && <FileType2 size={13} style={{ color: 'var(--text-muted)' }} />}
                      <span style={{ flex: 1 }}>{sortLabel[key]}</span>
                      {sortKey === key && (
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          {sortAsc ? 'A→Z' : 'Z→A'}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* File / Folder buttons */}
          <button
            onClick={handleOpenFile}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: 'var(--accent-color)',
              color: 'white',
              cursor: 'pointer',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-color)'
            }}
          >
            File
          </button>
          <button
            onClick={handleOpenFolder}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
            }}
          >
            Folder
          </button>
        </div>
      </div>
      
      {/* File tree */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
        {sortedTree.length === 0 ? (
          <div style={{ 
            padding: '32px 16px', 
            textAlign: 'center', 
            color: 'var(--text-muted)',
            fontSize: '13px',
          }}>
            <p>No files loaded</p>
            <p style={{ marginTop: '8px', fontSize: '12px' }}>
              Click "File" or "Folder" to open
            </p>
          </div>
        ) : (
          sortedTree.map((node) => (
            <TreeItem
              key={node.path}
              node={node}
              onFileSelect={onFileSelect}
              onNonMarkdownFile={onNonMarkdownFile}
            />
          ))
        )}
      </div>

      {/* Resize handle */}
      <div
        className="sidebar-resize-handle"
        onMouseDown={handleResizeMouseDown}
        style={{
          position: 'absolute',
          top: 0,
          right: -3,
          width: 6,
          height: '100%',
          cursor: 'col-resize',
          zIndex: 10,
        }}
      />
    </div>
  )
}
