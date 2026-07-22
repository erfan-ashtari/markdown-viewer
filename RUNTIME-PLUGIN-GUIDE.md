# Runtime Plugin Developer Guide

A comprehensive guide to building runtime plugins for MDView — the Markdown Viewer.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Plugin Anatomy](#plugin-anatomy)
- [Plugin Context API](#plugin-context-api)
- [Sidebar Panels](#sidebar-panels)
- [Element Types Reference](#element-types-reference)
- [Content Overrides](#content-overrides)
- [File System Access](#file-system-access)
- [Events](#events)
- [Security](#security)
- [Using Dependencies](#using-dependencies)
- [Examples](#examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

Runtime plugins extend MDView's functionality without modifying the core application. Plugins run in the main (Node.js) process and communicate with the renderer via IPC. The plugin system provides:

- **Sidebar Panels** — Declarative UI with 13 element types
- **Commands** — Named functions callable from the UI
- **Exporters** — Content transformers
- **Content Overrides** — Alternative rendering for file types
- **File System** — Sandboxed access to files

### How It Differs from Built-in Plugins

| Aspect | Built-in Plugins | Runtime Plugins |
|--------|------------------|-----------------|
| Location | `packages/plugin-*` | `{userData}/plugins/` |
| Language | TypeScript (React) | JavaScript (Node.js) |
| Process | Renderer | Main |
| UI Components | Full React | Declarative elements |
| Installation | Bundled with app | User-installed |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Main Process (Node.js)                             │
│                                                     │
│  RuntimePluginManager                               │
│  ├── loadedPlugins: Map<name, {mod, dir, mtime}>   │
│  ├── exporters: Map<name, {handler, description}>  │
│  ├── commands: Map<name, {handler, description}>   │
│  ├── sidebarPanels: Map<name, panel>               │
│  ├── panelStates: Map<name, state>                 │
│  ├── contentOverrides: Map<name, {extensions}>     │
│  └── renderModeStates: Map<ext, boolean>           │
│                                                     │
│  IPC Handlers ← → Preload Bridge ← → Renderer     │
└─────────────────────────────────────────────────────┘
```

**Communication flow:**

1. Plugin calls a context method (e.g., `registerSidebarPanel`)
2. `RuntimePluginManager` stores the data and broadcasts via IPC
3. Renderer receives the broadcast and updates the UI
4. User interactions flow back via IPC to the plugin

---

## Getting Started

### Prerequisites

- Node.js 18+
- MDView installed

### Plugin Directory Structure

```
{userData}/plugins/
└── my-plugin/
    ├── package.json    # Plugin manifest
    └── index.js        # Plugin entry point
```

### Step 1: Create `package.json`

```json
{
  "name": "my-plugin",
  "displayName": "My Plugin",
  "version": "1.0.0",
  "description": "A sample runtime plugin",
  "main": "index.js",
  "activationEvents": ["onStartup"]
}
```

### Step 2: Create `index.js`

```js
module.exports = {
  activate(context) {
    console.log('[my-plugin] Activated!');

    // Register a command
    context.registerCommand('hello', () => {
      console.log('[my-plugin] Hello from my plugin!');
    }, 'Say hello');
  },

  deactivate() {
    console.log('[my-plugin] Deactivated');
  }
};
```

### Step 3: Install the Plugin

Copy your plugin folder to `{userData}/plugins/`. MDView auto-discovers and loads new plugins on startup (or when the plugins directory changes).

### Step 4: Verify

Start MDView. Your plugin should appear in the plugin list and be enabled by default. Check the console for activation messages.

---

## Plugin Anatomy

Every plugin must export two functions:

```js
module.exports = {
  activate(context) {
    // Called when the plugin is enabled/loaded
    // `context` is the PluginContext — your API surface
  },
  deactivate() {
    // Called when the plugin is disabled/unloaded (optional)
    // Clean up intervals, listeners, etc.
  }
};
```

### Plugin Lifecycle

1. **Discovery** — MDView scans `{userData}/plugins/` for directories with `package.json`
2. **Loading** — `require()` loads the entry file with cache busting
3. **Activation** — `activate(context)` is called with the plugin context
4. **Runtime** — Plugin responds to events, updates UI, handles interactions
5. **Deactivation** — `deactivate()` is called on disable/unload
6. **Hot Reload** — If `package.json` mtime changes, plugin is force-reloaded

---

## Plugin Context API

The `context` object passed to `activate()` provides all plugin capabilities.

### `context.currentFile`

**Type:** `{ filePath: string, fileName: string, content: string } | null`

Live reference to the currently open file. Updated dynamically.

```js
const file = context.currentFile;
if (file) {
  console.log(file.fileName);  // "readme.md"
  console.log(file.filePath);  // "/home/user/docs/readme.md"
  console.log(file.content);   // Full file content as string
}
```

### `context.registerCommand(name, handler, description?)`

Registers a named command. Commands are callable from the UI and support async handlers.

```js
context.registerCommand('format-json', async (args) => {
  const file = context.currentFile;
  if (file) {
    const formatted = JSON.stringify(JSON.parse(file.content), null, 2);
    console.log(formatted);
  }
}, 'Format the current file as JSON');
```

**Command execution:**
- Commands are queued sequentially (promise chain)
- During execution, `console.log/warn/error` are captured and broadcast
- Logs appear in the renderer's plugin command log

### `context.registerExporter(name, handler, description?)`

Registers a named exporter that transforms content.

```js
context.registerExporter('uppercase', (content, meta) => {
  return content.toUpperCase();
}, 'Convert content to uppercase');
```

**Parameters:**
- `content` — The file content string
- `meta` — Optional metadata object
- Returns: Transformed content string

### `context.registerSidebarPanel(panel)`

Registers a declarative sidebar panel. See [Sidebar Panels](#sidebar-panels) for details.

```js
context.registerSidebarPanel({
  id: 'my-panel',
  title: 'My Tools',
  icon: 'Wrench',
  children: [
    { type: 'button', id: 'run', label: 'Run Tool', variant: 'primary' },
  ],
});
```

**Limitation:** One panel per plugin. Calling again replaces the previous panel.

### `context.updateElementState(updates)`

Dynamically updates the state of sidebar elements. Keys are element IDs; values are objects with properties matching the element type.

```js
context.updateElementState({
  'my-status': { value: 'Running...', color: 'info' },
  'my-progress': { value: 75 },
  'my-toggle': { checked: true },
  'my-badge': { count: 42, color: 'success' },
});
```

**State merging:** Updates are merged via `Object.assign()`. Partial updates work correctly.

### `context.updatePanel(panel)`

Replaces the entire sidebar panel definition. Resets element state for new elements.

```js
context.updatePanel({
  id: 'my-panel',
  title: 'Completed!',
  icon: 'CheckCircle',
  children: [
    { type: 'status', id: 'done', value: 'All tasks complete!', color: 'success' },
  ],
});
```

### `context.registerContentOverride(declaration)`

Declares that the plugin provides alternative rendering for files with certain extensions. See [Content Overrides](#content-overrides) for details.

```js
context.registerContentOverride({
  extensions: ['json', 'yaml'],
  label: 'JSON Preview',
});
```

### `context.setRenderMode(extension, rendered)`

Toggles between rendered and source view for a file extension.

```js
context.setRenderMode('json', true);   // Show rendered view
context.setRenderMode('json', false);  // Show source code
```

### `context.getRenderMode(extension)`

Returns the current render mode for an extension. Defaults to `true`.

```js
const isRendered = context.getRenderMode('json'); // true
```

### `context.getState(key, defaultValue)`

Retrieves a persisted value from the plugin's state store.

```js
const theme = context.getState('theme', 'light');
const count = context.getState('clickCount', 0);
```

### `context.setState(key, value)`

Saves a value to the plugin's state store. Values persist across app restarts.

```js
context.setState('theme', 'dark');
context.setState('lastRun', Date.now());
context.setState('settings', { fontSize: 14, autoSave: true });
```

**Note:** State is saved with debounced writes (500ms) to avoid excessive disk I/O.

### `context.notify(options)`

Shows a system notification to the user.

```js
context.notify({
  title: 'Export Complete',
  body: 'Your file has been exported successfully.',
  icon: '/path/to/icon.png' // Optional
});
```

### `context.onEvent(event, callback)`

Registers a listener for a named event.

```js
context.onEvent('fileOpened', ({ filePath, fileName, content }) => {
  console.log('File opened:', fileName);
});

context.onEvent('ui-event', ({ elementId, eventType, payload }) => {
  console.log('UI event:', elementId, eventType, payload);
});
```

**Available events:**

| Event | Data | Description |
|-------|------|-------------|
| `fileOpened` | `{ filePath, fileName, content }` | Fired when a file is opened |
| `fileChanged` | `{ filePath, fileName, content }` | Fired when the current file is saved |
| `ui-event` | `{ elementId, eventType, payload }` | Fired on sidebar UI interactions |

### `context.fs` (Restricted File System)

Sandboxed file system access. Only allows access to:
1. `{userData}/plugins/` directory
2. `{userData}/workspace/` directory
3. The currently open file's directory

```js
// Read a file
const content = context.fs.readFile('/path/to/file.txt');

// Write a file
context.fs.writeFile('/path/to/output.txt', 'Hello!');

// Check existence
const exists = context.fs.exists('/path/to/file.txt');

// List directory
const files = context.fs.readDir('/path/to/directory');

// Create directory (recursive)
context.fs.mkdir('/path/to/new/dir');
```

**Security:** Paths are validated using `fs.realpathSync()` to prevent symlink-based escapes.

---

## Sidebar Panels

Sidebar panels provide a declarative UI in the sidebar. Plugins define the structure; the app renders it.

### Panel Structure

```js
{
  id: string,              // Required. Unique panel ID (scoped to plugin)
  title: string,           // Required. Display title
  icon?: string,           // Optional. Lucide icon name
  collapsible?: boolean,   // Default: true
  defaultCollapsed?: boolean, // Default: false
  children: SidebarElement[], // Required. Ordered list of elements
}
```

### Example: Settings Panel

```js
context.registerSidebarPanel({
  id: 'settings',
  title: 'Plugin Settings',
  icon: 'Settings',
  children: [
    { type: 'label', id: 'heading', text: 'Configuration', variant: 'heading' },
    { type: 'separator', id: 'sep1' },
    { type: 'toggle', id: 'dark-mode', label: 'Dark Mode', checked: true },
    { type: 'select', id: 'theme', label: 'Theme', value: 'default', options: [
      { label: 'Default', value: 'default' },
      { label: 'Monokai', value: 'monokai' },
      { label: 'Solarized', value: 'solarized' },
    ]},
    { type: 'status', id: 'status', label: 'Status', value: 'Ready', color: 'success' },
  ],
});
```

### Event Flow

1. User clicks a button in the sidebar
2. Renderer calls `handleUIInteraction(pluginName, elementId, 'click', {})`
3. Main process routes to the plugin's `ui-event` listener
4. Plugin calls `updateElementState()` to update the UI
5. Renderer receives the state update and re-renders

```js
context.onEvent('ui-event', ({ elementId, eventType, payload }) => {
  if (elementId === 'dark-mode') {
    console.log('Dark mode:', payload.checked);
    context.updateElementState({
      'status': { value: payload.checked ? 'Dark' : 'Light', color: 'info' },
    });
  }
});
```

---

## Element Types Reference

### Base Properties

All elements share these properties:

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | **Required.** Unique element ID within the panel |
| `visibleWhen` | `{ elementId, value }` | Optional. Conditional visibility |

### `button`

Triggers an action on click. Shows loading spinner during async handlers.

```js
{ type: 'button', id: 'run', label: 'Run', icon: 'Play', variant: 'primary' }
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | — | **Required.** Button text |
| `icon` | `string` | — | Optional. Lucide icon name |
| `variant` | `string` | `'default'` | `'default'`, `'primary'`, `'danger'`, `'ghost'` |
| `disabled` | `boolean` | `false` | Disable the button |

**Event:** `{ eventType: 'click', payload: {} }`

### `toggle`

Boolean on/off switch with optimistic updates.

```js
{ type: 'toggle', id: 'darkmode', label: 'Dark Mode', checked: true }
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | — | **Required.** Toggle text |
| `checked` | `boolean` | `false` | Initial state |
| `disabled` | `boolean` | `false` | Disable the toggle |

**Event:** `{ eventType: 'change', payload: { checked: boolean } }`

### `select`

Dropdown with fixed options.

```js
{ type: 'select', id: 'lang', label: 'Language', value: 'en', options: [
  { label: 'English', value: 'en' },
  { label: 'Spanish', value: 'es' },
]}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | — | Optional. Label above dropdown |
| `value` | `string` | `''` | Initial selected value |
| `options` | `Array` | — | **Required.** `[{ label, value }]` |
| `disabled` | `boolean` | `false` | Disable the dropdown |

**Event:** `{ eventType: 'change', payload: { value: string } }`

### `text-input`

Single-line text input. Submits on Enter or blur.

```js
{ type: 'text-input', id: 'search', label: 'Search', placeholder: 'Type here...' }
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | — | Optional. Label above input |
| `value` | `string` | `''` | Initial value |
| `placeholder` | `string` | — | Placeholder text |
| `disabled` | `boolean` | `false` | Disable the input |

**Event:** `{ eventType: 'submit', payload: { value: string } }`

### `text-area`

Multi-line text input. Submits on blur.

```js
{ type: 'text-area', id: 'notes', placeholder: 'Write notes...', rows: 5 }
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `string` | `''` | Initial value |
| `placeholder` | `string` | — | Placeholder text |
| `rows` | `number` | `3` | Visible rows |
| `disabled` | `boolean` | `false` | Disable the textarea |

**Event:** `{ eventType: 'submit', payload: { value: string } }`

### `status`

Read-only text display with color coding.

```js
{ type: 'status', id: 'result', label: 'Result', value: 'OK', color: 'success' }
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | — | Optional. Label prefix |
| `value` | `string` | — | **Required.** Display text |
| `color` | `string` | `'default'` | `'default'`, `'success'`, `'warning'`, `'error'`, `'info'` |

**Not interactive.** Updated via `updateElementState()`.

### `progress`

Progress bar with percentage.

```js
{ type: 'progress', id: 'download', label: 'Downloading', value: 65 }
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | — | Optional. Label left of percentage |
| `value` | `number` | — | **Required.** 0-100 |
| `showPercent` | `boolean` | `true` | Show percentage text |

**Not interactive.** Updated via `updateElementState({ 'id': { value: 75 } })`.

### `label`

Static text with variant styling.

```js
{ type: 'label', id: 'title', text: 'Configuration', variant: 'heading' }
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `text` | `string` | — | **Required.** Display text |
| `variant` | `string` | `'text'` | `'text'`, `'heading'`, `'muted'` |

### `separator`

Horizontal rule for visual separation.

```js
{ type: 'separator', id: 'sep1' }
```

### `section`

Collapsible container for grouping elements. Max nesting depth: 5.

```js
{ type: 'section', id: 'advanced', title: 'Advanced', defaultCollapsed: true, children: [
  { type: 'toggle', id: 'debug', label: 'Debug Mode' },
]}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | `string` | — | **Required.** Section header |
| `defaultCollapsed` | `boolean` | `false` | Start collapsed |
| `children` | `Array` | `[]` | Child elements |

### `link`

Clickable hyperlink. Opens externally.

```js
{ type: 'link', id: 'docs', label: 'View Docs', url: 'https://example.com' }
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | — | **Required.** Link text |
| `url` | `string` | — | **Required.** Target URL |
| `external` | `boolean` | `true` | Open in system browser |

### `badge`

Small count or status indicator.

```js
{ type: 'badge', id: 'issues', label: 'Issues', count: 42, color: 'warning' }
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | — | **Required.** Badge text |
| `count` | `number` | — | Optional. Numeric count |
| `color` | `string` | `'default'` | `'default'`, `'primary'`, `'success'`, `'warning'`, `'error'` |

### `html`

Sandboxed iframe for custom HTML content.

```js
const { pathToFileURL } = require('url');
const path = require('path');
const pluginDir = __dirname;

{
  type: 'html',
  id: 'preview',
  src: pathToFileURL(path.join(pluginDir, 'preview.html')).href,
  height: 200
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `src` | `string` | — | **Required.** URL to load (`file://` or `local-file://`) |
| `height` | `number` | `200` | iframe height in pixels |

**Security:** `sandbox="allow-scripts"` only. `src` must be within the plugin's directory.

---

## Content Overrides

Content overrides allow plugins to declare alternative rendering for specific file types.

### Registration

```js
context.registerContentOverride({
  extensions: ['json', 'yaml'],
  label: 'JSON Preview',
});
```

### How It Works

1. Plugin registers override with file extensions
2. Renderer fetches overrides from main process
3. When a matching file is opened, the override activates
4. The built-in `HtmlRenderer` proxy renders the content
5. User can toggle between rendered and source view

### Toggle via Sidebar

Combine with a sidebar panel for user control:

```js
// Register content override
context.registerContentOverride({
  extensions: ['json'],
  label: 'JSON Preview',
});

// Register sidebar panel with toggle
context.registerSidebarPanel({
  id: 'json-viewer',
  title: 'JSON Viewer',
  icon: 'Braces',
  children: [
    { type: 'status', id: 'mode', label: 'Mode', value: 'Rendered', color: 'success' },
    { type: 'toggle', id: 'render-toggle', label: 'Rendered View', checked: true },
  ],
});

// Handle toggle
context.onEvent('ui-event', ({ elementId, payload }) => {
  if (elementId === 'render-toggle') {
    const rendered = payload.checked;
    context.setRenderMode('json', rendered);
    context.updateElementState({
      'mode': { value: rendered ? 'Rendered' : 'Source', color: rendered ? 'success' : 'info' },
    });
  }
});
```

---

## File System Access

The `context.fs` API provides sandboxed file access.

### Allowed Directories

1. `{userData}/plugins/` — Plugin's own directory
2. `{userData}/workspace/` — Shared workspace
3. Current file's directory — Directory of the open file

### Methods

```js
// Read a file (synchronous)
const content = context.fs.readFile('/path/to/file.txt');

// Write a file (synchronous)
context.fs.writeFile('/path/to/output.txt', 'Hello World');

// Check existence
const exists = context.fs.exists('/path/to/file.txt');

// List directory
const files = context.fs.readDir('/path/to/directory');

// Create directory (recursive)
context.fs.mkdir('/path/to/new/dir');
```

### Security

- Paths are resolved via `fs.realpathSync()` to prevent symlink escapes
- Only the three allowed directories are accessible
- Path validation walks up to find existing ancestors

---

## Events

### `fileOpened`

Fired when a file is opened in the editor.

```js
context.onEvent('fileOpened', ({ filePath, fileName, content }) => {
  console.log('File opened:', fileName);
  console.log('Path:', filePath);
  console.log('Content length:', content.length);
});
```

### `ui-event`

Fired on sidebar UI interactions (button clicks, toggles, etc.).

```js
context.onEvent('ui-event', ({ elementId, eventType, payload }) => {
  console.log('Element:', elementId);
  console.log('Event:', eventType);
  console.log('Payload:', payload);
});
```

**Event types by element:**

| Element | Event Type | Payload |
|---------|------------|---------|
| `button` | `click` | `{}` |
| `toggle` | `change` | `{ checked: boolean }` |
| `select` | `change` | `{ value: string }` |
| `text-input` | `submit` | `{ value: string }` |
| `text-area` | `submit` | `{ value: string }` |

---

## Security

### What Plugins CAN Do

- Read/write files in `{userData}/plugins/`, `{userData}/workspace/`, and the current file's directory via `context.fs`
- Execute arbitrary Node.js code (require any module)
- Make network requests
- Register sidebar panels, commands, and exporters
- Show system notifications

### What Plugins CANNOT Do (by design)

- Access files outside the three allowed directories via `context.fs`
- Render arbitrary HTML in the main content area (only via approved content overrides)

### Important Limitations

**Plugins run with FULL Node.js access.** There is no sandbox. A malicious plugin can:

- Execute `child_process.exec('rm -rf /')`
- Read `~/.ssh/id_rsa` and exfiltrate it
- Modify any file on the system
- Inject code into the main process
- Monkey-patch global objects

**The `context.fs` API is a convenience layer, not a security boundary.** It restricts the `fs` wrapper but does NOT restrict `require('child_process')` or other Node.js modules.

### Recommendations

1. **Only install plugins you trust** — Review plugin source code before enabling
2. **Report suspicious plugin behavior** — Help keep the community safe
3. **Use the workspace directory** — Store plugin data in `{userData}/workspace/` rather than sensitive locations

### Native Modules Warning

**Plugins must NOT use native Node.js modules** (e.g., `sharp`, `bcrypt`, `sqlite3`). Native `.node` files cannot be unloaded on plugin hot-reload, causing memory leaks and crashes.

---

## Using Dependencies

Runtime plugins can use npm packages. Two approaches:

### Option 1: Bundle with esbuild (Recommended)

This creates a single self-contained file with all dependencies included.

**Step-by-step process:**

1. Create your plugin with `package.json`:

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "main": "index.bundled.js",
  "dependencies": {
    "lodash": "^4.17.21"
  }
}
```

2. Install dependencies:

```bash
npm install
```

3. Bundle into a single file:

```bash
npx esbuild index.js --bundle --outfile=index.bundled.js --platform=node --target=node18
```

Or use the bundle script (from project root):

```bash
node scripts/bundle-plugin.js .
```

4. Clean up files you don't need to distribute:

```bash
# Windows
rmdir /s /q node_modules
del package-lock.json

# Linux/Mac
rm -rf node_modules package-lock.json
```

5. Your final plugin folder should contain only:

```
my-plugin/
├── package.json        # {"main": "index.bundled.js", ...}
├── index.js            # Source code (optional, for reference)
└── index.bundled.js    # Bundled file (MDView loads this)
```

6. Install the plugin:

```bash
# Copy to plugins directory
cp -r my-plugin "{userData}/plugins/my-plugin"
```

### Option 2: Ship node_modules

Simply include the `node_modules` folder in your plugin directory. This works but increases plugin size significantly.

### Bundle Script

The `scripts/bundle-plugin.js` script automates bundling:

```bash
node scripts/bundle-plugin.js <plugin-directory>
```

**Requirements:**
- esbuild must be installed globally: `npm install -g esbuild`

**What it does:**
1. Reads your `package.json` to find the entry point
2. Runs esbuild to bundle all dependencies
3. Creates `index.bundled.js`

---

## Examples

### Example 1: Word Counter

```js
module.exports = {
  activate(context) {
    // Register sidebar panel
    context.registerSidebarPanel({
      id: 'word-counter',
      title: 'Word Counter',
      icon: 'FileText',
      children: [
        { type: 'status', id: 'words', label: 'Words', value: '0', color: 'info' },
        { type: 'status', id: 'lines', label: 'Lines', value: '0', color: 'info' },
        { type: 'status', id: 'chars', label: 'Characters', value: '0', color: 'info' },
        { type: 'separator', id: 'sep' },
        { type: 'button', id: 'refresh', label: 'Refresh', icon: 'RefreshCw' },
      ],
    });

    // Count words when file opens
    const countWords = () => {
      const file = context.currentFile;
      if (file) {
        const words = file.content.split(/\s+/).filter(Boolean).length;
        const lines = file.content.split('\n').length;
        const chars = file.content.length;
        context.updateElementState({
          'words': { value: String(words) },
          'lines': { value: String(lines) },
          'chars': { value: String(chars) },
        });
      }
    };

    context.onEvent('fileOpened', countWords);
    context.onEvent('ui-event', ({ elementId }) => {
      if (elementId === 'refresh') countWords();
    });
  },
  deactivate() {}
};
```

### Example 2: JSON Formatter

```js
const path = require('path');

module.exports = {
  activate(context) {
    // Register command
    context.registerCommand('format-json', () => {
      const file = context.currentFile;
      if (file && file.fileName.endsWith('.json')) {
        try {
          const parsed = JSON.parse(file.content);
          const formatted = JSON.stringify(parsed, null, 2);
          console.log(formatted);
        } catch (err) {
          console.error('Invalid JSON:', err.message);
        }
      }
    }, 'Format JSON file');

    // Register exporter
    context.registerExporter('json-prettify', (content) => {
      try {
        return JSON.stringify(JSON.parse(content), null, 2);
      } catch {
        return content;
      }
    }, 'Prettify JSON content');
  },
  deactivate() {}
};
```

### Example 3: HTML Renderer with Toggle

```js
module.exports = {
  activate(context) {
    // Register content override for HTML files
    context.registerContentOverride({
      extensions: ['html', 'htm'],
      label: 'HTML Preview',
    });

    // Register sidebar panel with toggle
    context.registerSidebarPanel({
      id: 'html-renderer',
      title: 'HTML Renderer',
      icon: 'Eye',
      children: [
        { type: 'status', id: 'mode', label: 'Mode', value: 'Rendered', color: 'success' },
        { type: 'toggle', id: 'render-toggle', label: 'Rendered View', checked: true },
        { type: 'separator', id: 'sep' },
        { type: 'label', id: 'info', text: 'Toggle to switch between rendered HTML and source', variant: 'muted' },
      ],
    });

    // Handle toggle
    context.onEvent('ui-event', ({ elementId, payload }) => {
      if (elementId === 'render-toggle') {
        const rendered = payload.checked;
        context.setRenderMode('html', rendered);
        context.updateElementState({
          'mode': { value: rendered ? 'Rendered' : 'Source', color: rendered ? 'success' : 'info' },
        });
      }
    });
  },
  deactivate() {}
};
```

---

## Best Practices

### 1. Use Descriptive Plugin Names

Plugin names should be unique and descriptive. They appear in the plugin list and logs.

```js
// Good
"name": "markdown-table-formatter"

// Bad
"name": "plugin1"
```

### 2. Handle Cleanup in `deactivate()`

Clean up intervals, listeners, and state when your plugin is deactivated.

```js
module.exports = {
  _interval: null,

  activate(context) {
    this._interval = setInterval(() => {
      // periodic task
    }, 5000);
  },

  deactivate() {
    if (this._interval) {
      clearInterval(this._interval);
    }
  }
};
```

### 3. Use Sections for Complex Panels

Group related elements in collapsible sections.

```js
children: [
  { type: 'section', id: 'basic', title: 'Basic Settings', children: [...] },
  { type: 'section', id: 'advanced', title: 'Advanced', defaultCollapsed: true, children: [...] },
]
```

### 4. Use `visibleWhen` for Conditional UI

Show elements only when relevant.

```js
{ type: 'toggle', id: 'debug', label: 'Enable Debug' },
{ type: 'text-input', id: 'debug-port', label: 'Debug Port', visibleWhen: { elementId: 'debug', value: true } },
```

### 5. Validate User Input

Always validate data from UI interactions before using it.

```js
context.onEvent('ui-event', ({ elementId, eventType, payload }) => {
  if (elementId === 'port-input') {
    const port = parseInt(payload.value, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      context.updateElementState({ 'status': { value: 'Invalid port', color: 'error' } });
      return;
    }
    // Use valid port
  }
});
```

### 6. Use `pathToFileURL()` for HTML Elements

Always use `pathToFileURL()` to create proper file URLs.

```js
const { pathToFileURL } = require('url');
const path = require('path');
const pluginDir = __dirname;

// Correct
src: pathToFileURL(path.join(pluginDir, 'preview.html')).href

// Incorrect (may fail on Windows)
src: `file:///${path.join(pluginDir, 'preview.html').replace(/\\\\/g, '/')}`
```

### 7. Log Strategically

Use console.log for debugging, but remove excessive logging in production.

```js
console.log('[my-plugin] Activated');
console.log('[my-plugin] Processing:', fileName);
console.error('[my-plugin] Error:', err.message);
```

---

## Troubleshooting

### Plugin doesn't load

- Check `package.json` has valid `name`, `main`, and `activationEvents`
- Verify the entry file exports `activate` function
- Check console for error messages

### Sidebar panel doesn't appear

- Verify `registerSidebarPanel()` is called in `activate()`
- Check that the panel has required fields (`id`, `title`, `children`)
- Ensure element IDs are unique within the panel

### HTML element shows error

- Verify `src` uses `file://` or `local-file://` protocol
- Ensure the file is within the plugin's directory
- Use `pathToFileURL()` to construct the URL correctly

### File system access denied

- Check that the path is within allowed directories
- Paths must be in: `plugins/`, `workspace/`, or current file's directory
- Symlinks are resolved and validated against real paths

### Toggle doesn't update UI

- Call `updateElementState()` after state changes
- Ensure element IDs match between panel definition and state updates
- Check that the event handler is registered via `onEvent('ui-event', ...)`

### Content override not activating

- Verify `registerContentOverride()` is called with correct extensions
- Check that the file extension matches (case-insensitive)
- The override auto-activates when a matching file is opened

---

## Reference

### Icon Names

Use Lucide icon names (without the `Icon` suffix):

`Activity`, `AlertCircle`, `ArrowRight`, `Beaker`, `Braces`, `Check`, `CheckCircle`, `ChevronDown`, `ChevronRight`, `Clock`, `Code`, `Copy`, `Database`, `Download`, `Edit`, `Eye`, `File`, `FileText`, `Filter`, `Folder`, `FolderOpen`, `Globe`, `Hash`, `Heart`, `Home`, `Info`, `Key`, `Link`, `List`, `Lock`, `Mail`, `Map`, `MessageSquare`, `Minus`, `Moon`, `MoreHorizontal`, `Package`, `Pause`, `Play`, `Plus`, `Power`, `RefreshCw`, `Save`, `Search`, `Send`, `Server`, `Settings`, `Share`, `Shield`, `Slash`, `Star`, `Sun`, `Terminal`, `Trash2`, `TrendingUp`, `Type`, `Unlock`, `Upload`, `User`, `Users`, `Wrench`, `X`, `Zap`

### Element Color Options

**Status/Badge colors:**
- `default` — Standard color
- `primary` — Accent color
- `success` — Green (#22c55e)
- `warning` — Amber (#f59e0b)
- `error` — Red (#ef4444)
- `info` — Accent color

**Button variants:**
- `default` — Standard button
- `primary` — Accent-colored button
- `danger` — Red button for destructive actions
- `ghost` — Transparent button

**Label variants:**
- `text` — Normal text
- `heading` — Bold heading
- `muted` — Muted/dimmed text

---

*This guide covers MDView Runtime Plugin API v1.0. For questions or contributions, refer to the project repository.*
