# Markdown Viewer — Plugin System

## Overview

Markdown Viewer supports plugins that extend its functionality. Plugins can add new file type renderers, toolbar buttons, editors, and keyboard shortcuts — all without modifying the core app.

### Built-in Plugins

| Plugin | What it does |
|---|---|
| `pdf-viewer` | Renders PDF files using Chromium's native viewer via `<webview>` |
| `image-viewer` | Displays images (PNG, JPG, GIF, SVG, WebP, etc.) with zoom controls |

---

## How Plugins Work

### Architecture

```
User opens a file
  → App checks: pluginManager.getFileType("file.pdf")
  → Plugin found? → Renders plugin's component
  → No plugin?   → Falls back to built-in renderers (markdown, text)
```

### Plugin Lifecycle

1. **App starts** → `loadPlugins()` reads enabled plugins from localStorage
2. **Plugins register** → Each plugin calls `api.registerFileType()`, `api.registerToolbarItem()`, etc.
3. **User opens file** → App checks if any plugin handles that file extension
4. **Plugin renders** → Plugin's React component renders the file content
5. **User toggles in Settings** → Enable/disable plugins, reload to apply

---

## Creating a Plugin

### Step 1: Create the package

```
packages/
  plugin-my-thing/
    ├── src/
    │   └── index.tsx
    └── package.json
```

### Step 2: Write the plugin

```tsx
// packages/plugin-my-thing/src/index.tsx
import React, { useMemo, memo } from 'react';
import type { Plugin } from '@mdview/plugin-api';

// Your renderer component
const MyRenderer = memo(({ content, filePath }: { content: string; filePath: string }) => {
  const fileName = useMemo(() => filePath.split(/[/\\]/).pop() || '', [filePath]);

  return (
    <div>
      <h2>My File: {fileName}</h2>
      <pre>{content}</pre>
    </div>
  );
});
MyRenderer.displayName = 'MyRenderer';

// The plugin
const MyPlugin: Plugin = {
  name: 'my-plugin',
  version: '1.0.0',
  description: 'What this plugin does',
  register(api) {
    api.registerFileType({
      extensions: ['xyz'],           // file extensions to handle
      name: 'My File Type',         // display name
      icon: null,                    // Lucide icon component (optional)
      renderer: MyRenderer,          // React component to render the file
    });
  }
};

export { MyPlugin };
```

### Step 3: Create package.json

```json
{
  "name": "@mdview/plugin-my-thing",
  "version": "1.0.0",
  "description": "My plugin description",
  "main": "src/index.tsx",
  "types": "src/index.tsx",
  "dependencies": {
    "@mdview/plugin-api": "workspace:*"
  },
  "license": "MIT"
}
```

### Step 4: Register in the core app

**4a. Add Vite alias** (`packages/core/vite.config.ts`):
```ts
resolve: {
  alias: {
    '@mdview/plugin-my-thing': path.resolve(__dirname, '../plugin-my-thing/src'),
  },
},
```

**4b. Add TypeScript path** (`packages/core/tsconfig.json`):
```json
"paths": {
  "@mdview/plugin-my-thing": ["../plugin-my-thing/src"]
}
```

**4c. Import and register** (`packages/core/src/pluginLoader.ts`):
```ts
import { MyPlugin } from '@mdview/plugin-my-thing';

const builtinPlugins = [PdfPlugin, ImagesPlugin, MyPlugin];
```

**4d. Add to Settings IPC** (`packages/core/electron/main.js`):
```js
ipcMain.handle('get-plugins', () => {
  return [
    { name: 'pdf-viewer', version: '1.0.0', description: '...', builtin: true },
    { name: 'image-viewer', version: '1.0.0', description: '...', builtin: true },
    { name: 'my-plugin', version: '1.0.0', description: '...', builtin: true },
  ];
});
```

### Step 5: Done

The plugin now appears in Settings → Plugins. Users can enable/disable it.

---

## Plugin API Reference

### `api.registerFileType(config)`

Register a file type renderer.

```ts
api.registerFileType({
  extensions: ['pdf', 'PDF'],     // string[] — file extensions
  name: 'PDF Document',          // string — display name
  icon: null,                     // React component (optional)
  renderer: PdfRenderer,          // React component — receives { content, filePath }
});
```

### `api.registerToolbarItem(config)`

