# Markdown Viewer — Plugin Development Guide

## Core Principle: Self-Contained Plugins

**Plugins must NEVER require changes to core code.** Every plugin is fully self-contained — it registers capabilities through the Plugin API, receives context through Slot props, and communicates via custom events. If you think core needs a change, you probably need to extend the plugin API instead.

What plugins can do through the API alone:
- Render any file type
- Inject UI into named slots (toolbar, header, etc.)
- Replace the content area (content override)
- Register keyboard shortcuts
- Write files (save) via IPC
- Access local files via `local-file://` protocol

What plugins must NEVER do:
- Import from `../../core/` or any core path
- Modify core components
- Access `pluginManager` directly (receive it through Slot context)

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Core (App.tsx)                                 │
│                                                 │
│  ┌─ <Slot name="header-right" context={...} /> ─┤──→ Plugin components rendered here
│  │                                               │
│  ├─ getActiveContentOverride()                   │
│  │   → pluginOverride ? <Override.component />  │──→ Plugin replaces content area
│  │   → pluginFileType ? <FileType.renderer />   │──→ Plugin renders file type
│  │   → default renderers (markdown, text)       │
│                                                 │
│  Listens to: pluginManager.onOverrideChange()   │
│  Passes through Slot context:                   │
│    - activeTab                                  │
│    - toggleContentOverride()                    │
│    - isContentOverrideActive()                  │
│    - hasContentOverride()                       │
└─────────────────────────────────────────────────┘
```

---

## The Five Plugin APIs

### 1. `registerFileType` — Render any file type

The plugin owns a renderer component that receives `{ content, filePath }`.

```tsx
// packages/plugin-pdf/src/index.tsx
import React, { memo } from 'react';
import type { Plugin } from '@mdview/plugin-api';

const PdfRenderer = memo(({ content, filePath }: { content: string; filePath: string }) => {
  const src = useMemo(() => 'local-file:///' + filePath.replace(/\\/g, '/'), [filePath]);
  return <webview src={src} style={{ flex: 1, width: '100%' }} />;
});

const PdfPlugin: Plugin = {
  name: 'pdf-viewer',
  version: '1.0.0',
  description: 'PDF viewer using Chromium native renderer',
  register(api) {
    api.registerFileType({
      extensions: ['pdf'],
      name: 'PDF Document',
      icon: null,                    // Lucide icon or null
      renderer: PdfRenderer,         // React component: { content, filePath }
    });
  }
};
export { PdfPlugin };
```

**When it's called:** User opens a file → `pluginManager.getFileType("file.pdf")` → finds the plugin → renders `<PdfRenderer content={...} filePath={...} />`.

**Your renderer receives:**
```ts
{
  content: string;    // File content (text for text files)
  filePath: string;   // Full absolute path
}
```

**Multiple extensions:** Register once with an array:
```ts
api.registerFileType({
  extensions: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp', 'ico', 'tiff', 'avif'],
  name: 'Image',
  icon: null,
  renderer: ImageRenderer,
});
```

---

### 2. `registerSlot` — Inject UI into named slots

Slots are named placeholders in core's layout where plugins can inject components.

```tsx
// The header-right slot (in Header.tsx)
<Slot name="header-right" context={{
  activeTab,
  toggleContentOverride: (tab) => pluginManager.toggleContentOverride(tab),
  isContentOverrideActive: () => pluginManager.isContentOverrideActive(),
  hasContentOverride: (tab) => pluginManager.hasContentOverride(tab),
}} />
```

**Register a component for a slot:**

```tsx
const MyButton: React.FC<{ activeTab?: any }> = ({ activeTab }) => {
  if (!activeTab) return null;
  return <button onClick={() => alert(activeTab.fileName)}>Click me</button>;
};

