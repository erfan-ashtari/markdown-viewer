# Plugin System — Audit Report

**Date:** 2026-07-19
**Scope:** Full review of plugin architecture, self-containment, guide accuracy
**Verdict:** Request Changes — 2 critical issues, 2 important issues, 2 minor issues

---

## Executive Summary

The plugin system's core architecture is sound — `registerFileType`, `registerSlot`, `registerContentOverride`, and `registerToolbarItem` all work correctly and plugins are genuinely self-contained through these APIs. However, two critical gaps undermine the "self-contained" promise: the `registerShortcut` API is dead code (never invoked by core), and the plugin list in `main.js` is hardcoded (every new plugin requires editing core). Additionally, file dialogs are markdown-only, limiting what plugins can actually open.

---

## Issue 1: `registerShortcut` is dead API [CRITICAL]

### What the guide claims

```
api.registerShortcut('Ctrl+S', handler)
→ Core matches keys → calls handler
```

### What actually happens

1. `PluginManager.registerShortcut()` stores the handler in a `Map<string, () => void>`
2. `PluginManager.getShortcut()` exists but is **never called** by any core code
3. The keyboard handler in `App.tsx:66-171` handles shortcuts directly (Ctrl+Tab, Ctrl+/-, etc.) — it never consults `pluginManager.getShortcut()`
4. The editor plugin's Ctrl+S works only because `Editor.tsx` directly listens for the `editor-save` custom event — it bypasses the shortcut system entirely

### Impact

- If a plugin author follows the guide and calls `api.registerShortcut('Ctrl+Shift+X', handler)`, the shortcut silently does nothing
- The editor plugin works by accident (custom event), not by design (shortcut API)
- The API exists in `PluginManager` and `PluginAPI` types but is functionally useless

### Files involved

- `packages/plugin-api/src/PluginManager.ts:31-33` — `registerShortcut()` stores handler
- `packages/plugin-api/src/PluginManager.ts:69-71` — `getShortcut()` returns handler (never called)
- `packages/plugin-api/src/types.ts:12` — `registerShortcut` in interface
- `packages/core/src/App.tsx:66-171` — Keyboard handler (never calls `getShortcut`)
- `packages/plugin-editor/src/index.tsx:174` — Registers shortcut (does nothing)
- `packages/plugin-editor/src/Editor.tsx:16-22` — Listens for custom event (the real mechanism)

### Fix: Wire up shortcut dispatch in App.tsx

Add a `getShortcut` check at the beginning of the keyboard handler, before the hardcoded shortcuts:

```tsx
// In App.tsx, inside the handleKeyDown useEffect, after the input/textarea guard:

const ctrl = e.ctrlKey || e.metaKey
const keyParts: string[] = []
if (ctrl) keyParts.push('Ctrl')
if (e.shiftKey) keyParts.push('Shift')
if (e.altKey) keyParts.push('Alt')
keyParts.push(e.key.length === 1 ? e.key.toUpperCase() : e.key)
const shortcutKey = keyParts.join('+')

const pluginHandler = pluginManager.getShortcut(shortcutKey)
if (pluginHandler) {
  e.preventDefault()
  pluginHandler()
  return
}
```

### Fix: Remove dead shortcut registration from editor plugin

Since the editor plugin already uses custom events for Ctrl+S, remove the shortcut registration:

```tsx
// In packages/plugin-editor/src/index.tsx, remove from register():
// api.registerShortcut('Ctrl+S', function() {
//   window.dispatchEvent(new CustomEvent('editor-save'));
// });
```

Or, if keeping the API, make it the canonical mechanism and remove the custom event listener from `Editor.tsx`.

---

## Issue 2: `get-plugins` IPC is hardcoded [CRITICAL]

### What the guide claims

"Plugins must NEVER require changes to core code."

### What actually happens

`main.js:332-338` has a hardcoded plugin list:

```js
ipcMain.handle('get-plugins', () => {
  return [
    { name: 'pdf-viewer', version: '1.0.0', description: '...', builtin: true },
    { name: 'image-viewer', version: '1.0.0', description: '...', builtin: true },
    { name: 'editor', version: '1.0.0', description: '...', builtin: true },
  ];
});
```

The guide's "Adding a New Built-in Plugin" section confirms this — step 6 tells you to edit this file.

### Impact

- Every new plugin requires editing `main.js` (core Electron process)
- Plugin metadata (version, description) is duplicated — once in the plugin's `package.json`, once in `main.js`
- If a plugin is added to `pluginLoader.ts` but not `main.js`, it works but doesn't appear in Settings
- If a plugin is added to `main.js` but not `pluginLoader.ts`, it appears in Settings but doesn't work

