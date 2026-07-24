import { useEffect, useRef } from 'react'

interface HighlightLayerProps {
  containerRef: React.RefObject<HTMLDivElement | null>
  query: string
  activeIndex: number
  tabId: string | null
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

function clearHighlights() {
  if (typeof CSS !== 'undefined' && 'highlights' in CSS) {
    CSS.highlights.delete('find-match')
    CSS.highlights.delete('find-active')
  }
}

function buildHighlights(container: HTMLElement, query: string, activeIndex: number) {
  clearHighlights()
  if (!query) return

  const textContent = container.textContent || ''
  const matches = findMatches(textContent, query)
  if (matches.length === 0) return

  const ranges: Range[] = []
  for (const match of matches) {
    const range = offsetToRange(container, match.start, match.end)
    if (range) ranges.push(range)
  }
  if (ranges.length === 0) return

  CSS.highlights.set('find-match', new Highlight(...ranges))

  if (activeIndex > 0 && activeIndex <= ranges.length) {
    CSS.highlights.set('find-active', new Highlight(ranges[activeIndex - 1]))
    const parent = ranges[activeIndex - 1].startContainer.parentElement
    if (parent) {
      parent.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }
}

const CSS_SUPPORTED = typeof CSS !== 'undefined' && 'highlights' in CSS

export const HighlightLayer: React.FC<HighlightLayerProps> = ({ containerRef, query, activeIndex, tabId }) => {
  const prevQuery = useRef(query)
  const prevTabId = useRef(tabId)

  useEffect(() => {
    if (!CSS_SUPPORTED) return

    const tabChanged = prevTabId.current !== tabId
    prevTabId.current = tabId

    // On tab switch: clear highlights from old tab, then rebuild for new tab
    if (tabChanged) {
      clearHighlights()
      if (query) {
        requestAnimationFrame(() => {
          if (containerRef.current) {
            buildHighlights(containerRef.current, query, activeIndex)
          }
        })
      }
      return
    }

    const container = containerRef.current
    if (!container) return

    const queryChanged = prevQuery.current !== query
    prevQuery.current = query

    if (queryChanged) {
      clearHighlights()
      requestAnimationFrame(() => {
        if (containerRef.current) {
          buildHighlights(containerRef.current, query, activeIndex)
        }
      })
    } else {
      buildHighlights(container, query, activeIndex)
    }
  }, [query, activeIndex, tabId])

  // Cleanup on unmount
  useEffect(() => {
    return () => clearHighlights()
  }, [])

  return null
}
