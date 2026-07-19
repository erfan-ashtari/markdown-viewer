<div align="center">

# Markdown Viewer

A fast, beautiful Markdown viewer for Windows, Linux, and macOS.

[![npm version](https://img.shields.io/npm/v/mdview-app.svg?color=blue)](https://www.npmjs.com/package/mdview-app)
[![GitHub release](https://img.shields.io/github/v/release/erfan-ashtari/markdown-viewer?color=green)](https://github.com/erfan-ashtari/markdown-viewer/releases/latest)
[![license](https://img.shields.io/badge/license-MIT-lightgrey.svg)](LICENSE)

[Download for Windows](https://github.com/erfan-ashtari/markdown-viewer/releases/latest) | [npm package](https://www.npmjs.com/package/mdview-app) | [Report a bug](https://github.com/erfan-ashtari/markdown-viewer/issues)

</div>

---

## What is it?

Markdown Viewer is a lightweight desktop app for reading `.md` files. It renders Markdown with themes, fonts, math, diagrams, and syntax highlighting — all without an internet connection.

## Install

**npm** (requires [Node.js](https://nodejs.org/)):

```bash
npm install -g mdview-app --foreground-scripts
mdview README.md
```

> The `--foreground-scripts` flag shows the download progress during installation. Without it, npm hides the progress bar by default.

**Standalone** — download from [GitHub Releases](https://github.com/erfan-ashtari/markdown-viewer/releases/latest):

| Platform | File | Description |
|---|---|---|
| Windows | `Markdown.Viewer-setup.exe` | NSIS installer with Start Menu shortcut and file associations |
| Windows | `Markdown.Viewer-portable.exe` | Portable — run directly, no installation needed |
| Linux | `Markdown.Viewer.AppImage` | AppImage — run directly, no installation needed |
| Linux | `Markdown.Viewer.deb` | Debian/Ubuntu package |
| macOS | `Markdown.Viewer.dmg` | macOS disk image |

### How npm install works

The npm package is lightweight (~8 KB). It contains only the CLI wrapper. During `npm install`, the app binary (~84 MB) is automatically downloaded from [GitHub Releases](https://github.com/erfan-ashtari/markdown-viewer/releases/latest). You only download it once — subsequent installs reuse the cached binary.

## Features

- **11 Themes** — GitHub Dark, Dracula, Nord, Monokai, Solarized, One Dark, Material, Light, Paper, Newsprint
- **13 Fonts** — 10 English + 3 Persian (Vazirmatn, IRANSans, Shabnam)
- **Tab Management** — Multi-tab, drag-and-drop, detach to new window
- **File Explorer** — Sidebar with tree view, search, sort by name/date/type
- **Find & Replace** — Ctrl+F with persistent search across tabs
- **Math & Diagrams** — KaTeX LaTeX rendering and Mermaid diagrams
- **Code Highlighting** — Syntax highlighting for 100+ languages
- **Export** — PDF and HTML export with configurable margins
- **Text Viewer** — Syntax-highlighted viewer for 100+ file types
- **File Association** — Double-click `.md` files to open directly
- **CLI** — `mdview` command for quick file opening from terminal

## Keyboard Shortcuts

| Shortcut | Action | Shortcut | Action |
|---|---|---|---|
| `Ctrl+Tab` | Next tab | `Ctrl+=` | Zoom in |
| `Ctrl+Shift+Tab` | Previous tab | `Ctrl+-` | Zoom out |
| `Ctrl+1-9` | Switch tab | `Ctrl+0` | Reset zoom |
| `Ctrl+W` | Close tab | `Ctrl+Shift+W` | Toggle width |
| `Ctrl+F` | Find in document | `Ctrl+Shift+B` | Toggle sidebar |
| `Left/Right` | Prev/next file | `Ctrl+Shift+F` | Toggle fullscreen |

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
| `npm run build:win` | Build Windows: setup.exe + portable.exe |
| `npm run build:win:portable` | Build Windows portable .exe only |
| `npm run build:win:nsis` | Build Windows NSIS installer only |
| `npm run build:linux` | Build Linux: AppImage + deb |
| `npm run build:linux:appimage` | Build Linux AppImage only |
| `npm run build:linux:deb` | Build Linux deb only |
| `npm run build:mac` | Build macOS dmg |

### Tech Stack

Electron 33 / React 18 / TypeScript 5 / Vite 6 / Zustand 5 / react-markdown / KaTeX / Mermaid / electron-builder

### Publishing

```bash
# Build for all platforms (run each on the target OS)
npm run build:win          # Windows: setup.exe + portable.exe
npm run build:linux        # Linux: AppImage + deb
npm run build:mac          # macOS: dmg

# Upload binaries to GitHub Release
gh release upload v1.2.0 \
  "release/Markdown.Viewer-1.2.0-setup.exe" \
  "release/Markdown.Viewer-1.2.0-portable.exe" \
  "release/Markdown.Viewer-1.2.0-linux-x64.AppImage" \
  "release/Markdown.Viewer-1.2.0-linux-x64.deb" \
  "release/Markdown.Viewer-1.2.0-mac-x64.dmg"

# Publish to npm
npm publish
```

## Contributing

Contributions are welcome! Open an issue or submit a pull request.

## License

[MIT](LICENSE)

---

<div align="center">

[Download Latest Release](https://github.com/erfan-ashtari/markdown-viewer/releases/latest) · [View on npm](https://www.npmjs.com/package/mdview-app)

</div>
