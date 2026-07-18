import { useEffect, useRef } from 'react'

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

function mapOffsetsToRanges(
  container: HTMLElement,
  matches: MatchOffset[],
): Range[] {
  const ranges: Range[] = []
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null)

  // Build a map of (cumulative offset → text node + local offset)
  interface NodeMapping { node: Text; start: number; end: number }
  const nodeMap: NodeMapping[] = []
  let cumulative = 0

  while (walker.nextNode()) {
    const textNode = walker.currentNode as Text
    const len = textNode.textContent?.length || 0
    nodeMap.push({ node: textNode, start: cumulative, end: cumulative + len })
    cumulative += len
  }

  for (const match of matches) {
    // Find the text node(s) that contain this match
    let range: Range | null = null
    for (const mapping of nodeMap) {
      if (mapping.end <= match.start) continue
      if (mapping.start >= match.end) break

      const localStart = Math.max(0, match.start - mapping.start)
      const localEnd = Math.min(mapping.node.textContent?.length || 0, match.end - mapping.start)

      if (!range) {
        range = document.createRange()
        range.setStart(mapping.node, localStart)
      }
      range.setEnd(mapping.node, localEnd)
    }
    if (range) ranges.push(range)
  }

  return ranges
}

// Use the CSS Highlight API (modern browsers, Electron/Chromium)
const CSS_HIGHLIGHT_API_SUPPORTED = typeof CSS !== 'undefined' && 'highlights' in CSS

export const HighlightLayer: React.FC<HighlightLayerProps> = ({ containerRef, content, query, activeIndex }) => {
  const queryRef = useRef(query)
  const activeRef = useRef(activeIndex)
  queryRef.current = query
  activeRef.current = activeIndex

  useEffect(() => {
    if (!CSS_HIGHLIGHT_API_SUPPORTED) return
    if (!query || !containerRef.current) {
      CSS.highlights.clear()
      return
    }

    const matches = findMatches(content, query)
    if (matches.length === 0) {
      CSS.highlights.clear()
      return
    }

    const ranges = mapOffsetsToRanges(containerRef.current, matches)

    // Create highlights
    const matchHighlight = new Highlight(...ranges)
    CSS.highlights.set('find-match', matchHighlight)

    // Active match highlight (separate, on top)
    if (activeIndex > 0 && activeIndex <= ranges.length) {
      const activeRange = ranges[activeIndex - 1]
      const activeHighlight = new Highlight(activeRange)
      CSS.highlights.set('find-active', activeHighlight)

      // Scroll active match into view
      const rect = activeRange.getBoundingClientRect()
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
    }

    return () => {
      CSS.highlights.clear()
    }
  }, [content, query, activeIndex, containerRef])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (CSS_HIGHLIGHT_API_SUPPORTED) {
        CSS.highlights.clear()
      }
    }
  }, [])

  return null
}
