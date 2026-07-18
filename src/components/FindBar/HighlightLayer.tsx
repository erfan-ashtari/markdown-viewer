import { useEffect, useRef, useCallback } from 'react'

interface HighlightLayerProps {
  containerRef: React.RefObject<HTMLDivElement | null>
  query: string
  activeIndex: number
  matchCount: number
}

// Find the nth occurrence of query in container.textContent and select it
function selectNthMatch(container: HTMLElement, query: string, n: number): boolean {
  if (!query || n <= 0) return false
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(escaped, 'gi')

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null)
  let matchCount = 0
  let cumulativeOffset = 0

  while (walker.nextNode()) {
    const textNode = walker.currentNode as Text
    const text = textNode.textContent || ''
    let m: RegExpExecArray | null
    regex.lastIndex = 0

    while ((m = regex.exec(text)) !== null) {
      matchCount++
      if (matchCount === n) {
        // Found the target match — select it
        const range = document.createRange()
        range.setStart(textNode, m.index)
        range.setEnd(textNode, m.index + m[0].length)
        const selection = window.getSelection()
        selection?.removeAllRanges()
        selection?.addRange(range)

        // Scroll into view
        const parent = textNode.parentElement
        if (parent) {
          parent.scrollIntoView({ block: 'center', behavior: 'smooth' })
        }
        return true
      }
    }
    cumulativeOffset += text.length
  }
  return false
}

export const HighlightLayer: React.FC<HighlightLayerProps> = ({ containerRef, query, activeIndex, matchCount }) => {
  const lastActiveRef = useRef(0)

  const clearSelection = useCallback(() => {
    window.getSelection()?.removeAllRanges()
  }, [])

  // When active match changes, select it
  useEffect(() => {
    if (!containerRef.current || !query || matchCount === 0 || activeIndex === 0) {
      clearSelection()
      lastActiveRef.current = 0
      return
    }
    if (activeIndex === lastActiveRef.current) return
    lastActiveRef.current = activeIndex
    selectNthMatch(containerRef.current, query, activeIndex)
  }, [query, activeIndex, matchCount, containerRef, clearSelection])

  // Clear selection when query is cleared
  useEffect(() => {
    if (!query) {
      clearSelection()
      lastActiveRef.current = 0
    }
  }, [query, clearSelection])

  // Cleanup on unmount
  useEffect(() => {
    return () => clearSelection()
  }, [clearSelection])

  return null
}
