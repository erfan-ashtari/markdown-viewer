import React, { useRef, useCallback, useEffect, useMemo } from 'react'
import hljs from 'highlight.js'
import { getLanguageForFile } from './languageMap'

interface TextRendererProps {
  content: string
  fileName: string
  zoomLevel: number
  onZoomChange: (level: number) => void
}

export const TextRenderer: React.FC<TextRendererProps> = ({ content, fileName, zoomLevel, onZoomChange }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const language = useMemo(() => getLanguageForFile(fileName), [fileName])

  const highlighted = useMemo(() => {
    if (!content) return ''
    if (language) {
      try {
        return hljs.highlight(content, { language, ignoreIllegals: true }).value
      } catch { /* fall through */ }
    }
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }, [content, language])

  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const zoomDelta = e.deltaY > 0 ? -5 : 5
      onZoomChange(Math.max(50, Math.min(300, zoomLevel + zoomDelta)))
    }
  }, [zoomLevel, onZoomChange])

  useEffect(() => {
    const el = containerRef.current
    if (el) {
      el.addEventListener('wheel', handleWheel, { passive: false })
      return () => el.removeEventListener('wheel', handleWheel)
    }
  }, [handleWheel])

  const lineCount = useMemo(() => {
    let count = 1
    for (let i = 0; i < content.length; i++) {
      if (content[i] === '\n') count++
    }
    return count
  }, [content])

  return (
    <div
      ref={containerRef}
      className="text-viewer"
      style={{
        fontSize: `${zoomLevel}%`,
        height: '100%',
        overflow: 'auto',
        backgroundColor: 'var(--bg-primary)',
      }}
    >
      {/* File info bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-secondary)',
        fontSize: '12px',
        color: 'var(--text-muted)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <span>{fileName}</span>
        <span style={{ display: 'flex', gap: '16px' }}>
          {language && <span style={{ textTransform: 'uppercase' }}>{language}</span>}
          <span>{lineCount} lines</span>
          <span>{content.length.toLocaleString()} chars</span>
        </span>
      </div>

      {/* Code content with line numbers */}
      <div style={{ display: 'flex', minHeight: '100%' }}>
        {/* Line numbers */}
        <div style={{
          padding: '16px 0',
          textAlign: 'right',
          userSelect: 'none',
          color: 'var(--text-muted)',
          fontSize: '85%',
          fontFamily: 'var(--font-code, "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace)',
          lineHeight: '1.6',
          minWidth: '4em',
          paddingRight: '16px',
          borderRight: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)',
          opacity: 0.6,
        }}>
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Code */}
        <pre style={{
          margin: 0,
          padding: '16px',
          fontFamily: 'var(--font-code, "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace)',
          lineHeight: '1.6',
          color: 'var(--text-primary)',
          flex: 1,
          overflow: 'visible',
          whiteSpace: 'pre',
          tabSize: 4,
        }}>
          <code
            className={language ? `hljs language-${language}` : 'hljs'}
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </pre>
      </div>
    </div>
  )
}
