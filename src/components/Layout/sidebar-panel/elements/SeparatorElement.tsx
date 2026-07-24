import { memo } from 'react'

export const SeparatorElement = memo(() => {
  return (
    <div style={{
      height: '1px',
      backgroundColor: 'var(--border-color)',
      margin: '4px 10px',
    }} />
  )
})
SeparatorElement.displayName = 'SeparatorElement'
