import { useCallback, memo } from 'react'

export const LinkElement = memo(({ element }: any) => {
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    // Only open http/https links externally — never file:// or other protocols
    if (element.external !== false && /^https?:\/\//.test(element.url)) {
      window.electronAPI?.openExternal?.(element.url)
    }
  }, [element.url, element.external])

  return (
    <div style={{ padding: '4px 10px', fontSize: '12px' }}>
      <a
        href={element.url}
        onClick={handleClick}
        style={{
          color: 'var(--accent-color)',
          textDecoration: 'none',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline' }}
        onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none' }}
      >
        {element.label}
      </a>
    </div>
  )
})
LinkElement.displayName = 'LinkElement'
