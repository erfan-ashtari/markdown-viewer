import React, { useState, useCallback, useEffect, useRef, memo } from 'react';
import { setEditMode } from './index';
import { buttonBase, headerBar } from '@mdview/plugin-api';

interface EditorProps {
  content: string
  filePath: string
  fileName: string
  onSave: (newContent: string) => void
}

const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

const Editor: React.FC<EditorProps> = memo(({ content, filePath, fileName, onSave }) => {
  const [text, setText] = useState(content);
  const [dirty, setDirty] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Ctrl+S handler — attached directly to the textarea element
  // This bypasses App.tsx's textarea guard that blocks window-level shortcuts
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        e.stopPropagation();
        if (dirty) onSave(text);
      }
    };
    el.addEventListener('keydown', handler);
    return () => el.removeEventListener('keydown', handler);
  }, [text, dirty, onSave]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setDirty(true);
  }, []);

  const handleSaveClick = useCallback(() => {
    if (dirty) onSave(text);
  }, [text, dirty, onSave]);

  const handleCancel = useCallback(() => {
    setEditMode(false);
    // Dispatch event so EditToggleButton can clear the override
    window.dispatchEvent(new CustomEvent('editor-edit-mode-change', { detail: { editMode: false } }));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Editor toolbar */}
      <div style={headerBar}>
        <span style={{ fontWeight: 500 }}>Editing</span>
        <span style={{ opacity: 0.5 }}>|</span>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {fileName}
          {dirty && (
            <span style={{ color: 'var(--accent-color)', fontSize: '12px', marginLeft: '6px' }}>
              (unsaved)
            </span>
          )}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
          <button
            className="mdview-plugin-btn"
            onClick={handleSaveClick}
            disabled={!dirty}
            aria-label="Save changes"
            style={{
              ...buttonBase,
              backgroundColor: dirty ? 'var(--accent-color)' : 'var(--bg-primary)',
              color: dirty ? 'white' : 'var(--text-muted)',
              cursor: dirty ? 'pointer' : 'default',
              opacity: dirty ? 1 : 0.5,
              fontWeight: 500,
            }}
          >
            Save{dirty && <span style={{ fontSize: '10px', marginLeft: '4px', opacity: 0.7 }}>{isMac ? '⌘S' : 'Ctrl+S'}</span>}
          </button>
          <button
            className="mdview-plugin-btn"
            onClick={handleCancel}
            aria-label="Cancel editing"
            style={buttonBase}
          >
            Cancel
          </button>
        </div>
      </div>
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        spellCheck={false}
        aria-label={`Edit ${fileName}`}
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
  );
});

Editor.displayName = 'Editor';

export { Editor };
