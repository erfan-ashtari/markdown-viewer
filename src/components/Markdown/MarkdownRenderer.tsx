import React, { useEffect, useRef, useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import mermaid from 'mermaid'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/github-dark.css'

declare global {
  interface Window {
    electronAPI?: {
      openExternal: (link: string) => Promise<void>
      openFileWithSystem: (filePath: string) => Promise<void>
      openFileNewWindow: (filePath: string) => Promise<void>
      openSettings: () => Promise<void>
      readFile: (filePath: string) => Promise<{ filePath: string; content: string; fileName: string } | null>
      listMdFiles: (dirPath: string) => Promise<{ name: string; path: string }[]>
      sendSettingsChanged: (data: { key: string; value: any }) => void
      onSelectAll: (callback: () => void) => void
      onLoadFile: (callback: (data: { content: string; fileName: string; filePath: string }) => void) => void
      onOpenFileFromPath: (callback: (data: { content: string; fileName: string; filePath: string; dirPath: string }) => void) => void
      onFullscreenChanged: (callback: (isFullscreen: boolean) => void) => void
      onSettingsChanged: (callback: (data: { key: string; value: any }) => void) => void
    }
  }
}

interface MarkdownRendererProps {
  content: string
  zoomLevel: number
  contentWidth: 'full' | 'medium' | 'a4'
  onZoomChange: (level: number) => void
}

// Encode spaces as %20 in local file URLs while preserving markdown link syntax
const encodeLocalUrls = (text: string): string => {
  return text.replace(/\[([^\]]*)\]\(([^)]+)\)/g, (match, linkText, url) => {
    const trimmedUrl = url.trim()
    // Skip http/https/mailto links
    if (/^(https?|mailto):/i.test(trimmedUrl)) return match
    // Encode spaces in local file paths
    const encodedUrl = trimmedUrl.replace(/ /g, '%20')
    return `[${linkText}](${encodedUrl})`
  })
}

