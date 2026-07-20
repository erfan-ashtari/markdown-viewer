import React from 'react';
import type { Plugin } from '@mdview/plugin-api';
import { buttonBase, injectPluginStyles } from '@mdview/plugin-api';
import { Editor } from './Editor';
import { Pencil, Eye } from 'lucide-react';

// Text file extensions the editor can handle
const TEXT_EXTENSIONS = new Set([
  // Code — languages
  'js', 'jsx', 'mjs', 'cjs', 'ts', 'tsx', 'mts', 'cts',
  'py', 'pyw', 'pyi', 'pyx',
  'rb', 'erb',
  'php',
  'go', 'rs', 'java', 'kt', 'kts', 'swift',
  'c', 'h', 'cpp', 'cxx', 'cc', 'hpp', 'hxx',
  'cs', 'fs', 'fsx', 'fsi',
  'scala', 'sc', 'clj', 'cljs', 'cljc',
  'r', 'm', 'mm',
  'dart', 'jl', 'nim', 'v', 'vhd',
  'lua', 'hs', 'ml', 'ex', 'exs',
  'zig', 'cr', 'sol',

  // Scripting / Shell
  'sh', 'bash', 'zsh', 'fish', 'ksh',
  'bat', 'cmd', 'ps1', 'psm1', 'psd1',
  'bashrc', 'zshrc', 'profile',

  // SQL
  'sql', 'psql', 'mysql', 'sqlite',

  // Web
  'html', 'htm', 'xhtml', 'vue', 'svelte',
  'css', 'scss', 'sass', 'less', 'styl',
  'xml', 'xsl', 'xslt', 'xsd', 'dtd',

  // Data / Config
  'json', 'jsonc', 'jsonl', 'json5',
  'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf',
  'env', 'properties', 'prop',
  'csv', 'tsv', 'psv',

  // Build / Infra
  'dockerfile', 'makefile', 'cmake', 'gradle',
  'tf', 'hcl', 'nomad', 'pkr',

  // Docs / Text
  'txt', 'text', 'log', 'md', 'markdown', 'rst',
  'tex', 'latex', 'bib', 'sty', 'cls',
  'diff', 'patch',
  'adoc', 'asciidoc',

  // Misc text
  'gitignore', 'gitattributes', 'editorconfig',
  'prettierrc', 'eslintrc', 'babelrc',
  'license', 'licence', 'authors', 'changelog',
  'passwd', 'shadow', 'hosts',
]);

// Full filename matches (no extension)
const TEXT_FILE_NAMES = new Set([
  'dockerfile', 'makefile', 'gnumakefile', 'cmakelists.txt',
  '.gitignore', '.gitattributes', '.editorconfig', '.eslintignore',
  '.prettierignore', '.npmignore', '.dockerignore',
  'license', 'licence', 'readme', 'changelog', 'authors',
  'contributing', 'copying', 'todo',
]);

export function isEditableFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (TEXT_EXTENSIONS.has(ext)) return true;
  const fullLower = fileName.toLowerCase();
  return TEXT_FILE_NAMES.has(fullLower);
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
const EditToggleButton: React.FC<{
  activeTab?: any;
  toggleContentOverride?: (tab: { filePath: string; fileName: string; content: string }) => void;
  isContentOverrideActive?: () => boolean;
}> = ({ activeTab, toggleContentOverride, isContentOverrideActive }) => {
  const [, forceUpdate] = React.useState(0);

  React.useEffect(function() {
    var handler = function() { forceUpdate(function(n) { return n + 1; }); };
    onEditModeChange(handler);
    return function() { offEditModeChange(handler); };
  }, []);

  React.useEffect(function() {
    var handler = function(e: Event) {
      var detail = (e as CustomEvent).detail;
      if (detail && typeof detail.editMode === 'boolean') {
        setEditMode(detail.editMode);
        // Clear override when edit mode is turned off (e.g. Cancel button)
        if (!detail.editMode && isContentOverrideActive && isContentOverrideActive() && activeTab && toggleContentOverride) {
          toggleContentOverride({ filePath: activeTab.filePath, fileName: activeTab.fileName, content: activeTab.content });
        }
      }
    };
    window.addEventListener('editor-edit-mode-change', handler);
    return function() { window.removeEventListener('editor-edit-mode-change', handler); };
  }, [activeTab, toggleContentOverride, isContentOverrideActive]);

  if (!activeTab || !isEditableFile(activeTab.fileName)) return null;

  var isActive = isContentOverrideActive ? isContentOverrideActive() : false;

  return (
    <button
      className="mdview-plugin-btn"
      onClick={() => {
        setEditMode(!isActive);
        if (toggleContentOverride) {
          toggleContentOverride({ filePath: activeTab.filePath, fileName: activeTab.fileName, content: activeTab.content });
        }
      }}
      aria-pressed={isActive}
      aria-label="Toggle edit mode"
      title={isActive ? 'Preview (switch back)' : 'Edit file'}
      style={{
        ...buttonBase,
        padding: '6px',
        backgroundColor: isActive ? 'var(--accent-color)' : 'transparent',
        color: isActive ? 'white' : 'var(--text-secondary)',
      }}
    >
      {isActive ? <Eye size={16} /> : <Pencil size={16} />}
    </button>
  );
};

const EditorPlugin: Plugin = {
  name: 'editor',
  version: '1.0.0',
  description: 'Text editor with save functionality',
  register(api) {
    injectPluginStyles();
    api.registerSlot({
      slot: 'header-right',
      id: 'editor-toggle',
      component: EditToggleButton,
      order: 50,
    });
    api.registerContentOverride({
      canOverride: function(tab) { return isEditableFile(tab.fileName) && editMode; },
      component: Editor,
    });
  }
};

export { EditorPlugin };