api.registerSlot({
  slot: 'header-right',       // Slot name (must match a <Slot> in core)
  id: 'my-button',            // Unique ID for this slot entry
  component: MyButton,        // React component (receives Slot context as props)
  order: 100,                 // Lower = further left (default: 100)
});
```

**Available slots:**
| Slot name | Location | Context props |
|---|---|---|
| `header-right` | Header, left of theme/export buttons | `activeTab`, `toggleContentOverride`, `isContentOverrideActive`, `hasContentOverride` |

**Your component receives all Slot context as props:**
```tsx
const MyButton: React.FC<{
  activeTab?: { id: string; fileName: string; filePath: string; content: string; type: string };
  toggleContentOverride?: (tab: { filePath: string; fileName: string; content: string }) => void;
  isContentOverrideActive?: () => boolean;
  hasContentOverride?: (tab: { filePath: string; fileName: string; content: string }) => boolean;
}> = ({ activeTab, toggleContentOverride, isContentOverrideActive }) => {
  // ...
};
```

---

### 3. `registerContentOverride` — Replace the content area

This is the most powerful API. A content override replaces the entire content area when its `canOverride` returns true. Use this for editors, custom viewers, or anything that needs to take over the main panel.

```tsx
api.registerContentOverride({
  canOverride: (tab) => {
    // tab = { filePath, fileName, content }
    // Return true when this override should be active
    return isEditableFile(tab.fileName) && editMode;
  },
  component: Editor,  // React component: { content, filePath, fileName, onSave }
});
```

**How it works:**

1. **Toggle:** Something calls `pluginManager.toggleContentOverride(tab)`
2. **Evaluate:** PluginManager runs `canOverride(tab)` on all registered overrides
3. **Activate:** First matching override becomes active
4. **Render:** App.tsx renders `<Override.component content={...} filePath={...} fileName={...} onSave={...} />`
5. **Deactivate:** Call `toggleContentOverride(tab)` again → override clears → back to normal renderer

**Your override component receives:**
```ts
{
  content: string;     // Current file content
  filePath: string;    // Full file path
  fileName: string;    // Just the filename
  onSave: (newContent: string) => void;  // Call to save (writes file + updates tab)
}
```

**Example — Editor with save:**
```tsx
const Editor: React.FC<EditorProps> = memo(({ content, filePath, fileName, onSave }) => {
  const [text, setText] = useState(content);
  const [dirty, setDirty] = useState(false);

  // Listen for Ctrl+S custom event
  useEffect(() => {
    const handleSave = () => { if (dirty) onSave(text); };
    window.addEventListener('editor-save', handleSave);
    return () => window.removeEventListener('editor-save', handleSave);
  }, [text, dirty, onSave]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <textarea value={text} onChange={e => { setText(e.target.value); setDirty(true); }} />
      <button onClick={() => onSave(text)} disabled={!dirty}>Save</button>
    </div>
  );
});
```

---

### 4. `registerShortcut` — Keyboard shortcuts

```tsx
api.registerShortcut('Ctrl+S', function() {
  window.dispatchEvent(new CustomEvent('editor-save'));
});
```

Shortcuts are matched by the PluginManager when the user presses keys. The shortcut string format is `Ctrl+Shift+Key` (e.g., `Ctrl+S`, `Ctrl+Shift+F`).

---

### 5. `registerToolbarItem` — Static toolbar buttons

```tsx
api.registerToolbarItem({
  id: 'my-tool',
  icon: Wrench,          // Lucide icon component
  tooltip: 'My Tool',
  onClick: () => { /* ... */ },
  position: 'right',     // 'left' | 'center' | 'right'
});
```

Toolbar items are always visible (unlike slot components which can conditionally render).

---

## Communication Patterns

### Pattern 1: Slot context (core → plugin)

Core passes data to plugin components through Slot context props. This is the primary way plugins receive state from core.

```tsx
// In your slot component:
const MyButton: React.FC<{ activeTab?: any }> = ({ activeTab }) => {
  // activeTab is passed by core through Slot context
  if (!activeTab) return null;
  return <span>{activeTab.fileName}</span>;
};
```

### Pattern 2: Custom events (plugin ↔ core, plugin ↔ plugin)

Plugins communicate with each other and with core through `window.dispatchEvent` and `window.addEventListener`. This keeps plugins decoupled.

```tsx
// Plugin A dispatches an event
window.dispatchEvent(new CustomEvent('editor-save'));

