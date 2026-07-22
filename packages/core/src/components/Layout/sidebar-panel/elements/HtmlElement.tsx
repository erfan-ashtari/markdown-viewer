import { memo } from 'react'

// Always use restrictive sandbox — never allow allow-same-origin as it negates sandboxing
const SAFE_SANDBOX = 'allow-scripts'

export const HtmlElement = memo(({ element }: any) => {
  return (
    <div style={{
      margin: '4px 10px',
      height: element.height || 200,
      borderRadius: '4px',
      overflow: 'hidden',
      border: '1px solid var(--border-color)',
    }}>
      <iframe
        src={element.src}
        sandbox={SAFE_SANDBOX}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title={element.id}
      />
    </div>
  )
})
HtmlElement.displayName = 'HtmlElement'
