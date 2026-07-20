import type { Plugin } from '@mdview/plugin-api';

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

const EditorPlugin: Plugin = {
  name: 'editor',
  version: '1.0.0',
  description: 'Text editor with save functionality',
  register(api) {
    // Editor is a mode toggle, not a file type renderer
    // Core app checks isEditableFile() to show/hide edit button
  }
};

export { EditorPlugin };
