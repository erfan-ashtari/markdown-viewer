import { useCallback, useState, useEffect, memo } from 'react'

export const TextAreaElement = memo(({ element, onInteraction }: any) => {
  const [localValue, setLocalValue] = useState(element.value)

  useEffect(() => {
    setLocalValue(element.value)
  }, [element.value])

  const handleSubmit = useCallback(() => {
    if (localValue !== element.value) {
      onInteraction(element.id, 'submit', { value: localValue })
    }
  }, [localValue, element.id, element.value, onInteraction])

  return (
    <div style={{ padding: '4px 10px' }}>
      <textarea
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleSubmit}
        placeholder={element.placeholder}
        disabled={element.disabled}
        rows={element.rows || 3}
        style={{
          width: '100%',
          padding: '4px 6px',
          borderRadius: '4px',
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          fontSize: '12px',
          resize: 'vertical',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
})
TextAreaElement.displayName = 'TextAreaElement'