### Files involved

- `packages/core/electron/main.js:332-338` — Hardcoded list
- `packages/core/src/pluginLoader.ts:31-38` — `getAvailablePlugins()` already exists and returns the correct data

### Fix: Make IPC call pluginLoader

`pluginLoader.ts` already has `getAvailablePlugins()` which returns the correct data. The problem is that `main.js` (main process) can't import from `pluginLoader.ts` (renderer process).

**Option A: Move plugin metadata to a shared JSON file**

Create `packages/core/src/plugins.json`:
```json
[
  { "name": "pdf-viewer", "version": "1.0.0", "description": "PDF viewer using Chromium native renderer" },
  { "name": "image-viewer", "version": "1.0.0", "description": "Image viewer with zoom and fit controls" },
  { "name": "editor", "version": "1.0.0", "description": "Text editor with save functionality" }
]
```

Both `main.js` and `pluginLoader.ts` read from this file. One source of truth.

**Option B: Have main.js read from plugin package.json files**

```js
ipcMain.handle('get-plugins', () => {
  const pluginDirs = fs.readdirSync(path.join(__dirname, '../plugin-*'), { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  return pluginDirs.map(dir => {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', dir, 'package.json'), 'utf-8'));
      return { name: pkg.name.replace('@mdview/', ''), version: pkg.version, description: pkg.description || '', builtin: true };
    } catch { return null; }
  }).filter(Boolean);
});
```

**Option C: Let renderer own the plugin list entirely**

Remove the IPC handler. Have `pluginLoader.ts` call `getAvailablePlugins()` directly (it already does). The Settings window reads from the renderer, not the main process.

**Recommended:** Option C — simplest, no duplication, pluginLoader is already the source of truth.

---

## Issue 3: File dialogs are markdown-only [IMPORTANT]

### What happens

- `open-file` dialog (line 175): Filter shows only `.md/.markdown` by default
- `list-md-files` IPC (line 242): Sidebar only lists `.md/.markdown` files
- `getFileFromArgs` (line 27): Command-line only recognizes `.md/.markdown`

### Impact

- Editor plugin supports 90+ file types but users can only open them via drag-and-drop or "All Files" filter
- Sidebar shows only markdown files — users can't browse to `.txt`, `.json`, `.py`, etc.
- Double-clicking a `.txt` file in the OS doesn't open it in the app

### Fix: Let plugins register file dialog filters

Add a new API method:

```ts
// In PluginAPI interface
registerFileFilter(config: FileFilterConfig): void;

// New type
interface FileFilterConfig {
  name: string;           // Display name, e.g. "Text Files"
  extensions: string[];   // Extensions, e.g. ['txt', 'md', 'json', 'py']
}
```

Then `main.js`'s `open-file` handler combines all registered filters:

```js
ipcMain.handle('get-file-filters', () => {
  return fileFilters;  // Collected from plugins
});

ipcMain.handle('open-file', async (event, filters) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: filters || [{ name: 'All Files', extensions: ['*'] }],
  });
  // ...
});
```

For the sidebar, add a `list-files` IPC that accepts a glob pattern:

```js
ipcMain.handle('list-files', async (event, dirPath, patterns) => {
  const items = fs.readdirSync(dirPath);
  return items
    .filter(item => patterns.some(p => new RegExp(p, 'i').test(item)))
    .sort()
    .map(item => ({ name: item, path: path.join(dirPath, item) }));
});
```

---

## Issue 4: Plugin-specific comments in core [MINOR]

### Locations

- `main.js:220`: `// Read binary file as base64 — general utility for plugins`
- `main.js:231`: `// Write file content — used by editor plugin`
- `main.js:409`: `// Register custom protocol for loading local files (used by plugins)`

### Fix

Replace with generic descriptions:

```js
// main.js:220
// Read binary file as base64

// main.js:231
// Write file content

// main.js:409
// Register custom protocol for loading local files
```

---

## Issue 5: Guide cancel flow description is inaccurate [MINOR]

### What the guide says (line 399-403)

```
### Flow: User clicks Cancel
1. Editor calls setEditMode(false)
   └→ editMode = false
   └→ editModeListeners notified → EditToggleButton re-renders (pencil icon)
   └→ But override is still active! canOverride returns false on next toggle.
   └→ User must click toggle again to clear the override.
```

### What actually happens