Add a button to the header toolbar.

```ts
api.registerToolbarItem({
  id: 'my-button',
  icon: MyIcon,                   // Lucide icon component
  tooltip: 'My Action',
  onClick: () => { /* ... */ },
});
```

### `api.registerEditor(config)`

Register a custom editor for file types.

```ts
api.registerEditor({
  id: 'my-editor',
  name: 'My Editor',
  canEdit: (filePath) => filePath.endsWith('.xyz'),
  editor: MyEditorComponent,
});
```

### `api.registerShortcut(keys, handler)`

Register a keyboard shortcut.

```ts
api.registerShortcut('Ctrl+Shift+X', () => {
  // do something
});
```

---

## Renderer Props

Your renderer component receives:

```ts
interface RendererProps {
  content: string;    // File content (text for markdown/text files)
  filePath: string;   // Full file path
}
```

---

## Available Core Utilities

These are ONE-TIME core additions that any plugin can use:

### `local-file://` protocol

Load local files in `<img>`, `<embed>`, `<webview>`, etc.:

```tsx
// Instead of file:// (blocked by Electron)
const src = 'local-file:///' + filePath.replace(/\\/g, '/');
<img src={src} />
<webview src={src} />
```

### `window.electronAPI.readFileBinary(filePath)`

Read a binary file as base64:

```ts
const base64 = await window.electronAPI.readFileBinary(filePath);
const dataUrl = 'data:application/pdf;base64,' + base64;
```

---

## Plugin Performance Best Practices

### Use React.memo

```tsx
const MyRenderer = memo(({ content, filePath }) => { /* ... */ });
MyRenderer.displayName = 'MyRenderer';
```

### Use useMemo for expensive computations

```tsx
const fileName = useMemo(() => filePath.split(/[/\\]/).pop() || '', [filePath]);
const src = useMemo(() => 'local-file:///' + filePath.replace(/\\/g, '/'), [filePath]);
```

### Use useCallback for event handlers

```tsx
const handleZoomIn = useCallback(() => setZoom(z => Math.min(z + 10, 300)), []);
```

### Use named exports (not default)

```tsx
// Good — Fast Refresh compatible
export { MyPlugin };

// Bad — breaks Vite Fast Refresh
export default MyPlugin;
```

---

## File Structure

```
packages/
├── core/                          # The main app
│   ├── electron/                  # Main process (main.js, preload.js)
│   ├── src/
│   │   ├── pluginLoader.ts        # Plugin registration
│   │   ├── store/appStore.ts      # enabledPlugins state
│   │   └── components/
│   │       └── Settings/          # Plugins tab in Settings
│   ├── vite.config.ts             # Plugin aliases
│   └── tsconfig.json              # Plugin paths
│
├── plugin-api/                    # Shared types and PluginManager
│   └── src/
│       ├── types.ts               # Plugin, PluginAPI, FileTypeConfig, etc.
│       ├── PluginManager.ts       # Registry (register, getFileType, etc.)
│       └── index.ts               # Exports
│
├── plugin-pdf/                    # Built-in: PDF viewer
│   └── src/index.tsx
│
└── plugin-images/                 # Built-in: Image viewer
    └── src/index.tsx
```

---

## Enabling/Disabling Plugins

Users toggle plugins in Settings → Plugins. Changes are:

1. **Persisted** in localStorage (`mdview-enabled-plugins`)
2. **Applied on reload** — `loadPlugins()` reads the list and only registers enabled plugins

First run: all built-in plugins are enabled by default.

---

## Adding a New Built-in Plugin

1. Create `packages/plugin-xxx/` with `src/index.tsx` and `package.json`
2. Add Vite alias in `packages/core/vite.config.ts`
3. Add TS path in `packages/core/tsconfig.json`
4. Import in `packages/core/src/pluginLoader.ts`, add to `builtinPlugins` array
5. Add to IPC list in `packages/core/electron/main.js` (`get-plugins` handler)
6. Done — appears in Settings → Plugins

---

## Electron Security Notes

- `local-file://` protocol is registered in main process — serves local files safely
- `<webview>` tag requires `webviewTag: true` in BrowserWindow webPreferences
- `webSecurity` is not disabled — plugins use the registered protocol instead
- `readFileBinary` IPC reads files from main process (secure boundary)
