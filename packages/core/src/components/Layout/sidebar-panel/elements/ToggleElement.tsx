import { useCallback, memo } from 'react'

export const ToggleElement = memo(({ element, onInteraction }: any) => {
  const handleChange = useCallback(() => {
    onInteraction(element.id, 'change', { checked: !element.checked })
  }, [element.id, element.checked, onInteraction])

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
        aria-checked={element.checked}
        style={{
          width: '36px',
          height: '20px',
          borderRadius: '10px',
          border: 'none',
          padding: '2px',
          cursor: element.disabled ? 'not-allowed' : 'pointer',
          backgroundColor: element.checked ? 'var(--accent-color)' : 'var(--bg-tertiary)',
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
          left: element.checked ? '18px' : '2px',
          transition: 'left 0.2s',
        }} />
      </button>
    </div>
  )
})
ToggleElement.displayName = 'ToggleElement'
