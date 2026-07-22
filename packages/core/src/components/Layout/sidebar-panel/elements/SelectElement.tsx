import React, { useCallback, useState, useEffect, memo } from 'react'

export const SelectElement = memo(({ element, state, onInteraction }: any) => {
  // Use state override if available, otherwise use element definition, fallback to empty string
  const initialValue = state?.[element.id]?.value ?? element.value ?? ''
  const [localValue, setLocalValue] = useState(initialValue)

  // Sync with external state updates
  useEffect(() => {
    setLocalValue(initialValue)
  }, [initialValue])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value
    // Optimistic update - immediately reflect the change
    setLocalValue(newValue)
    onInteraction(element.id, 'change', { value: newValue })
  }, [element.id, onInteraction])

  const value = localValue

  return (
    <div style={{ padding: '4px 10px' }}>
      {element.label && (
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
          {element.label}
        </label>
      )}
      <select
        value={value}
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
