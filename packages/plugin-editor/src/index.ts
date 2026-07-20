import React from 'react';
import type { Plugin } from '@mdview/plugin-api';
import { Editor } from './Editor';
import { Pencil, Eye } from 'lucide-react';

// File extensions that can be edited
const EDITABLE_EXTENSIONS = [
  'md', 'markdown', 'txt', 'log', 'csv',
  'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs',
  'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'h', 'cs',
  'html', 'css', 'scss', 'less', 'sass',
  'json', 'yaml', 'yml', 'toml', 'ini', 'env',
  'sh', 'bash', 'zsh', 'bat', 'ps1',
  'xml', 'svg', 'sql', 'graphql',
  'vue', 'svelte',
];

export function isEditableFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return EDITABLE_EXTENSIONS.includes(ext);
}

// Edit mode state (managed internally by plugin)
let editMode = false;
let editModeListeners: (() => void)[] = [];

export function isEditMode(): boolean {
  return editMode;
}

export function setEditMode(value: boolean): void {
  editMode = value;
  editModeListeners.forEach(function(fn) { fn(); });
}

export function onEditModeChange(callback: () => void): void {
  editModeListeners.push(callback);
}

export function offEditModeChange(callback: () => void): void {
  editModeListeners = editModeListeners.filter(function(fn) { return fn !== callback; });
}

// Edit toggle button component (for slot)
// Receives activeTab from Slot context
const EditToggleButton: React.FC<{ activeTab?: any }> = ({ activeTab }) => {
  const [, forceUpdate] = React.useState(0);

  // Subscribe to edit mode changes
  React.useEffect(function() {
    var handler = function() { forceUpdate(function(n) { return n + 1; }); };
    onEditModeChange(handler);
    return function() { offEditModeChange(handler); };
  }, []);

  if (!activeTab || !isEditableFile(activeTab.fileName)) return null;

  var currentEditMode = isEditMode();

  return (
    <button
      onClick={() => setEditMode(!currentEditMode)}
      style={{
        padding: '6px',
        borderRadius: '4px',
        border: 'none',
        backgroundColor: currentEditMode ? 'var(--accent-color)' : 'transparent',
        color: currentEditMode ? 'white' : 'var(--text-secondary)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseEnter={(e) => {
        if (!currentEditMode) e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
      }}
      onMouseLeave={(e) => {
        if (!currentEditMode) e.currentTarget.style.backgroundColor = 'transparent';
      }}
      title={currentEditMode ? 'Preview' : 'Edit'}
    >
      {currentEditMode ? <Eye size={16} /> : <Pencil size={16} />}
    </button>
  );
};

const EditorPlugin: Plugin = {
  name: 'editor',
  version: '1.0.0',
  description: 'Text editor with save functionality',
  register(api) {
    // Register slot for edit toggle button
    api.registerSlot({
      slot: 'header-right',
      id: 'editor-toggle',
      component: EditToggleButton,
      order: 50,
    });

    // Register content override
    api.registerContentOverride({
      canOverride: function(tab) { return isEditableFile(tab.fileName) && editMode; },
      component: Editor,
    });

    // Register Ctrl+S shortcut
    api.registerShortcut('Ctrl+S', function() {
      window.dispatchEvent(new CustomEvent('editor-save'));
    });
  }
};

export { EditorPlugin };