// Plugin A listens for core's response
window.addEventListener('editor-edit-mode-change', (e) => {
  const { editMode } = (e as CustomEvent).detail;
  setEditMode(editMode);
});

// Core dispatches (in App.tsx handleOverrideSave)
window.dispatchEvent(new CustomEvent('editor-edit-mode-change', { detail: { editMode: false } }));
```

### Pattern 3: Slot context actions (plugin → core)

Plugins call core actions through Slot context props. The plugin never touches `pluginManager` directly.

```tsx
// The toggleContentOverride function is provided by core through Slot context
const MyButton: React.FC<{
  activeTab?: any;
  toggleContentOverride?: (tab: { filePath: string; fileName: string; content: string }) => void;
}> = ({ activeTab, toggleContentOverride }) => {

  const handleClick = () => {
    if (toggleContentOverride && activeTab) {
      toggleContentOverride({
        filePath: activeTab.filePath,
        fileName: activeTab.fileName,
        content: activeTab.content,
      });
    }
  };

  return <button onClick={handleClick}>Toggle</button>;
};
```

### Pattern 4: Plugin-internal state

Plugins manage their own state with module-level variables + listener arrays. This is simpler than React context and works across components.

```tsx
// Module-level state
let editMode = false;
let editModeListeners: (() => void)[] = [];

export function isEditMode() { return editMode; }

export function setEditMode(value: boolean) {
  editMode = value;
  editModeListeners.forEach(fn => fn());
}

export function onEditModeChange(callback: () => void) {
  editModeListeners.push(callback);
}

export function offEditModeChange(callback: () => void) {
  editModeListeners = editModeListeners.filter(fn => fn !== callback);
}

// In a component:
const MyComponent = () => {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const handler = () => forceUpdate(n => n + 1);
    onEditModeChange(handler);
    return () => offEditModeChange(handler);
  }, []);

  return <div>{isEditMode() ? 'Editing' : 'Viewing'}</div>;
};
```

---

## Complete Workcase: Editor Plugin

The editor plugin demonstrates all APIs working together. Here's the full flow:

### Registration

```tsx
const EditorPlugin: Plugin = {
  name: 'editor',
  version: '1.0.0',
  description: 'Text editor with save functionality',
  register(api) {
    // 1. Inject a toggle button into the header
    api.registerSlot({
      slot: 'header-right',
      id: 'editor-toggle',
      component: EditToggleButton,
      order: 50,
    });

    // 2. Register content override (replaces content area when active)
    api.registerContentOverride({
      canOverride: (tab) => isEditableFile(tab.fileName) && editMode,
      component: Editor,
    });

    // 3. Register Ctrl+S shortcut
    api.registerShortcut('Ctrl+S', () => {
      window.dispatchEvent(new CustomEvent('editor-save'));
    });
  }
};
```

### Flow: User clicks Edit

```
1. User clicks pencil icon (EditToggleButton)
   └→ setEditMode(true)            // Plugin internal state
   └→ toggleContentOverride(tab)   // Calls core via Slot context
       └→ PluginManager evaluates canOverride(tab)
           └→ isEditableFile(tab.fileName) && editMode → true
       └→ Sets activeContentOverride = editor override
       └→ notifyOverrideChange()
           └→ App.tsx setOverrideTick() → re-render
   └→ App.tsx renders <Editor content={...} filePath={...} onSave={handleSave} />
```

### Flow: User saves (Ctrl+S or Save button)

```
1. Ctrl+S dispatched as 'editor-save' custom event
   └→ Editor component listens → calls onSave(text)

2. App.tsx handleOverrideSave(newContent):
   └→ window.electronAPI.writeFile(filePath, newContent)  // Writes to disk
   └→ useAppStore updates tab content
   └→ pluginManager.toggleContentOverride(tab)            // Clears override
   └→ window.dispatchEvent('editor-edit-mode-change', { editMode: false })

3. Editor plugin listens → setEditMode(false)
   └→ EditToggleButton re-renders → shows pencil icon
```

### Flow: User clicks Cancel

```
1. Editor calls setEditMode(false)
   └→ editMode = false
   └→ editModeListeners notified → EditToggleButton re-renders (pencil icon)
   └→ But override is still active! canOverride returns false on next toggle.
   └→ User must click toggle again to clear the override.
