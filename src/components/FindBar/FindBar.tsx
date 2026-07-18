import React, { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronUp, ChevronDown, X } from 'lucide-react'

interface FindBarProps {
  onClose: () => void
  containerRef: React.RefObject<HTMLDivElement | null>
}

interface MatchInfo {
  node: Text
  offset: number
  length: number
}

function findAllMatches(container: HTMLElement, query: string): MatchInfo[] {
  const matches: MatchInfo[] = []
  if (!query) return matches

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(escaped, 'gi')

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null)
  while (walker.nextNode()) {
    const textNode = walker.currentNode as Text
    const text = textNode.textContent || ''
    let m: RegExpExecArray | null
    regex.lastIndex = 0
    while ((m = regex.exec(text)) !== null) {
      matches.push({ node: textNode, offset: m.index, length: m[0].length })
    }
  }
  return matches
}

function selectMatch(match: MatchInfo) {
  const range = document.createRange()
  range.setStart(match.node, match.offset)
  range.setEnd(match.node, match.offset + match.length)
  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
  // Scroll the match into view
  range.getBoundingClientRect() // force layout
  const rect = range.getBoundingClientRect()
  const container = range.startContainer.parentElement?.closest('.markdown-body, .text-viewer')
  if (container && rect.top !== 0) {
    container.scrollTo({
      top: container.scrollTop + rect.top - container.getBoundingClientRect().height / 2,
      behavior: 'smooth',
    })
  }
}

export const FindBar: React.FC<FindBarProps> = React.memo(({ onClose, containerRef }) => {
  const [query, setQuery] = useState('')
  const [matches, setMatches] = useState<number>(0)
  const [currentIdx, setCurrentIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const matchRefs = useRef<MatchInfo[]>([])

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 30)
  }, [])

  // Clear selection on unmount
  useEffect(() => {
    return () => {
      matchRefs.current = []
      window.getSelection()?.removeAllRanges()
    }
  }, [])

  const handleSearch = useCallback(() => {
    if (!query || !containerRef.current) {
      setMatches(0)
      setCurrentIdx(0)
      matchRefs.current = []
      window.getSelection()?.removeAllRanges()
      return
    }
    const found = findAllMatches(containerRef.current, query)
    matchRefs.current = found
    setMatches(found.length)
    if (found.length > 0) {
      setCurrentIdx(1)
      selectMatch(found[0])
    } else {
      setCurrentIdx(0)
      window.getSelection()?.removeAllRanges()
    }
  }, [query, containerRef])

  const goToMatch = useCallback((idx: number) => {
    const marks = matchRefs.current
    if (marks.length === 0) return
    const clamped = ((idx - 1) % marks.length + marks.length) % marks.length
    setCurrentIdx(clamped + 1)
    selectMatch(marks[clamped])
  }, [])

  const handleClose = useCallback(() => {
    matchRefs.current = []
    window.getSelection()?.removeAllRanges()
    onClose()
  }, [onClose])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (matches === 0) {
        handleSearch()
      } else {
        e.shiftKey ? goToMatch(currentIdx - 1) : goToMatch(currentIdx + 1)
      }
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      handleClose()
    }
  }

  return (
    <div className="find-bar">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          // Reset when typing
          setMatches(0)
          setCurrentIdx(0)
          matchRefs.current = []
          window.getSelection()?.removeAllRanges()
        }}
        onKeyDown={handleKeyDown}
        placeholder="Find..."
        style={{
          flex: 1,
          padding: '4px 8px',
          fontSize: '12px',
          borderRadius: '3px',
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          outline: 'none',
          minWidth: 0,
        }}
      />
      {matches > 0 && (
        <span className="find-bar-count">
          {currentIdx} / {matches}
        </span>
      )}
      <button
        className="find-bar-btn"
        onClick={() => goToMatch(currentIdx - 1)}
        disabled={matches === 0}
        title="Previous match (Shift+Enter)"
      >
        <ChevronUp size={14} />
      </button>
      <button
        className="find-bar-btn"
        onClick={() => goToMatch(currentIdx + 1)}
        disabled={matches === 0}
        title="Next match (Enter)"
      >
        <ChevronDown size={14} />
      </button>
      <button
        className="find-bar-btn"
        onClick={handleClose}
        title="Close (Esc)"
      >
        <X size={14} />
      </button>
    </div>
  )
})
