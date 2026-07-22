import { memo } from 'react'

const colorMap: Record<string, string> = {
  default: 'var(--text-primary)',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: 'var(--accent-color)',
}

export const StatusElement = memo(({ element }: any) => {
  return (
    <div style={{ padding: '4px 10px', fontSize: '12px' }}>
      {element.label && <span style={{ color: 'var(--text-muted)' }}>{element.label}: </span>}
      <span style={{ color: colorMap[element.color || 'default'] }}>{element.value}</span>
    </div>
  )
})
StatusElement.displayName = 'StatusElement'
