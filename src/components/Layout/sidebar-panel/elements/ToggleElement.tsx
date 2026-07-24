import { useCallback, useState, useEffect, memo } from 'react'

export const ToggleElement = memo(({ element, state, onInteraction }: any) => {
  // Use state override if available, otherwise use element definition
  const initialValue = state?.[element.id]?.checked ?? element.checked ?? false
  const [localChecked, setLocalChecked] = useState(initialValue)

  // Sync with external state updates
  useEffect(() => {
    setLocalChecked(initialValue)
  }, [initialValue])

  const handleChange = useCallback(() => {
    const newValue = !localChecked
    // Optimistic update - immediately reflect the change
    setLocalChecked(newValue)
    onInteraction(element.id, 'change', { checked: newValue })
  }, [element.id, localChecked, onInteraction])

  const checked = localChecked

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '4px 10px',
    }}>
      <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{element.label}</span>
      <button
        onClick={handleChange}
        disabled={element.disabled}
        role="switch"
        aria-checked={checked}
        style={{
          width: '36px',
          height: '20px',
          borderRadius: '10px',
          border: 'none',
          padding: '2px',
          cursor: element.disabled ? 'not-allowed' : 'pointer',
          backgroundColor: checked ? 'var(--accent-color)' : 'var(--bg-tertiary)',
          position: 'relative',
          transition: 'background-color 0.2s',
          flexShrink: 0,
        }}
      >
        <div style={{
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: 'white',
          position: 'absolute',
          top: '2px',
          left: checked ? '18px' : '2px',
          transition: 'left 0.2s',
        }} />
      </button>
    </div>
  )
})
ToggleElement.displayName = 'ToggleElement'
