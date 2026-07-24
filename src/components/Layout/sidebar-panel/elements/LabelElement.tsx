import React, { memo } from 'react'

const variantStyles: Record<string, React.CSSProperties> = {
  text: { fontSize: '12px', color: 'var(--text-primary)' },
  heading: { fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' },
  muted: { fontSize: '11px', color: 'var(--text-muted)' },
}

export const LabelElement = memo(({ element }: any) => {
  return (
    <div style={{ padding: '4px 10px', ...variantStyles[element.variant || 'text'] }}>
      {element.text}
    </div>
  )
})
LabelElement.displayName = 'LabelElement'
