import React, { useState, useEffect, memo } from 'react'

interface HtmlRendererProps {
  content: string
  filePath: string
  fileName: string
}

export const HtmlRenderer: React.FC<HtmlRendererProps> = memo(({ content, filePath, fileName }) => {
  const [rendered, setRendered] = useState(true)

  // Get file extension
  const ext = fileName.split('.').pop()?.toLowerCase() || 'html'

  // Listen for render mode changes from main process
  useEffect(() => {
    const handler = (data: { extension: string; rendered: boolean }) => {
      if (data.extension === ext || data.extension === 'html') {
        setRendered(data.rendered)
      }
    }
    window.electronAPI?.onRenderModeChanged?.(handler)
    return () => {
      window.electronAPI?.offRenderModeChanged?.(handler)
    }
  }, [ext])

  // Fetch initial render mode
  useEffect(() => {
    window.electronAPI?.getRenderMode?.('html').then((mode: boolean) => {
      setRendered(mode)
    })
  }, [])

  // If source view is active, return null to fall through to default renderer
  if (!rendered) {
    return null
  }

  // Rendered view: show HTML in a sandboxed iframe using local-file:// protocol
  // Convert file path to local-file:// URL for Electron
  const fileUrl = filePath.replace(/^([A-Z]:)/i, 'local-file://$1').replace(/\\/g, '/')

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        padding: '8px 16px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '13px',
        color: 'var(--text-secondary)',
      }}>
        <span style={{ fontWeight: 500 }}>HTML Preview</span>
        <span style={{ opacity: 0.5 }}>|</span>
        <span style={{
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {fileName}
        </span>
      </div>
      <iframe
        src={fileUrl}
        sandbox="allow-scripts"
        style={{
          flex: 1,
          width: '100%',
          border: 'none',
        }}
        title={fileName}
      />
    </div>
  )
})

HtmlRenderer.displayName = 'HtmlRenderer'
