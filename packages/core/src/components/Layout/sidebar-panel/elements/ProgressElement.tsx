import { memo } from 'react'

export const ProgressElement = memo(({ element }: any) => {
  const percent = Math.max(0, Math.min(100, element.value || 0))

  return (
    <div style={{ padding: '4px 10px' }}>
      {(element.label || element.showPercent !== false) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px' }}>
          {element.label && <span style={{ color: 'var(--text-muted)' }}>{element.label}</span>}
          {element.showPercent !== false && <span style={{ color: 'var(--text-muted)' }}>{percent}%</span>}
        </div>
      )}
      <div style={{
        height: '4px',
        backgroundColor: 'var(--bg-tertiary)',
        borderRadius: '2px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${percent}%`,
          backgroundColor: 'var(--accent-color)',
          transition: 'width 0.3s',
        }} />
      </div>
    </div>
  )
})
ProgressElement.displayName = 'ProgressElement'