1. Editor calls `setEditMode(false)` — this only changes the plugin's internal `editMode` variable
2. The content override is **NOT cleared** — `pluginManager.toggleContentOverride()` is never called
3. The user sees the pencil icon but the editor is still visible (override is active)
4. Clicking the pencil again calls `toggleContentOverride()` → `canOverride()` returns false (editMode is false) → override clears → back to preview

This is confusing UX — the button shows "edit mode off" but the editor is still visible. The guide presents this as expected behavior, but it's a design flaw.

### Fix

Either:
- **A:** Cancel should call `toggleContentOverride()` to clear the override immediately
- **B:** The `EditToggleButton` should check both `editMode` AND `isContentOverrideActive()` and dispatch the appropriate action

---

## Issue 6: Guide "self-contained" claim is overstated [MINOR]

### What the guide says

"Plugins must NEVER require changes to core code."

### Reality

Adding a new built-in plugin requires:
1. Creating the plugin package (plugin-owned)
2. Adding Vite alias in `vite.config.ts` (core change)
3. Adding TypeScript path in `tsconfig.json` (core change)
4. Importing in `pluginLoader.ts` (core change)
5. Adding to `get-plugins` IPC in `main.js` (core change)

Steps 2-5 are core changes. Steps 2-4 are build configuration (acceptable — you're telling core about the new package). Step 5 is the problematic one (duplicated metadata).

### Recommendation

Rewrite the guide to be honest:
- "Plugins are self-contained at runtime — they never import from core or modify core behavior."
- "Adding a built-in plugin requires build configuration changes (Vite alias, TS path, import in pluginLoader). These are wiring changes, not logic changes."
- "The `get-plugins` IPC should be made dynamic to eliminate the metadata duplication."

---

## Fix Priority Matrix

| # | Issue | Severity | Effort | Fix |
|---|---|---|---|---|
| 1 | `registerShortcut` dead API | Critical | Low | Wire up in App.tsx keyboard handler |
| 2 | `get-plugins` hardcoded | Critical | Medium | Option C: let renderer own the list |
| 3 | Markdown-only file dialogs | Important | Medium | Add `registerFileFilter` API |
| 4 | Plugin-specific comments | Minor | Trivial | Replace with generic text |
| 5 | Cancel flow UX | Minor | Low | Clear override on cancel |
| 6 | Guide accuracy | Minor | Low | Rewrite "self-contained" section |

---

## What's Working Well

The core plugin architecture is genuinely well-designed:

1. **`registerFileType`** — Clean separation. Core calls `getFileType()` generically, renders whatever renderer the plugin provides. No plugin-specific code in core.

2. **`registerSlot`** — Excellent extensibility. The `<Slot>` component renders any registered component with context props. Core doesn't know what plugins inject.

3. **`registerContentOverride`** — Powerful and generic. Core checks `getActiveContentOverride()` and renders the active override's component. The `onSave` callback is a clean contract.

4. **`registerToolbarItem`** — Works correctly. Header renders the array generically.

5. **Slot context API** — The right pattern. Core passes `toggleContentOverride`, `isContentOverrideActive`, etc. through context. Plugins consume without importing core.

6. **Plugin components** — All three plugins (PDF, Image, Editor) are genuinely self-contained at runtime. They import only from `@mdview/plugin-api` and React. No cross-package imports.

7. **`local-file://` protocol** — Generic infrastructure that any plugin can use.

8. **`writeFile` / `readFileBinary` IPC** — Generic file I/O available to all plugins.

---

## Appendix: File-by-file audit

### Core files

| File | Plugin-specific code? | Notes |
|---|---|---|
| `App.tsx` | No | Generic override/file-type rendering logic |
| `App.tsx:66-171` | No | Keyboard handler — but should call `getShortcut()` |
| `Header.tsx` | No | Slot context is generic API functions |
| `Slot.tsx` | No | Generic slot renderer |
| `pluginLoader.ts` | Imports plugins | Acceptable — this IS the registration point |
| `main.js:332-338` | **Yes** | Hardcoded plugin list |
| `main.js:220,231,409` | Comments only | Should be generic |
| `main.js:175` | Markdown-only filter | Should be extensible |
| `main.js:242` | Markdown-only listing | Should be extensible |

### Plugin files

| File | Imports from core? | Self-contained? |
|---|---|---|
| `plugin-pdf/src/index.tsx` | No | Yes |
| `plugin-images/src/index.tsx` | No | Yes |
| `plugin-editor/src/index.tsx` | No | Yes |
| `plugin-editor/src/Editor.tsx` | No | Yes |
| `plugin-api/src/types.ts` | No | Yes (shared types) |
| `plugin-api/src/PluginManager.ts` | No | Yes (registry) |