const MermaidDiagram: React.FC<{ code: string }> = ({ code }) => {
  const ref = useRef<HTMLDivElement>(null)
  const id = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`)

  useEffect(() => {
    if (ref.current) {
      mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'loose' })
      mermaid.render(id.current, code).then(({ svg }) => {
        if (ref.current) ref.current.innerHTML = svg
      }).catch(console.error)
    }
  }, [code])

  return <div ref={ref} className="mermaid" />
}

const CodeBlock: React.FC<{ className?: string; children?: React.ReactNode }> = ({ className, children }) => {
  const match = /language-(\w+)/.exec(className || '')
  const language = match ? match[1] : ''
  if (language === 'mermaid') return <MermaidDiagram code={String(children).replace(/\n$/, '')} />
  return <code className={className}>{children}</code>
}

// Generate heading ID matching Typora's behavior
const generateHeadingId = (children: React.ReactNode): string => {
  const text = typeof children === 'string' ? children :
    React.Children.toArray(children).map(c =>
      typeof c === 'string' ? c :
      React.isValidElement(c) && c.props.children ?
        (typeof c.props.children === 'string' ? c.props.children :
         React.Children.toArray(c.props.children).map(gc => typeof gc === 'string' ? gc : '').join(''))
      : ''
    ).join('')
  return text
    .toLowerCase()
    .trim()
    .replace(/&/g, '--')           // & → -- (Typora convention)
    .replace(/[^\w\s-]/g, '')      // remove special chars except spaces/hyphens
    .replace(/\s+/g, '-')         // spaces → hyphens
    .replace(/-{3,}/g, '--')      // collapse 3+ hyphens to -- (preserve Typora's & → --)
    .replace(/^-|-$/g, '')        // trim leading/trailing hyphens
}

const Heading: React.FC<{ level: 1 | 2 | 3 | 4 | 5 | 6; children: React.ReactNode }> = ({ level, children }) => {
  const id = generateHeadingId(children)
  const Tag = `h${level}` as keyof JSX.IntrinsicElements
  return <Tag id={id}>{children}</Tag>
}

const MarkdownLink: React.FC<{ href: string; children: React.ReactNode; visitedLinks: Set<string>; onVisit: (href: string) => void }> = ({ href, children, visitedLinks, onVisit }) => {
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setTooltipPos({ x: rect.left, y: rect.bottom + 8 })
    hoverTimer.current = setTimeout(() => setShowTooltip(true), 500)
  }

  const handleMouseLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    setShowTooltip(false)
  }

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    onVisit(href)

    // Handle anchor links (e.g. #section-name, #ref-1, #1)
    if (href.startsWith('#')) {
      const targetId = href.slice(1)
      // Try exact ID match first, then decoded version
      let target = document.getElementById(targetId)
      if (!target) {
        target = document.getElementById(decodeURIComponent(targetId))
      }
      // Fallback: try common citation patterns like ref-1, reference-1, bib-1
      if (!target) {
        const num = targetId.replace(/\D/g, '')
        if (num) {
          const patterns = [`ref-${num}`, `reference-${num}`, `bib-${num}`, `cite-${num}`, `fn-${num}`, `note-${num}`]
          for (const p of patterns) {
            target = document.getElementById(p)
            if (target) break
          }
        }
      }
      // Last resort: find heading whose text matches
      if (!target) {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
        for (const h of headings) {
          if (h.id === targetId || h.textContent?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') === targetId) {
            target = h
            break
          }
        }
      }
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      return
    }

    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) {
      await window.electronAPI?.openExternal(href)
    } else {
      let filePath = decodeURIComponent(href)
      if ((filePath.startsWith('"') && filePath.endsWith('"')) ||
          (filePath.startsWith("'") && filePath.endsWith("'"))) {
        filePath = filePath.slice(1, -1)
      }
      if (filePath.startsWith('file:///')) {
        filePath = filePath.slice(8)
      }
      await window.electronAPI?.openFileWithSystem(filePath)
    }
  }

  const isVisited = visitedLinks.has(href)

  return (
    <>
      <a
        href={href}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`md-link${isVisited ? ' md-link-visited' : ''}`}
      >
        {children}
      </a>
      {showTooltip && (
        <span className="md-link-tooltip" style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}>
          {href}
        </span>
      )}
    </>
  )
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, zoomLevel, contentWidth, onZoomChange }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visitedLinks, setVisitedLinks] = useState<Set<string>>(new Set())

  const handleVisit = useCallback((href: string) => {
    setVisitedLinks(prev => new Set(prev).add(href))
  }, [])

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

  return (
    <div ref={containerRef} className="markdown-body" style={{
      fontSize: `${zoomLevel}%`,
      padding: '2rem',
      width: '100%',
      minHeight: '100%',
      ...(contentWidth === 'a4' ? {
        maxWidth: '800px',
        marginLeft: 'auto',
        marginRight: 'auto',
      } : contentWidth === 'medium' ? {
        maxWidth: '1100px',
        marginLeft: 'auto',
        marginRight: 'auto',
      } : {}),
    }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight, rehypeRaw]}
        urlTransform={(url) => url}
        components={{
          code: CodeBlock,
          h1: ({ children }) => <Heading level={1}>{children}</Heading>,
          h2: ({ children }) => <Heading level={2}>{children}</Heading>,
          h3: ({ children }) => <Heading level={3}>{children}</Heading>,
          h4: ({ children }) => <Heading level={4}>{children}</Heading>,
          h5: ({ children }) => <Heading level={5}>{children}</Heading>,
          h6: ({ children }) => <Heading level={6}>{children}</Heading>,
          a: ({ children, href }) => {
            if (!href) return <a>{children}</a>
            return <MarkdownLink href={href} visitedLinks={visitedLinks} onVisit={handleVisit}>{children}</MarkdownLink>
          },
        }}
      >
        {encodeLocalUrls(content)}
      </ReactMarkdown>
    </div>
  )
}