```

---

## Reading and Writing Files

### Reading files

Core loads file content when opening. Your renderer receives it as `content` prop. For binary files, use the IPC:

```tsx
// Read binary file as base64
const base64 = await window.electronAPI.readFileBinary(filePath);
const dataUrl = 'data:application/pdf;base64,' + base64;
```

### Writing files (save)

Use the `onSave` callback provided by the content override. It handles:
1. Writing to disk via `window.electronAPI.writeFile()`
2. Updating the tab content in the store
3. Clearing the content override

```tsx
const Editor: React.FC<EditorProps> = memo(({ content, filePath, fileName, onSave }) => {
  const handleSave = () => {
    onSave(text);  // This handles everything
  };

  // Or save via custom event for Ctrl+S
  useEffect(() => {
    const handler = () => { if (dirty) onSave(text); };
    window.addEventListener('editor-save', handler);
    return () => window.removeEventListener('editor-save', handler);
  }, [text, dirty, onSave]);
});
```

### Accessing local files in HTML elements

Electron blocks `file://` URLs. Use the registered `local-file://` protocol instead:

```tsx
// For <img>, <webview>, <embed>, etc.
const src = 'local-file:///' + filePath.replace(/\\/g, '/');

<img src={src} />
<webview src={src} />
```

---

## Adding a New Built-in Plugin

1. Create `packages/plugin-xxx/`:
   ```
   packages/plugin-xxx/
     ├── src/
     │   ├── index.tsx        # Plugin definition + registration
     │   └── MyRenderer.tsx   # Your renderer component (optional)
     └── package.json
   ```

2. **package.json:**
   ```json
   {
     "name": "@mdview/plugin-xxx",
     "version": "1.0.0",
     "main": "src/index.tsx",
     "types": "src/index.tsx",
     "dependencies": {
       "@mdview/plugin-api": "workspace:*"
     }
   }
   ```

3. **Vite alias** (`packages/core/vite.config.ts`):
   ```ts
   '@mdview/plugin-xxx': path.resolve(__dirname, '../plugin-xxx/src'),
   ```

4. **TypeScript path** (`packages/core/tsconfig.json`):
   ```json
   "@mdview/plugin-xxx": ["../plugin-xxx/src"]
   ```

5. **Register** (`packages/core/src/pluginLoader.ts`):
   ```ts
   import { XPlugin } from '@mdview/plugin-xxx';
   const builtinPlugins = [PdfPlugin, ImagesPlugin, EditorPlugin, XPlugin];
   ```

6. **Settings IPC** (`packages/core/electron/main.js`):
   ```js
   ipcMain.handle('get-plugins', () => {
     return [
       { name: 'pdf-viewer', version: '1.0.0', description: '...', builtin: true },
       { name: 'image-viewer', version: '1.0.0', description: '...', builtin: true },
       { name: 'editor', version: '1.0.0', description: '...', builtin: true },
       { name: 'xxx', version: '1.0.0', description: '...', builtin: true },
     ];
   });
   ```

7. Done — appears in Settings → Plugins.

---

## Performance Best Practices

### Use React.memo

```tsx
const MyRenderer = memo(({ content, filePath }) => { /* ... */ });
MyRenderer.displayName = 'MyRenderer';
```

### Use useMemo for derived values

```tsx
const fileName = useMemo(() => filePath.split(/[/\\]/).pop() || '', [filePath]);
const src = useMemo(() => 'local-file:///' + filePath.replace(/\\/g, '/'), [filePath]);
```

### Use useCallback for handlers

```tsx
const handleZoomIn = useCallback(() => setZoom(z => Math.min(z + 10, 300)), []);
```

### Use named exports (not default)

```tsx
// Good — Vite Fast Refresh works
export { MyPlugin };

// Bad — breaks Vite Fast Refresh
export default MyPlugin;
```

### Memoize slot components

```tsx
// Slot components re-render on every parent render
// Memoize to avoid unnecessary re-renders
const MyButton = React.memo(({ activeTab }: { activeTab?: any }) => {
  // ...
});
```

