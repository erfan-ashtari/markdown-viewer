import React, { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronUp, ChevronDown, X } from 'lucide-react'

interface FindBarProps {
  onClose: () => void
  containerRef: React.RefObject<HTMLDivElement | null>
}

export const FindBar: React.FC<FindBarProps> = ({ onClose, containerRef }) => {
  const [query, setQuery] = useState('')
  const [matches, setMatches] = useState<number>(0)
  const [currentIdx, setCurrentIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const markEls = useRef<HTMLElement[]>([])

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 30)
  }, [])

  // Clear highlights when query changes or component unmounts
  const clearHighlights = useCallback(() => {
    markEls.current.forEach((mark) => {
      if (mark.parentNode) {
        mark.replaceWith(...mark.childNodes)
      }
    })
    markEls.current = []
    // Merge adjacent text nodes that were split
    if (containerRef.current) {
      containerRef.current.normalize()
    }
  }, [containerRef])

  useEffect(() => {
    return () => clearHighlights()
  }, [clearHighlights])

  // Highlight all matches in the DOM
  const highlightAll = useCallback((q: string) => {
    clearHighlights()
    if (!q || !containerRef.current) {
      setMatches(0)
      setCurrentIdx(0)
      return
    }

    const walker = document.createTreeWalker(
      containerRef.current,
      NodeFilter.SHOW_TEXT,
      null,
    )

    const textNodes: Text[] = []
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode as Text)
    }

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escaped, 'gi')
    let totalMatches = 0
    const marks: HTMLElement[] = []

    for (const textNode of textNodes) {
      const text = textNode.textContent || ''
      if (!regex.test(text)) continue
      regex.lastIndex = 0

      const frag = document.createDocumentFragment()
      let lastIdx = 0
      let m: RegExpExecArray | null

      while ((m = regex.exec(text)) !== null) {
        // Text before match
        if (m.index > lastIdx) {
          frag.appendChild(document.createTextNode(text.slice(lastIdx, m.index)))
        }
        // The match wrapped in <mark>
        const mark = document.createElement('mark')
        mark.className = 'find-bar-highlight'
        mark.textContent = m[0]
        frag.appendChild(mark)
        marks.push(mark)
        totalMatches++
        lastIdx = m.index + m[0].length
      }

      // Remaining text
      if (lastIdx < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIdx)))
      }

      textNode.replaceWith(frag)
    }

    markEls.current = marks
    setMatches(totalMatches)
    setCurrentIdx(totalMatches > 0 ? 1 : 0)

    // Mark first match as active
    if (marks.length > 0) {
      marks[0].classList.add('find-bar-highlight-active')
      marks[0].scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [containerRef, clearHighlights])

  // Navigate to a specific match index
  const goToMatch = useCallback((idx: number) => {
    const marks = markEls.current
    if (marks.length === 0) return
    const clamped = ((idx - 1) % marks.length + marks.length) % marks.length
    // Remove active class from all, add to current
    marks.forEach((m) => m.classList.remove('find-bar-highlight-active'))
    marks[clamped].classList.add('find-bar-highlight-active')
    setCurrentIdx(clamped + 1)
    marks[clamped].scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [])

  const handleSearch = () => {
    highlightAll(query)
  }

  const handlePrev = () => {
    goToMatch(currentIdx - 1)
  }

  const handleNext = () => {
    goToMatch(currentIdx + 1)
  }

  const handleClose = () => {
    clearHighlights()
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (matches === 0) {
        handleSearch()
      } else {
        e.shiftKey ? handlePrev() : handleNext()
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
          // Clear old highlights when typing new query
          if (matches > 0) clearHighlights()
          setMatches(0)
          setCurrentIdx(0)
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
        onClick={handlePrev}
        disabled={matches === 0}
        title="Previous match (Shift+Enter)"
      >
        <ChevronUp size={14} />
      </button>
      <button
        className="find-bar-btn"
        onClick={handleNext}
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
}
