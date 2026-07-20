import type { Plugin } from '@mdview/plugin-api';
import { Editor } from './Editor';

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
let onModeChange: (() => void) | null = null;

export function isEditMode(): boolean {
  return editMode;
}

export function setEditMode(value: boolean): void {
  editMode = value;
  if (onModeChange) onModeChange();
}

export function onEditModeChange(callback: () => void): void {
  onModeChange = callback;
}

const EditorPlugin: Plugin = {
  name: 'editor',
  version: '1.0.0',
  description: 'Text editor with save functionality',
  register(api) {
    // Register content override — replaces content area when editing
    api.registerContentOverride({
      canOverride: (tab) => isEditableFile(tab.fileName) && editMode,
      component: Editor,
    });

    // Register Ctrl+S shortcut
    api.registerShortcut('Ctrl+S', () => {
      window.dispatchEvent(new CustomEvent('editor-save'));
    });
  }
};

export { EditorPlugin };
