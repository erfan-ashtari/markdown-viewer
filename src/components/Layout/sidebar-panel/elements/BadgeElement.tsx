import { memo } from 'react'

const colorMap: Record<string, string> = {
  default: 'var(--bg-tertiary)',
  primary: 'var(--accent-color)',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
}

const textColorMap: Record<string, string> = {
  default: 'var(--text-secondary)',
  primary: '#fff',
  success: '#fff',
  warning: '#fff',
  error: '#fff',
}

export const BadgeElement = memo(({ element, state }: any) => {
  // Use state override if available, otherwise use element definition
  const count = state?.[element.id]?.count ?? element.count
  const color = state?.[element.id]?.color ?? element.color

  return (
    <div style={{ padding: '4px 10px' }}>
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '10px',
        fontSize: '11px',
        backgroundColor: colorMap[color || 'default'],
        color: textColorMap[color || 'default'],
      }}>
        {element.label}
        {count != null && <span>{count}</span>}
      </span>
    </div>
  )
})
BadgeElement.displayName = 'BadgeElement'
