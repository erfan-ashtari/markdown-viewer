<div align="center">

# Markdown Viewer

A lightweight, extensible desktop viewer for Markdown, text, and beyond.

[![npm version](https://img.shields.io/npm/v/mdview-app.svg?color=blue)](https://www.npmjs.com/package/mdview-app)
[![GitHub release](https://img.shields.io/github/v/release/erfan-ashtari/markdown-viewer?color=green)](https://github.com/erfan-ashtari/markdown-viewer/releases/latest)
[![license](https://img.shields.io/badge/license-MIT-lightgrey.svg)](LICENSE)

[Download for Windows](https://github.com/erfan-ashtari/markdown-viewer/releases/latest) | [npm package](https://www.npmjs.com/package/mdview-app) | [Report a bug](https://github.com/erfan-ashtari/markdown-viewer/issues)

</div>

---

## What is it?

Markdown Viewer is a fast, lightweight desktop app for reading `.md` and text files. It renders Markdown beautifully with themes, fonts, math, diagrams, and syntax highlighting — all offline, all native.

But it doesn't stop there. Two plugin systems let you extend it into a PDF viewer, image viewer, code editor, or anything you can imagine — without touching the core.

## Install

**npm** (requires [Node.js](https://nodejs.org/)):

```bash
npm install -g mdview-app --foreground-scripts
mdview README.md
```

> The `--foreground-scripts` flag shows the download progress during installation. Without it, npm hides the progress bar by default.

**Standalone** — download from [GitHub Releases](https://github.com/erfan-ashtari/markdown-viewer/releases/latest):

| File | Description |
|---|---|
| `Markdown.Viewer-1.1.0-setup.exe` | NSIS installer with Start Menu shortcut and file associations |
| `Markdown.Viewer-1.1.0-portable.exe` | Portable — run directly, no installation needed |

### How npm install works

The npm package is lightweight (~8 KB). It contains only the CLI wrapper. During `npm install`, the app binary (~84 MB) is automatically downloaded from [GitHub Releases](https://github.com/erfan-ashtari/markdown-viewer/releases/latest). You only download it once — subsequent installs reuse the cached binary.

## Features

### Core

| Feature | Details |
|---|---|
| **Markdown Rendering** | GitHub Flavored Markdown, tables, task lists, strikethrough |
| **11 Themes** | GitHub Dark, Dracula, Nord, Monokai, Solarized, One Dark, Material, Light, Paper, Newsprint |
| **13 Fonts** | 10 English + 3 Persian (Vazirmatn, IRANSans, Shabnam) |
| **Math & Diagrams** | KaTeX LaTeX rendering and Mermaid diagrams |
| **Code Highlighting** | Syntax highlighting for 100+ languages with theme-matched highlight.js |
| **Tab Management** | Multi-tab, drag-and-drop reorder, detach to new window |
| **File Explorer** | Sidebar with tree view, search, sort by name/date/type, resizable |
| **Find in Document** | Ctrl+F with CSS Highlight API, persistent across tabs |
| **Export** | PDF and HTML export with configurable margins |
| **Text Viewer** | Syntax-highlighted viewer for 100+ file types (JS, TS, Python, JSON, etc.) |
| **File Association** | Double-click `.md` files to open directly |
| **CLI** | `mdview` command for quick file opening from terminal |

### Built-in Plugins

MDView ships with three built-in plugins that run in the renderer process:

| Plugin | What it does |
|---|---|
| **PDF Viewer** | Renders `.pdf` files using Chromium's native renderer |
| **Image Viewer** | Displays PNG, JPG, GIF, SVG, WebP, and 10+ other image formats |
| **Text Editor** | Edit text files with a toggle button, Ctrl+S to save |

These are bundled with the app and enabled by default. They demonstrate the built-in plugin API: TypeScript/React components that register file types, inject UI into slots, and replace the content area.

### Runtime Plugins

Runtime plugins take extensibility further. They're user-installable JavaScript plugins that run in the main process and communicate with the UI via IPC. Anyone can write one — no rebuild required.

**What runtime plugins can do:**

- Register **declarative sidebar panels** with 13 UI element types (buttons, toggles, selects, text inputs, status displays, progress bars, badges, links, nested sections, and sandboxed iframes)
- Execute **named commands** callable from the UI
- **Transform content** via exporters (e.g., format JSON, convert YAML)
- **Override file rendering** for any file type (e.g., render HTML in a live iframe)
- Access a **sandboxed file system** (read/write files in allowed directories)
- Show **system notifications**
- **Persist state** across app restarts
- Communicate bidirectionally with **embedded iframes** via postMessage

**Installing a runtime plugin:**

Copy a plugin folder into `{userData}/plugins/`:

```bash
# Windows
%APPDATA%\markdown-viewer\plugins\my-plugin\

# Linux/macOS
~/.config/markdown-viewer/plugins/my-plugin/
```

Plugins are auto-discovered and enabled on startup. Hot-reload detects file changes and reloads automatically.

**Writing a runtime plugin:**

A minimal plugin is just a `package.json` and an `index.js`:

```js
// index.js
module.exports = {
  activate(context) {
    context.registerSidebarPanel({
      id: 'word-counter',
      title: 'Word Counter',
      icon: 'FileText',
      children: [
        { type: 'status', id: 'words', label: 'Words', value: '0', color: 'info' },
        { type: 'status', id: 'lines', label: 'Lines', value: '0', color: 'info' },
        { type: 'button', id: 'refresh', label: 'Refresh', icon: 'RefreshCw' },
      ],
    });

    const count = () => {
      const file = context.currentFile;
      if (file) {
        const words = file.content.split(/\s+/).filter(Boolean).length;
        const lines = file.content.split('\n').length;
        context.updateElementState({
          'words': { value: String(words) },
          'lines': { value: String(lines) },
        });
      }
    };

    context.onEvent('fileOpened', count);
    context.onEvent('ui-event', ({ elementId }) => {
      if (elementId === 'refresh') count();
    });
  },
  deactivate() {},
};
```

For the full API reference, see [RUNTIME-PLUGIN-GUIDE.md](RUNTIME-PLUGIN-GUIDE.md).

## Keyboard Shortcuts

| Shortcut | Action | Shortcut | Action |
|---|---|---|---|
| `Ctrl+Tab` | Next tab | `Ctrl+=` | Zoom in |
| `Ctrl+Shift+Tab` | Previous tab | `Ctrl+-` | Zoom out |
| `Ctrl+1-9` | Switch tab | `Ctrl+0` | Reset zoom |
| `Ctrl+W` | Close tab | `Ctrl+Shift+W` | Toggle width |
| `Ctrl+F` | Find in document | `Ctrl+Shift+B` | Toggle sidebar |
| `Left/Right` | Prev/next file | `Ctrl+Shift+F` | Toggle fullscreen |

## Architecture

```
Electron (main process)
  -> RuntimePluginManager — discovers, loads, hot-reloads user plugins
  -> IPC bridge — preload.js exposes filesystem, shell, and plugin APIs
  -> React app (renderer process)
       -> Zustand store — tabs, theme, font, zoom, sidebar state
       -> react-markdown + remark/rehype — parse and render .md
       -> 11 CSS themes via data-theme + CSS custom properties
       -> 13 font combos via Google Fonts / CDN
       -> Built-in plugins — PDF, Images, Editor (TypeScript/React)
  -> electron-builder — NSIS installer + portable .exe
```

## For Developers

```bash
git clone https://github.com/erfan-ashtari/markdown-viewer.git
cd markdown-viewer
npm install
npm run dev
```

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server + Electron |
| `npm run build` | Build frontend to `dist/` |
| `npm run build:win` | Build frontend + Windows executables |
| `npm run build:portable` | Build portable .exe only |
| `npm run build:nsis` | Build NSIS installer only |

### Plugin Development

| Guide | For |
|---|---|
| [RUNTIME-PLUGIN-GUIDE.md](RUNTIME-PLUGIN-GUIDE.md) | User-installable plugins (JavaScript, main process, declarative UI) |
| [PLUGIN_DEV_GUIDE.md](packages/PLUGIN_DEV_GUIDE.md) | Built-in plugins (TypeScript/React, renderer process) |

### Tech Stack

Electron 33 / React 18 / TypeScript 5 / Vite 6 / Zustand 5 / react-markdown / KaTeX / Mermaid / electron-builder

### Publishing

```bash
# Build the app
npm run build:win

# Upload .exe files to GitHub Release
gh release upload v1.1.0 "release/Markdown.Viewer-1.1.0-setup.exe" "release/Markdown.Viewer-1.1.0-portable.exe"

# Publish to npm
npm publish
```

## Contributing

Contributions are welcome! Open an issue or submit a pull request. See [COMMANDS.md](COMMANDS.md) for the full list of development commands.

## License

[MIT](LICENSE)

---

<div align="center">

[Download Latest Release](https://github.com/erfan-ashtari/markdown-viewer/releases/latest) · [View on npm](https://www.npmjs.com/package/mdview-app)

</div>
