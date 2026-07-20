import React, { useState, useCallback, useEffect, memo } from 'react';

interface EditorProps {
  content: string
  filePath: string
  fileName: string
  onSave: (newContent: string) => void
  onCancel: () => void
}

const Editor: React.FC<EditorProps> = memo(({ content, filePath, fileName, onSave, onCancel }) => {
  const [text, setText] = useState(content)
  const [dirty, setDirty] = useState(false)

  // Ctrl+S handler via custom event
  useEffect(() => {
    const handleSave = () => onSave(text)
    window.addEventListener('editor-save', handleSave)
    return () => window.removeEventListener('editor-save', handleSave)
  }, [text, onSave])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    setDirty(true)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Editor toolbar */}
      <div style={{
        padding: '6px 12px',
        borderBottom: '1px solid var(--border-color)',
        fontSize: '13px',
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: 'var(--bg-secondary)',
      }}>
        <span style={{ fontWeight: 500 }}>Editing</span>
        <span style={{ opacity: 0.5 }}>|</span>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {fileName} {dirty && <span style={{ color: 'var(--accent-color)' }}>•</span>}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
          <button
            onClick={() => onSave(text)}
            disabled={!dirty}
            style={{
              padding: '4px 10px',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              backgroundColor: dirty ? 'var(--accent-color)' : 'var(--bg-primary)',
              color: dirty ? 'white' : 'var(--text-muted)',
              cursor: dirty ? 'pointer' : 'default',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            Save
          </button>
          <button
            onClick={onCancel}
            style={{
              padding: '4px 10px',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
      {/* Textarea */}
      <textarea
        value={text}
        onChange={handleChange}
        spellCheck={false}
        style={{
          flex: 1,
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-code, "SF Mono", "Cascadia Code", "Fira Code", Consolas, monospace)',
          fontSize: '14px',
          lineHeight: '1.6',
          padding: '16px',
          border: 'none',
          outline: 'none',
          resize: 'none',
          tabSize: 2,
          width: '100%',
        }}
      />
    </div>
  )
})

Editor.displayName = 'Editor'

export { Editor }