---

## Common Pitfalls

### 1. Importing from core

```tsx
// WRONG — cross-package imports don't work in Vite
import { pluginManager } from '../../pluginLoader';

// RIGHT — receive through Slot context
const MyButton: React.FC<{
  toggleContentOverride?: (tab: ...) => void;
}> = ({ toggleContentOverride }) => { /* ... */ };
```

### 2. Using `export default`

```tsx
// WRONG — breaks Vite Fast Refresh
export default MyPlugin;

// RIGHT
export { MyPlugin };
```

### 3. JSX files named `.ts`

```tsx
// WRONG — JSX won't compile
// packages/plugin-xxx/src/index.ts

// RIGHT
// packages/plugin-xxx/src/index.tsx
```

### 4. Icon state not syncing after save

If your toggle button reads internal state instead of the actual override state, it won't update after save clears the override.

```tsx
// WRONG — editMode stays true after save clears override
var currentEditMode = isEditMode();
return <button style={{ backgroundColor: currentEditMode ? 'blue' : 'transparent' }} />;

// RIGHT — derive from actual override state
var isActive = isContentOverrideActive ? isContentOverrideActive() : false;
return <button style={{ backgroundColor: isActive ? 'blue' : 'transparent' }} />;
```

### 5. `require()` doesn't work in Vite

```tsx
// WRONG
const { something } = require('some-package');

// RIGHT
import { something } from 'some-package';
```

### 6. Plugin state not triggering re-render

Module-level variables don't trigger React re-renders. Use a listener pattern:

```tsx
let myState = false;
let listeners: (() => void)[] = [];

export function setMyState(value: boolean) {
  myState = value;
  listeners.forEach(fn => fn());  // Notify all listeners
}

// In component:
const [, forceUpdate] = useState(0);
useEffect(() => {
  const handler = () => forceUpdate(n => n + 1);
  listeners.push(handler);
  return () => { listeners = listeners.filter(fn => fn !== handler); };
}, []);
```

---

## File Structure

```
packages/
├── core/                          # The main app
│   ├── electron/                  # Main process (main.js, preload.js)
│   ├── src/
│   │   ├── App.tsx                # Root component, content override logic
│   │   ├── pluginLoader.ts        # Creates PluginManager, loads plugins
│   │   ├── store/appStore.ts      # enabledPlugins state (Zustand)
│   │   └── components/
│   │       ├── Slot.tsx           # Generic Slot component
│   │       ├── Layout/Header.tsx  # Has <Slot name="header-right" />
│   │       └── Settings/          # Plugins tab in Settings
│   ├── vite.config.ts             # Plugin aliases
│   └── tsconfig.json              # Plugin paths
│
├── plugin-api/                    # Shared types and PluginManager
│   └── src/
│       ├── types.ts               # Plugin, PluginAPI, all config interfaces
│       ├── PluginManager.ts       # Registry + toggleContentOverride
│       └── index.ts               # Exports
│
├── plugin-pdf/                    # Built-in: PDF viewer
│   └── src/index.tsx              # registerFileType (extensions: ['pdf'])
│
├── plugin-images/                 # Built-in: Image viewer
│   └── src/index.tsx              # registerFileType (extensions: ['png', 'jpg', ...])
│
└── plugin-editor/                 # Built-in: Text editor
    ├── src/
    │   ├── index.tsx              # registerSlot + registerContentOverride + registerShortcut
    │   └── Editor.tsx             # Editor component with save/cancel
    └── package.json
```

---

## Enabling/Disabling Plugins

Users toggle plugins in Settings → Plugins. Changes are:

1. **Persisted** in localStorage (`mdview-enabled-plugins`)
2. **Applied on reload** — `loadPlugins()` reads the list and only registers enabled plugins

First run: all built-in plugins are enabled by default.

---

## Electron Security Notes

- `local-file://` protocol is registered in main process — serves local files safely
- `<webview>` tag requires `webviewTag: true` in BrowserWindow webPreferences
- `webSecurity` is not disabled — plugins use the registered protocol instead
- `readFileBinary` and `writeFile` IPCs run in main process (secure boundary)
