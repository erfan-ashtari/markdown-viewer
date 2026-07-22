import React, { useCallback, memo } from 'react'

export const SelectElement = memo(({ element, onInteraction }: any) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onInteraction(element.id, 'change', { value: e.target.value })
  }, [element.id, onInteraction])

  return (
    <div style={{ padding: '4px 10px' }}>
      {element.label && (
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
          {element.label}
        </label>
      )}
      <select
        value={element.value}
        onChange={handleChange}
        disabled={element.disabled}
        style={{
          width: '100%',
          padding: '4px 6px',
          borderRadius: '4px',
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          fontSize: '12px',
        }}
      >
        {element.options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
})
SelectElement.displayName = 'SelectElement'
