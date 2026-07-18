import React, { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronUp, ChevronDown, X } from 'lucide-react'

interface FindBarProps {
  onClose: () => void
  containerRef: React.RefObject<HTMLDivElement | null>
}

// Find the DOM position (text node + offset) for a character offset within a container
function findPositionAtOffset(container: HTMLElement, targetOffset: number): { node: Text; offset: number } | null {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null)
  let cumulative = 0
  while (walker.nextNode()) {
    const textNode = walker.currentNode as Text
    const len = textNode.textContent?.length || 0
    if (cumulative + len >= targetOffset) {
      return { node: textNode, offset: targetOffset - cumulative }
    }
    cumulative += len
  }
  return null
}

export const FindBar: React.FC<FindBarProps> = React.memo(({ onClose, containerRef }) => {
  const [query, setQuery] = useState('')
  const [matches, setMatches] = useState(0)
  const [currentIdx, setCurrentIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  // Store character offsets of all matches in the raw text
  const matchOffsets = useRef<number[]>([])

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 30)
  }, [])

  // Clear selection on unmount
  useEffect(() => {
    return () => {
      matchOffsets.current = []
      window.getSelection()?.removeAllRanges()
    }
  }, [])

  const findMatchOffsets = useCallback((text: string, q: string): number[] => {
    if (!q) return []
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escaped, 'gi')
    const offsets: number[] = []
    let m: RegExpExecArray | null
    while ((m = regex.exec(text)) !== null) {
      offsets.push(m.index)
    }
    return offsets
  }, [])

  const selectMatchAtOffset = useCallback((offset: number, length: number) => {
    if (!containerRef.current) return
    const pos = findPositionAtOffset(containerRef.current, offset)
    if (!pos) return
    const range = document.createRange()
    range.setStart(pos.node, pos.offset)
    range.setEnd(pos.node, pos.offset + length)
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
    // Scroll into view
    const rect = range.getBoundingClientRect()
    if (rect.top !== 0 || rect.left !== 0) {
      const scrollParent = containerRef.current?.parentElement
      if (scrollParent) {
        const containerRect = scrollParent.getBoundingClientRect()
        if (rect.top < containerRect.top || rect.bottom > containerRect.bottom) {
          scrollParent.scrollTo({
            top: scrollParent.scrollTop + rect.top - containerRect.top - containerRect.height / 3,
            behavior: 'smooth',
          })
        }
      }
    }
  }, [containerRef])

  const handleSearch = useCallback(() => {
    if (!query || !containerRef.current) {
      setMatches(0)
      setCurrentIdx(0)
      matchOffsets.current = []
      window.getSelection()?.removeAllRanges()
      return
    }
    const text = containerRef.current.textContent || ''
    const offsets = findMatchOffsets(text, query)
    matchOffsets.current = offsets
    setMatches(offsets.length)
    if (offsets.length > 0) {
      setCurrentIdx(1)
      selectMatchAtOffset(offsets[0], query.length)
    } else {
      setCurrentIdx(0)
      window.getSelection()?.removeAllRanges()
    }
  }, [query, containerRef, findMatchOffsets, selectMatchAtOffset])

  const goToMatch = useCallback((idx: number) => {
    const offsets = matchOffsets.current
    if (offsets.length === 0 || !query) return
    const clamped = ((idx - 1) % offsets.length + offsets.length) % offsets.length
    setCurrentIdx(clamped + 1)
    selectMatchAtOffset(offsets[clamped], query.length)
  }, [query, selectMatchAtOffset])

  const handleClose = useCallback(() => {
    matchOffsets.current = []
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
          setMatches(0)
          setCurrentIdx(0)
          matchOffsets.current = []
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
