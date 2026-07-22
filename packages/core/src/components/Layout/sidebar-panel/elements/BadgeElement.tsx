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

export const BadgeElement = memo(({ element }: any) => {
  return (
    <div style={{ padding: '4px 10px' }}>
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '10px',
        fontSize: '11px',
        backgroundColor: colorMap[element.color || 'default'],
        color: textColorMap[element.color || 'default'],
      }}>
        {element.label}
        {element.count != null && <span>{element.count}</span>}
      </span>
    </div>
  )
})
BadgeElement.displayName = 'BadgeElement'
