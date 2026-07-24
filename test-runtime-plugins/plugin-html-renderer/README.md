# plugin-html-renderer

A runtime plugin for [markdown-viewer](https://github.com/erfan-ashtari/markdown-viewer) that renders HTML files in an iframe and provides a sidebar toggle to switch between rendered preview and source code view.

## What it does

When installed, the plugin:

1. **Renders `.html` and `.htm` files** in a live iframe preview (instead of showing raw source)
2. **Adds a sidebar panel** with a toggle to switch between rendered view and source code
3. **Updates the status indicator** in the sidebar to reflect the current view mode

## Installation

Copy the `plugin-html-renderer` folder into your markdown-viewer plugins directory:

```
{userData}/plugins/plugin-html-renderer/
```

On Windows, `{userData}` is typically:
```
C:\Users\<username>\AppData\Roaming\markdown-viewer\
```

The plugin is automatically discovered and activated on startup (`activationEvents: ["onStartup"]`).

## Usage

- Open any `.html` or `.htm` file in markdown-viewer
- Use the **HTML Renderer** sidebar panel to toggle between rendered preview and source code
- The toggle updates a status badge showing "Rendered" (green) or "Source" (blue)

## Plugin API

This plugin demonstrates the markdown-viewer plugin API:

| API | Purpose |
|-----|---------|
| `context.registerContentOverride({ extensions, label })` | Tells the app to route `.html`/`.htm` files through this plugin's renderer |
| `context.registerSidebarPanel({ id, title, icon, children })` | Adds a custom panel to the sidebar with status indicators, toggles, separators, and labels |
| `context.onEvent('ui-event', handler)` | Listens for UI interactions (toggle clicks, button presses, etc.) |
| `context.onEvent('fileOpened', handler)` | Listens for file open events |
| `context.setRenderMode(extension, isRendered)` | Sets whether a file type should display rendered or source view |
| `context.updateElementState({ id: { ... } })` | Dynamically updates sidebar element properties |
| `context.currentFile` | The currently opened file object |

### Sidebar element types

| Type | Properties |
|------|-----------|
| `status` | `id`, `label`, `value`, `color` |
| `toggle` | `id`, `label`, `checked` |
| `separator` | `id` |
| `label` | `id`, `text`, `variant` |

## Files

```
plugin-html-renderer/
├── index.js        # Plugin implementation
├── package.json    # Plugin manifest
└── README.md       # This file
```

## License

MIT
