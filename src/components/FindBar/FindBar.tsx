import React, { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronUp, ChevronDown, X } from 'lucide-react'

interface FindBarProps {
  onClose: () => void
  onSearch: (query: string) => void
  matchCount: number
  activeIndex: number
  onNavigate: (index: number) => void
}

export const FindBar: React.FC<FindBarProps> = React.memo(({ onClose, onSearch, matchCount, activeIndex, onNavigate }) => {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 30)
  }, [])

  const handleSearch = useCallback(() => {
    onSearch(query)
  }, [query, onSearch])

  const handlePrev = useCallback(() => {
    if (matchCount === 0) return
    const prev = activeIndex <= 1 ? matchCount : activeIndex - 1
    onNavigate(prev)
  }, [activeIndex, matchCount, onNavigate])

  const handleNext = useCallback(() => {
    if (matchCount === 0) return
    const next = activeIndex >= matchCount ? 1 : activeIndex + 1
    onNavigate(next)
  }, [activeIndex, matchCount, onNavigate])

  const handleClose = useCallback(() => {
    onSearch('')
    onClose()
  }, [onSearch, onClose])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (matchCount === 0) {
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
          if (e.target.value === '') onSearch('')
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
      {matchCount > 0 && (
        <span className="find-bar-count">
          {activeIndex} / {matchCount}
        </span>
      )}
      <button className="find-bar-btn" onClick={handlePrev} disabled={matchCount === 0} title="Previous (Shift+Enter)">
        <ChevronUp size={14} />
      </button>
      <button className="find-bar-btn" onClick={handleNext} disabled={matchCount === 0} title="Next (Enter)">
        <ChevronDown size={14} />
      </button>
      <button className="find-bar-btn" onClick={handleClose} title="Close (Esc)">
        <X size={14} />
      </button>
    </div>
  )
})
