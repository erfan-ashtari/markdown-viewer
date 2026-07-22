import { useCallback, useState, useEffect, memo } from 'react'

export const TextInputElement = memo(({ element, onInteraction }: any) => {
  const [localValue, setLocalValue] = useState(element.value)

  useEffect(() => {
    setLocalValue(element.value)
  }, [element.value])

  const handleSubmit = useCallback(() => {
    if (localValue !== element.value) {
      onInteraction(element.id, 'submit', { value: localValue })
    }
  }, [localValue, element.id, element.value, onInteraction])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
  }, [handleSubmit])

  return (
    <div style={{ padding: '4px 10px' }}>
      {element.label && (
        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
          {element.label}
        </label>
      )}
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleSubmit}
        onKeyDown={handleKeyDown}
        placeholder={element.placeholder}
        disabled={element.disabled}
        style={{
          width: '100%',
          padding: '4px 6px',
          borderRadius: '4px',
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          fontSize: '12px',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
})
TextInputElement.displayName = 'TextInputElement'
