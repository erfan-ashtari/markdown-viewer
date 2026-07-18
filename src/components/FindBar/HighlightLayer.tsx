import { useEffect } from 'react'

interface HighlightLayerProps {
  containerRef: React.RefObject<HTMLDivElement | null>
  content: string
  query: string
  activeIndex: number
}

interface MatchOffset {
  start: number
  end: number
}

function findMatches(text: string, query: string): MatchOffset[] {
  if (!query) return []
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(escaped, 'gi')
  const matches: MatchOffset[] = []
  let m: RegExpExecArray | null
  while ((m = regex.exec(text)) !== null) {
    matches.push({ start: m.index, end: m.index + m[0].length })
  }
  return matches
}

// Map a character offset in container.textContent to a DOM Range
function offsetToRange(container: HTMLElement, start: number, end: number): Range | null {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null)
  let cumulative = 0
  let range: Range | null = null

  while (walker.nextNode()) {
    const textNode = walker.currentNode as Text
    const len = textNode.textContent?.length || 0
    const nodeEnd = cumulative + len

    if (nodeEnd <= start) {
      cumulative = nodeEnd
      continue
    }
    if (cumulative >= end) break

    const localStart = Math.max(0, start - cumulative)
    const localEnd = Math.min(len, end - cumulative)

    if (!range) {
      range = document.createRange()
      range.setStart(textNode, localStart)
    }
    range.setEnd(textNode, localEnd)

    if (nodeEnd >= end) break
    cumulative = nodeEnd
  }

  return range
}

const CSS_HIGHLIGHT_API_SUPPORTED = typeof CSS !== 'undefined' && 'highlights' in CSS

export const HighlightLayer: React.FC<HighlightLayerProps> = ({ containerRef, query, activeIndex }) => {
  useEffect(() => {
    if (!CSS_HIGHLIGHT_API_SUPPORTED || !query || !containerRef.current) {
      if (CSS_HIGHLIGHT_API_SUPPORTED) CSS.highlights.clear()
      return
    }

    // Search the RENDERED text content, not raw markdown
    const textContent = containerRef.current.textContent || ''
    const matches = findMatches(textContent, query)

    if (matches.length === 0) {
      CSS.highlights.clear()
      return
    }

    // Build ranges from the rendered DOM
    const ranges: Range[] = []
    for (const match of matches) {
      const range = offsetToRange(containerRef.current, match.start, match.end)
      if (range) ranges.push(range)
    }

    if (ranges.length === 0) {
      CSS.highlights.clear()
      return
    }

    // All matches — yellow
    const matchHighlight = new Highlight(...ranges)
    CSS.highlights.set('find-match', matchHighlight)

    // Active match — orange
    if (activeIndex > 0 && activeIndex <= ranges.length) {
      const activeRange = ranges[activeIndex - 1]
      const activeHighlight = new Highlight(activeRange)
      CSS.highlights.set('find-active', activeHighlight)

      // Scroll active match into view
      const rect = activeRange.getBoundingClientRect()
      const scrollParent = containerRef.current?.parentElement
      if (scrollParent && (rect.top !== 0 || rect.left !== 0)) {
        const containerRect = scrollParent.getBoundingClientRect()
        if (rect.top < containerRect.top || rect.bottom > containerRect.bottom) {
          scrollParent.scrollTo({
            top: scrollParent.scrollTop + rect.top - containerRect.top - containerRect.height / 3,
            behavior: 'smooth',
          })
        }
      }
    }

    return () => {
      CSS.highlights.clear()
    }
  }, [query, activeIndex, containerRef])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (CSS_HIGHLIGHT_API_SUPPORTED) CSS.highlights.clear()
    }
  }, [])

  return null
}
