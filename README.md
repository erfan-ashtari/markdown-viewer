# Markdown Viewer

A lightweight Markdown file viewer with themes, fonts, zoom, and local file support.

## Features

- **Multiple Themes** — 11 built-in themes (GitHub Dark, Monokai, Nord, Dracula, Solarized, etc.)
- **Font Combinations** — 10 English + 3 Persian font combos with math support
- **Zoom** — Ctrl+/Ctrl- or mouse wheel zoom (50%-300%)
- **Content Width** — Full width, Medium (1100px), or A4 (800px) modes
- **Fullscreen** — F11 with auto-hide toolbar
- **Link Handling** — Clickable links, anchor navigation, citation support
- **Tab Management** — Multiple tabs with Ctrl+Tab navigation
- **File Navigation** — Left/Right arrows to navigate between .md files
- **Settings Window** — Dedicated settings with themes, fonts, shortcuts
- **Export** — Export to PDF or HTML

## Installation

### Windows Installer (Setup.exe)

Download the latest `.exe` installer from [Releases](https://github.com/yourusername/markdown-viewer/releases) and run it.

### Portable Version

Download the portable `.exe` — no installation required.

### npm (CLI)

```bash
npm install -g mdview
mdview README.md
```

### PowerShell

```powershell
.\install.ps1
```

## Usage

### Desktop App

```bash
npm run dev          # Run in development mode
npm run build:win    # Build Windows installer
npm run build:portable  # Build portable .exe
```

### CLI

```bash
mdview README.md     # Open a file
mdview --help        # Show help
mdview --version     # Show version
```

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| Ctrl+Tab | Next tab |
| Ctrl+Shift+Tab | Previous tab |
| Ctrl+1-9 | Switch to tab by position |
| Ctrl+W | Close current tab |
| Ctrl+= | Zoom in |
| Ctrl+- | Zoom out |
| Ctrl+0 | Reset zoom |
| Ctrl+Shift+W | Toggle width mode |
| Ctrl+Shift+F | Toggle fullscreen |
| Ctrl+Shift+B | Toggle sidebar |
| Left/Right | Navigate between files |
| F11 | Fullscreen |

## Development

```bash
git clone https://github.com/yourusername/markdown-viewer.git
cd markdown-viewer
npm install
npm run dev
```

## License

MIT
