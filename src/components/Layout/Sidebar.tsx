import React, { useState } from 'react'
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
} from 'lucide-react'

interface FileNode {
  name: string
  path: string
  relativePath: string
  type: 'file' | 'directory'
  children?: FileNode[]
}

interface SidebarProps {
  onFileSelect: (path: string, content: string, name: string) => void
  onNonMarkdownFile: (path: string, name: string) => void
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

const TreeItem: React.FC<{
  node: FileNode
  onFileSelect: (path: string, content: string, name: string) => void
  onNonMarkdownFile: (path: string, name: string) => void
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
      onNonMarkdownFile(node.path, node.name)
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

  // When dirToLoad changes (e.g. from file association), load that folder's tree
  const prevDirRef = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (dirToLoad && dirToLoad !== prevDirRef.current) {
      prevDirRef.current = dirToLoad
      window.electronAPI?.buildFileTree?.(dirToLoad).then((result) => {
        if (result) {
          setFileTree(result.tree)
          setRootPath(result.name)
        }
      })
    }
  }, [dirToLoad])

  const handleOpenFolder = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.openFolder()
      if (result) {
        setFileTree(result.tree)
        setRootPath(result.name)
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
          onNonMarkdownFile(result.filePath, result.fileName)
        }
      }
    }
  }

  if (!isOpen) return null

  return (
    <div 
      style={{
        width: '260px',
        height: '100%',
        borderRight: '1px solid var(--border-color)',
        backgroundColor: 'var(--sidebar-bg)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div 
        style={{
          padding: '12px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ 
          fontSize: '12px', 
          fontWeight: 600, 
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: 'var(--text-secondary)',
        }}>
          {rootPath || 'Explorer'}
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
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
      
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
        {fileTree.length === 0 ? (
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
          fileTree.map((node) => (
            <TreeItem
              key={node.path}
              node={node}
              onFileSelect={onFileSelect}
              onNonMarkdownFile={onNonMarkdownFile}
            />
          ))
        )}
      </div>
    </div>
  )
}
