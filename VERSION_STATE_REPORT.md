# Markdown Viewer — Complete Version State Report

> Generated: 2026-07-19 | Repository: `typora-clone` (mdview-app)
> Tags: v0.0.1, v0.0.2, v1.0.0, v1.0.1, v1.0.2, v1.1.0

---

## Project Overview

A lightweight, native desktop Markdown viewer for Windows, built as an Electron + React + TypeScript application. Inspired by Typora, it provides themes, fonts, math rendering, Mermaid diagrams, tab management, file association, and CLI support.

### Workflow

```
Electron (main process)
  -> Creates BrowserWindow, loads Vite-built frontend
  -> IPC bridge (preload.js) exposes filesystem + shell APIs
  -> React app (renderer process)
       -> Zustand store manages state (tabs, theme, font, zoom, sidebar)
       -> react-markdown + remark/rehype plugins parse + render .md
       -> 11 CSS themes via data-theme attribute + CSS custom properties
       -> 13 font combos loaded dynamically via Google Fonts / CDN
  -> electron-builder packages for Windows (NSIS installer + portable .exe)
```

### Tech Stack (v1.1.0 — current)

| Layer | Technology |
|---|---|
| Runtime | Electron 33.4.11 |
| Frontend | React 18.2.0 + TypeScript 5.7.3 |
| Build | Vite 6.0.7 + @vitejs/plugin-react |
| State | Zustand 5.0.5 |
| Markdown | react-markdown 9.0.1 + remark-gfm + remark-math + rehype-katex + rehype-highlight + rehype-raw |
| Diagrams | Mermaid 11.4.1 |
| Math | KaTeX 0.16.22 |
| Syntax | highlight.js 11.11.1 |
| Export | unified + remark/rehype pipeline + Electron IPC printToPDF |
| Icons | lucide-react 0.468.0 |
| Packaging | electron-builder 25.1.8 (NSIS + portable) |
| CLI | Node.js child_process spawn wrapper |

---

## 1. Electron Main Process (`electron/main.js`)

> Responsible for window management, IPC handlers, filesystem operations, file association, context menus, single-instance lock, and protocol registration.

### Workflow

```
app.whenReady()
  -> getFileFromArgs(process.argv) check for .md file launch
  -> createWindow() — main app window OR createFileWindow(filePath) — file association
  -> setupWindow() — fullscreen events + context menu
  -> IPC: open-file, open-folder, build-file-tree, read-file, list-md-files,
     open-settings, open-external, open-file-with-system, open-file-new-window,
     settings-changed (broadcast), renderer-ready, select-all
  -> app.setAsDefaultProtocolClient('mdview') — register mdview:// protocol
  -> Single instance lock — second-instance opens file in new window
```

### Version History

#### v0.0.1 (2026-07-18 00:18 +0330)

- Single `BrowserWindow`, dev server at localhost:3000
- IPC: `open-file`, `open-folder`, `read-file`, `open-external`, `open-file-with-system`
- Context menu: Copy, Cut, Paste, Select All
- Fullscreen IPC events
- `buildFileTree()` recursive directory walker (skips `.` and `node_modules`)
- `preload.js` exposed `electronAPI` via `contextBridge`

#### v0.0.2 (2026-07-18 02:06 +0330)

- Added `open-settings` IPC — creates separate BrowserWindow for settings
- Added `settings-changed` IPC — broadcasts settings changes to main window
- Added `build-file-tree` IPC handler (on-demand, not just on folder open)
- Added `list-md-files` IPC — returns sorted `.md`/`.markdown` files in a directory
- Added `open-file-new-window` IPC — opens file in a detached BrowserWindow
- `preload.js` extended with `sendSettingsChanged`, `onSettingsChanged`, `openSettings`, `buildFileTree`, `listMdFiles`, `openFileNewWindow`, `rendererReady`, `getPathForFile` (webUtils)
- Settings window: 800x600, loads `settings.html`, singleton pattern

#### v1.0.0 (2026-07-18 10:44 +0330)

- **File association flow rewrite**: `pendingFilesByWebContentsId` map tracks files per window, `renderer-ready` IPC triggers delivery
- **Single instance lock**: `app.requestSingleInstanceLock()` — second instances focus main window + open file in new window
- **`createFileWindow(filePath)`**: Dedicated window for file association launches (separate from main window)
- **`isWindowUsable(win)`** guard: prevents crash on destroyed windows
- **Crash logging**: `logFile` at `userData/crash.log`, catches `uncaughtException` + `unhandledRejection`
- **`getFileFromArgs(argv)`**: Parses CLI args for `.md` files, handles `--` flags, URI decoding
- **Protocol**: `app.setAsDefaultProtocolClient('mdview')` + `open-url` handler for `mdview://` links
- **`open-file` IPC**: Now uses `dialog.showOpenDialog` with markdown filter
- **`open-folder` IPC**: Returns file tree for directory picker
- **`build-file-tree` IPC**: On-demand tree builder
- **`list-md-files` IPC**: Sorted `.md`/`.markdown` listing
- **`open-settings` IPC**: Settings window singleton
- **`open-file-new-window` IPC**: New BrowserWindow for detached tabs
- **`get-dark-mode` IPC**: Returns `nativeTheme.shouldUseDarkColors`
- **Context menu**: Enhanced with duplicate separator filtering
- **`setupWindow()`**: Extracted shared logic (fullscreen, context menu) for all window types
- **Preload**: Full API surface including `getPathForFile` (webUtils), `onSelectAll`, `onLoadFile`, `onFullscreenChanged`, `rendererReady`

#### v1.0.1 (2026-07-18 18:15 +0330)

- **Performance optimization**: Granular Zustand store selectors across all components, `React.memo` on TreeItem/SearchResultItem/Header/Tabs, `useMemo` for memoized values (remarkPlugins, rehypePlugins, components, encodedContent, lineCount, sortNodes)
- **Export pipeline rewrite**: AST-driven modular export system (`ExportManager`, `HtmlExporter`, `PdfExporter`, `html.ts` template) — replaces old `html2canvas + jsPDF` approach with `unified` markdown-to-HTML pipeline + Electron IPC `exportPdf` with configurable margins
- **Text file viewer**: New `TextRenderer` component with syntax highlighting via `highlight.js` for 100+ file extensions, line numbers, file info bar (language, line count, char count), Ctrl+scroll zoom
- **Highlight theme loader**: `HighlightThemeLoader` component dynamically loads matching `highlight.js` CSS theme from CDN based on current app theme
- **Language map**: `languageMap.ts` — extension-to-language mapping for 100+ file types + `isTextFile()` allowlist
- **Sidebar improvements**: Refresh button (spin animation), resizable via drag handle (180-500px), sort dropdown (name/date/type with toggle-to-reverse), file search toggle
- **Find bar**: Ctrl+F keyboard shortcut opens find bar with CSS Highlight API-based match highlighting (yellow matches, orange active), match count display (4/18), up/down navigation arrows, close button, theme-aware colors
- **Sidebar store**: Added `sidebarWidth` state + `setSidebarWidth` action to Zustand store
- **Build file tree metadata**: `buildFileTree()` in main.js now returns `mtimeMs` for date sorting
- **Static style extraction**: Sidebar extracted inline style objects to module-level constants to avoid recreation on every render
- **App.tsx refactoring**: Granular store selectors (no more single `useAppStore()` destructuring), `useMemo` for activeTab, `useCallback` for event handlers

#### v1.0.2 (2026-07-18 20:45 +0330)

- **Find bar persistence across tabs**: Search query persists when switching tabs; highlights are tab-scoped via `tabId` prop on `HighlightLayer`
- **Find bar stays visible on tab switch**: No longer closes when switching between tabs
- **CSS Highlight API**: Final implementation using `CSS.highlights.set()` with `TreeWalker` offset-to-range mapping — avoids React DOM reconciliation crashes from DOM manipulation
- **Find bar query persistence across open/close**: Closing and reopening Ctrl+F retains the previous search query
- **Enter key query detection**: If user types a new word, Enter triggers a new search instead of navigating old results
- **Active match scrolling**: Active match scrolls into view via `element.scrollIntoView({ block: 'center', behavior: 'smooth' })`
- **Electron build config**: Added `electronDist` path for electron-builder, `executableName` rename support (`MarkdownViewer.exe`), NSIS + portable targets configured

#### v1.1.0 (2026-07-19)

- **npm CLI rework**: CLI (`bin/mdview.js`) now launches pre-built `MarkdownViewer.exe` directly instead of spawning Electron binary — eliminates dependency on `electron` npm package at runtime
- **`--open` argument handling**: `getFileFromArgs()` in main.js now supports `--open <file>` flag from CLI wrapper
- **Package cleanup**: Removed redundant files (tailwind.config.js, postcss.config.mjs, install.ps1, task_plan.md)
- **npm package optimization**: Package ships only `bin/` + `release/win-unpacked/` — no source code, no node_modules, no dependencies
- **Version consistency**: All version references updated to 1.1.0 (package.json, package-lock.json, Settings UI)

---

## 2. Preload / IPC Bridge (`electron/preload.js`)

> Exposes a safe, typed API from the main process to the renderer via `contextBridge.exposeInMainWorld`.

### Workflow

```
contextBridge.exposeInMainWorld('electronAPI', { ... })
  -> ipcRenderer.invoke() for async operations
  -> ipcRenderer.send() for fire-and-forget messages
  -> ipcRenderer.on() for event listeners (settings-changed, fullscreen-changed, etc.)
  -> webUtils.getPathForFile() for drag-and-drop real paths
```

### Version History

#### v0.0.1

- `openFile`, `openFolder`, `readFile`, `openExternal`, `openFileWithSystem`, `getDarkMode`
- `onSelectAll`, `onFullscreenChanged`

#### v0.0.2

- Added: `sendSettingsChanged`, `onSettingsChanged`, `openSettings`, `buildFileTree`, `listMdFiles`, `openFileNewWindow`, `rendererReady`
- Added: `getPathForFile` via `webUtils`

#### v1.0.0

- Added: `onFileAssociationOpen`, `onLoadFile`
- `getPathForFile` wrapped in try/catch for robustness

#### v1.0.1

- Added: `exportPdf` IPC handler (receives HTML + margins, returns PDF buffer via `printToPDF`)
- Added: `selectAll` IPC handler

#### v1.0.2

- No changes to preload

#### v1.1.0

- No changes to preload

---

## 3. React App Entry (`src/App.tsx` + `src/main.tsx`)

> Root component. Manages keyboard shortcuts, file association, drag-and-drop, fullscreen, theme persistence, zoom, and renders the layout shell.

### Workflow

```
ReactDOM.createRoot('#root') -> <App />
  -> <FontLoader /> — dynamic Google Font injection
  -> <Header /> — toolbar (zoom, theme, font, export, settings)
  -> <Sidebar /> — file tree explorer
  -> <Tabs /> — tab bar
  -> <MarkdownRenderer /> — active tab content
  -> useEffect hooks: keyboard, file association, fullscreen, drag-and-drop,
     settings changes, localStorage persistence
```

### Version History

#### v0.0.1

- Core layout: Header + Sidebar + Tabs + MarkdownRenderer
- Keyboard shortcuts: Ctrl+Tab, Ctrl+=/-, Ctrl+0, Ctrl+Shift+W/F/B, Ctrl+1-9, Ctrl+W, ArrowLeft/Right
- File association: `onFileAssociationOpen` — opens sidebar, loads tree, reads file, creates tab
- Fullscreen detection via IPC
- Select All via context menu IPC
- Drag-and-drop: `.md` files via `FileReader` + `webUtils.getPathForFile`
- Theme/font/zoom/width persistence in localStorage
- Export PDF (html2canvas + jsPDF) and Export HTML (innerHTML snapshot)
- `handleNonMarkdownFile` — opens non-md files as tabs with "cannot preview" placeholder

#### v0.0.2

- Added settings change listener (`onSettingsChanged` IPC) — syncs theme, font, width, zoom from settings window
- Added directory listing on tab change (`listMdFiles` IPC)
- Added `dirToLoad` state for file association directory loading

#### v1.0.0

- File association: full rewrite — loads folder tree + reads file in one flow
- `rendererReady` signal sent after mount
- `onLoadFile` listener for new window file loading
- Improved drag-and-drop: `FileReader` for content, `webUtils.getPathForFile` for real paths, directory listing for arrow navigation

#### v1.0.1

- **Performance**: Granular store selectors (each component reads only its slice), `useMemo` for activeTab, `useCallback` for event handlers
- **Export pipeline**: `ExportManager.create()` replaces old `html2canvas + jsPDF` — uses `unified` markdown-to-HTML + Electron IPC `exportPdf` with configurable margins
- **Text file viewer**: `TextRenderer` for non-markdown files with syntax highlighting, line numbers, file info bar
- **Find bar**: `FindBar` + `HighlightLayer` components — CSS Highlight API for match highlighting, Ctrl+F shortcut
- **HighlightThemeLoader**: Dynamically loads matching `highlight.js` CSS theme from CDN based on current app theme

#### v1.0.2

- **Find bar improvements**: Query persists across tab switches, stays visible on tab switch, query persists across open/close, Enter detects new queries
- **Tab-scoped highlights**: `HighlightLayer` receives `tabId` prop, clears/rebuilds highlights on tab switch

#### v1.1.0

- **Version display**: Settings window About section updated to show v1.1.0

---

## 4. Markdown Renderer (`src/components/Markdown/MarkdownRenderer.tsx`)

> Parses markdown to React components using remark/rehype plugin chain. Handles math, code highlighting, Mermaid diagrams, links, headings, and zoom.

### Workflow

```
Markdown content (string)
  -> encodeLocalUrls() — encode spaces in local file links
  -> <ReactMarkdown>
       -> remarkPlugins: [remarkGfm, remarkMath]
       -> rehypePlugins: [rehypeKatex, rehypeHighlight, rehypeRaw]
       -> Custom components:
            code: CodeBlock (detects mermaid language -> <MermaidDiagram>)
            h1-h6: Heading (generates Typora-compatible IDs)
            a: MarkdownLink (anchor scrolling, external links, tooltips, visited state)
  -> Rendered HTML with theme-aware CSS variables
```

### Plugins

| Plugin | Purpose |
|---|---|
| remark-gfm | Tables, task lists, strikethrough, autolinks |
| remark-math | `$...$` and `$$...$$` math delimiters |
| rehype-katex | KaTeX rendering of math expressions |
| rehype-highlight | Syntax highlighting for code blocks |
| rehype-raw | Parse raw HTML embedded in markdown |

### Version History

#### v0.0.1

- `react-markdown` with remark-gfm, remark-math, rehype-katex, rehype-highlight, rehype-raw
- `CodeBlock`: Detects `mermaid` language, renders via `mermaid.render()`
- `Heading`: Typora-compatible ID generation (`&` -> `--`, lowercase, spaces -> hyphens)
- `MarkdownLink`: Anchor scrolling (multi-pattern fallback for citations), external link handling, file path resolution, visited link tracking, hover tooltip
- `encodeLocalUrls()`: Encodes spaces as `%20` in local file links
- Zoom via Ctrl+mouse wheel, content width modes (full/medium/a4)
- `Window.electronAPI` type declaration in global scope

#### v0.0.2

- No changes to MarkdownRenderer

#### v1.0.0

- Minor refinements to link handling and type declarations

#### v1.0.1

- `useMemo` for `remarkPlugins`, `rehypePlugins`, `components`, `encodedContent` — prevents recreation on every render
- Plugin arrays and component objects extracted to stable references

---

## 5. Theming System (`src/components/Themes/` + `src/styles/globals.css`)

> CSS custom properties engine with 11 themes. Theme applied via `data-theme` attribute on `<html>`.

### Workflow

```
Theme selection (Header/Settings)
  -> appStore.setTheme(theme)
  -> document.documentElement.setAttribute('data-theme', theme)
  -> CSS selectors: [data-theme="github-dark"] { --bg-primary: #0d1117; ... }
  -> All components consume var(--bg-primary), var(--text-primary), etc.
  -> Theme persisted to localStorage, restored on mount
```

### Themes

| ID | Name | Type | Colors |
|---|---|---|---|
| `light` | Light | Light | White/gray |
| `dark` | Dark | Dark | #1e1e1e |
| `github-dark` | GitHub Dark | Dark | #0d1117 |
| `monokai` | Monokai | Dark | #272822 |
| `nord` | Nord | Dark | #2e3440 |
| `dracula` | Dracula | Dark | #282a36 |
| `solarized` | Solarized | Dark | #002b36 |
| `one-dark` | One Dark | Dark | #282c34 |
| `material` | Material | Dark | #263238 |
| `paper` | Paper | Light | #f5f5f5 |
| `newsprint` | Newsprint | Light | #f7f3e9 |

### CSS Variables (per theme)

30+ custom properties: `--bg-primary`, `--bg-secondary`, `--bg-tertiary`, `--text-primary`, `--text-secondary`, `--text-muted`, `--border-color`, `--accent-color`, `--accent-hover`, `--sidebar-bg`, `--header-bg`, `--tab-bg`, `--tab-active-bg`, `--code-bg`, `--selection-bg`, `--scrollbar-thumb`, `--scrollbar-thumb-hover`, `--md-heading`, `--md-strong`, `--md-em`, `--md-blockquote-border`, `--md-blockquote-text`, `--md-list-marker`, `--md-hr`, `--md-table-stripe`, `--md-table-border`.

### Version History

#### v0.0.1

- 5 themes: Light, Dark, GitHub Dark, Monokai, Nord
- CSS variables in `globals.css`
- Theme selection via Header dropdown
- `data-theme` attribute on `<html>`

#### v0.0.2

- Expanded to 11 themes: added Dracula, Solarized, One Dark, Material, Paper, Newsprint
- Theme colors in Header dropdown (dark badge)
- Theme settings in SettingsWindow

#### v1.0.0

- Theme persistence via localStorage
- System preference detection (`prefers-color-scheme: dark`)
- Theme sync across windows via IPC `settings-changed`

#### v1.0.1

- `HighlightThemeLoader` component: dynamically loads matching `highlight.js` CSS theme from CDN based on current app theme
- Theme-to-highlight mapping: light→github, dark→atom-one-dark, github-dark→github-dark, monokai→monokai, nord→nord, dracula→monokai-sublime, solarized→paraiso-dark, one-dark→atom-one-dark, material→androidstudio, paper→github, newsprint→github

---

## 6. Font System (`src/components/Themes/fontDefinitions.ts` + `FontLoader.tsx`)

> Dynamic font loading with 13 combinations (10 English + 3 Persian). Fonts loaded via Google Fonts or CDN.

### Workflow

```
Font selection (Header/Settings)
  -> appStore.setCurrentFont(fontId)
  -> document.documentElement.setAttribute('data-font', fontId)
  -> <FontLoader> component:
       -> getFontCombo(id) from fontDefinitions
       -> Inject @import url() or <link> for external fonts
       -> Set CSS properties: --font-body, --font-heading, --font-code, --font-math
  -> Markdown body uses: var(--font-body, -apple-system, ...)
  -> Code blocks use: var(--font-code, monospace)
  -> Headings use: var(--font-heading, inherit)
```

### Font Combinations

#### English

| ID | Name | Body | Heading | Code |
|---|---|---|---|---|
| `default` | System Default | System stack | System stack | SFMono/Consolas |
| `modern-sans` | Modern Sans | Inter | Inter | JetBrains Mono |
| `classic-serif` | Classic Serif | Libre Baskerville | Playfair Display | Fira Code |
| `writing` | Writing | Lora | Merriweather | Source Code Pro |
| `technical` | Technical | IBM Plex Sans | IBM Plex Sans | IBM Plex Mono |
| `elegant` | Elegant | Source Serif 4 | Montserrat | Fira Code |
| `newspaper` | Newspaper | Charter/Georgia | Roboto Slab | Roboto Mono |
| `minimalist` | Minimalist | Manrope | Space Grotesk | JetBrains Mono |
| `academic` | Academic | Crimson Pro | EB Garamond | IBM Plex Mono |
| `mono-focused` | Mono Focused | Fira Sans | Space Grotesk | JetBrains Mono |

#### Persian (Farsi)

| ID | Name | Body | Heading | Code |
|---|---|---|---|---|
| `persian-vazir` | Vazirmatn | Vazirmatn | Vazirmatn | Fira Code |
| `persian-iran` | IRANSans | IRANSans | IRANSans | Fira Code |
| `persian-shabnam` | Shabnam + Vazir | Shabnam | Vazirmatn | Fira Code |

### Version History

#### v0.0.1

- 10 English + 3 Persian font combinations
- `FontLoader` component: dynamic `@import` / `<link>` injection
- CSS custom properties: `--font-body`, `--font-heading`, `--font-code`, `--font-math`
- Persian support: Vazirmatn, IRANSans, Shabnam

#### v0.0.2

- Font selector in Header dropdown (categorized: English / Persian)
- Font selector in Settings window (grid view)
- Font persistence via localStorage

#### v1.0.0

- Font sync across windows via IPC

---

## 7. State Management (`src/store/appStore.ts`)

> Zustand store managing all application state.

### State Shape

```typescript
{
  // File state
  tabs: Tab[]              // { id, filePath, fileName, content, type }
  activeTabId: string | null
  dirFiles: DirFile[]      // { name, path } — current directory .md files

  // UI state
  sidebarOpen: boolean
  zoomLevel: number        // 50-300, default 100
  contentWidth: 'full' | 'medium' | 'a4'
  currentTheme: Theme      // 11 themes
  currentFont: string      // 13 font combos
  isFullscreen: boolean
}
```

### Actions

| Action | Description |
|---|---|
| `addTab` | Opens file or activates existing tab (dedup by filePath) |
| `removeTab` | Removes tab, activates adjacent |
| `closeTab` | Closes tab, activates next/prev |
| `closeOtherTabs` | Keeps only specified tab |
| `closeAllTabs` | Clears all tabs |
| `setActiveTab` | Switches active tab |
| `toggleSidebar` | Toggles sidebar visibility |
| `setZoomLevel` | Clamps zoom 50-300 |
| `toggleContentWidth` | Cycles full -> medium -> a4 -> full |
| `setTheme` | Sets theme + updates `data-theme` attribute |
| `setCurrentFont` | Sets font + updates `data-font` attribute |
| `setIsFullscreen` | Updates fullscreen state |
| `setDirFiles` | Updates directory file listing |
| `navigateToAdjacentFile` | Reads next/prev .md file in directory, updates active tab content |

### Version History

#### v0.0.1

- Core store: tabs, activeTabId, sidebarOpen, zoomLevel, contentWidth, currentTheme, currentFont
- Actions: addTab, removeTab, closeTab, closeOtherTabs, closeAllTabs, setActiveTab, toggleSidebar, setZoomLevel, toggleContentWidth, setTheme, setCurrentFont

#### v0.0.2

- Added: `isFullscreen`, `dirFiles`, `setIsFullscreen`, `setDirFiles`, `navigateToAdjacentFile`

#### v1.0.0

- `navigateToAdjacentFile`: Reads file via IPC, updates existing tab content in-place

#### v1.0.1

- Added `sidebarWidth` state (default 250) + `setSidebarWidth` action
- `addTab`: Now detects non-markdown files via `isTextFile()` and sets tab type to `'text'`

---

## 8. Layout Components

### 8.1 Sidebar (`src/components/Layout/Sidebar.tsx`)

> File tree explorer with expand/collapse, file type icons, open file/folder buttons.

#### Workflow

```
Sidebar (isOpen)
  -> Header: "File" button -> openFile IPC -> dialog -> read file -> addTab
  -> Header: "Folder" button -> openFolder IPC -> dialog -> buildFileTree -> set state
  -> TreeItem (recursive):
       -> Click directory -> toggle expand
       -> Click .md file -> readFile IPC -> addTab
       -> Click other file -> addTab (type: 'other')
  -> File icons: FileText (md), FileCode (js/ts/py), FileJson, FileImage, FileArchive, FileCog
```

#### Version History

##### v0.0.1

- Basic tree with expand/collapse
- File type icons (md, code, json, image, archive, config)
- Open File / Open Folder buttons
- Click to read file via IPC

##### v0.0.2

- Added `dirToLoad` prop for file association
- `buildFileTree` IPC for on-demand tree building

##### v1.0.0

- `dirToLoad` useEffect for file association directory loading
- Improved file reading with loading state

##### v1.0.1

- **Refresh button**: Spin animation on click, calls `refreshTree()` to rebuild file tree
- **Resizable sidebar**: Drag handle at right edge (mousedown/mousemove/mouseup), min 180px, max 500px, width persisted in store
- **Sort dropdown**: Sort by Name / Date / Type (file extension), toggle-to-reverse button, `sortNodes()` recursive with `useMemo`
- **File search toggle**: Search icon button shows/hides search input, searches file tree by name
- **Static style extraction**: Module-level style objects (`styles.header`, `styles.refreshBtn`, `styles.sortToggle`, `styles.sortMenu`, etc.) to avoid recreation on every render
- **React.memo**: `TreeItem` and `SearchResultItem` wrapped in `React.memo`
- **mtimeMs metadata**: `buildFileTree()` in main.js now returns `mtimeMs` for date sorting

### 8.2 Header (`src/components/Layout/Header.tsx`)

> Toolbar with sidebar toggle, zoom controls, width toggle, theme/font selectors, export, settings.

#### Workflow

```
Header
  -> Left: Sidebar toggle + active file name
  -> Center: Zoom controls (in/out/reset) + Width toggle (full/medium/a4)
  -> Right: Theme selector (dropdown) + Font selector (dropdown) + Export (PDF/HTML) + Settings
  -> Fullscreen: auto-hide, show on hover at top edge, pin on click
```

#### Version History

##### v0.0.1

- Sidebar toggle, zoom controls, width toggle, theme dropdown, export PDF/HTML
- Fullscreen auto-hide with hover detection

##### v0.0.2

- Added font selector dropdown (categorized: English / Persian)
- Added settings button (opens settings window)
- Theme dropdown shows "Dark" badge

##### v1.0.0

- Fullscreen header hover/pin system refined
- Export submenu (PDF + HTML)

##### v1.0.1

- `useMemo` for `activeTab` (derived from tabs + activeTabId)
- `useCallback` for `handleZoomIn`, `handleZoomOut`, `handleZoomReset`, `handleToggleWidth`
- Export menu now uses `ExportManager.create()` with configurable PDF margins

### 8.3 Tabs (`src/components/Layout/Tabs.tsx`)

> Tab bar with drag-and-drop, context menu, tab detach to new window.

#### Workflow

```
Tabs
  -> Render tab list (draggable)
  -> Click tab -> setActiveTab
  -> Close button -> closeTab
  -> Right-click -> context menu: Close Tab, Close Other Tabs, Close All Tabs
  -> Drag tab outside tab bar -> removeTab + openFileNewWindow (detach)
  -> Hidden in fullscreen mode
```

#### Version History

##### v0.0.1

- Basic tab rendering, click to switch, close button

##### v0.0.2

- Added context menu (Close Tab, Close Other, Close All)
- Added drag-and-drop with tab detach to new window

##### v1.0.0

- Hidden in fullscreen mode

##### v1.0.1

- Granular store selectors (reads only `tabs`, `activeTabId`, `setActiveTab`, `closeTab`)

---

## 9. Settings Window (`src/components/Settings/SettingsWindow.tsx`)

> Dedicated settings window with 5 sections: General, Appearance, Preferences, Shortcuts, About.

### Workflow

```
Settings Window (separate BrowserWindow)
  -> Sidebar navigation: General | Appearance | Preferences | Shortcuts | About
  -> General: Show sidebar on startup toggle
  -> Appearance: Theme grid, Font list, Content width, Zoom slider
  -> Preferences: Auto-hide header, Smooth scrolling, Line numbers
  -> Shortcuts: Keyboard shortcut reference table
  -> About: Version info, Export/Import settings (JSON), Reset all
  -> All changes broadcast via sendSettingsChanged IPC
```

### Version History

#### v0.0.1

- No settings window

#### v0.0.2

- Settings window created (529 lines)
- Sections: General, Appearance, Preferences, Shortcuts, About
- Theme grid selector, Font list selector, Content width buttons, Zoom slider
- Toggle switches for preferences
- Export/Import settings as JSON
- Reset all settings
- Settings changes broadcast via IPC

#### v1.0.0

- No structural changes (settings sync refined via main process)

#### v1.0.1

- PDF margin settings (top, bottom, left, right) with preview
- Export settings section for configuring PDF margins before export

---

## 10. CLI & Distribution (`bin/`, `package.json`)

> CLI wrapper and npm distribution for global install.

### Workflow

```
npm install -g mdview-app
  -> bin/mdview.js exposed as 'mdview' command
  -> mdview README.md:
       -> Resolves release/win-unpacked/MarkdownViewer.exe
       -> Spawns .exe with file path argument
       -> Detaches process
  -> electron-builder (development only):
       -> NSIS installer (configurable directory, desktop/start menu shortcuts)
       -> Portable .exe
       -> File associations: .md, .markdown (role: Editor)
       -> Custom icons: mdview.ico, installer.ico, uninstaller.ico
```

### Version History

#### v0.0.1

- No CLI or distribution config

#### v0.0.2

- No CLI or distribution config

#### v1.0.0

- Added `bin/mdview.js` — Node.js CLI wrapper (55 lines)
- Added `bin/mdview.bat` — Windows batch wrapper
- Added `install.ps1` — PowerShell installer script
- `package.json`:
  - `name`: `mdview-app` (renamed from `markdown-viewer`)
  - `bin`: `./bin/mdview.js`
  - `files`: `dist/**/*`, `electron/**/*`, `bin/**/*`, `*.ps1`
  - Scripts: `build:win`, `build:portable`, `build:nsis`
  - Build config: `appId`, `productName`, `executableName`, Windows targets (NSIS + portable), file associations (.md, .markdown), custom icons, NSIS options
- Added `LICENSE` (MIT), `README.md` (161 lines)
- Added `icons/` directory: installer.ico, installer.png, mdview.ico, mdview.png, uninstaller.ico, uninstaller.png

#### v1.1.0

- **CLI rewrite**: `bin/mdview.js` now launches pre-built `release/win-unpacked/MarkdownViewer.exe` directly — no longer depends on `electron` npm package at runtime
- **CLI rewrite**: `bin/mdview.bat` updated to launch .exe directly via `start ""`
- **Package cleanup**: Removed `install.ps1`, `tailwind.config.js`, `postcss.config.mjs`, `task_plan.md`
- **npm package**: Ships only `bin/` + `release/win-unpacked/` (no source, no node_modules, no dependencies)
- **bin mapping**: `"bin": { "mdview": "./bin/mdview.js" }` — creates `mdview` command correctly

---

## 11. Export System (`src/export/`)

> AST-driven modular export pipeline for HTML and PDF output.

### Workflow

```
Export request (Header menu)
  -> ExportManager.create() — registers HtmlExporter + PdfExporter
  -> ExportManager.export(options)
       -> HtmlExporter: unified() pipeline (remarkParse -> remarkGfm -> remarkMath -> remarkRehype -> rehypeStringify)
            -> buildHtmlDocument() — full HTML with theme CSS variables, KaTeX + highlight.js CDN links, print styles
            -> Blob download as .html file
       -> PdfExporter: same unified() pipeline
            -> buildHtmlDocument() — full HTML
            -> window.electronAPI.exportPdf(html, margins) — Electron IPC -> printToPDF
            -> Blob download as .pdf file
```

### Export Options

```typescript
interface ExportOptions {
  format: ExportFormat.HTML | ExportFormat.PDF
  markdown: string
  title?: string
  theme?: string       // CSS variables injected into exported HTML
  pdfMargins?: { top, bottom, left, right }  // PDF only
}
```

### Version History

#### v1.0.0

- PDF export: `html2canvas` + `jsPDF` (screenshot-based, no text selection)
- HTML export: `innerHTML` snapshot (raw DOM capture)

#### v1.0.1

- **Complete rewrite**: AST-driven modular export system
- `ExportManager` orchestrator with `register()` + `export()` pattern
- `HtmlExporter`: `unified` markdown-to-HTML pipeline with remark/rehype plugins
- `PdfExporter`: same pipeline + Electron IPC `printToPDF` with configurable margins
- `html.ts` template: 364-line self-contained HTML document with theme CSS variables, KaTeX/highlight.js CDN, print styles
- Configurable PDF margins (top/bottom/left/right) via Settings window
- `ExportFormat` enum, `ExportOptions` interface, `Exporter` interface

---

## 12. Find Bar System (`src/components/FindBar/`)

> Ctrl+F find bar with CSS Highlight API-based match highlighting.

### Workflow

```
User presses Ctrl+F
  -> App sets isFindBarOpen = true, findQuery persists
  -> <FindBar> renders: input + match count + prev/next/close buttons
  -> User types query -> onQueryChange -> findQuery updates
  -> User presses Enter:
       -> If query changed since last search: onSearch(query) -> findQuery updates
       -> If query unchanged: navigate to next/prev match
  -> <HighlightLayer> receives (containerRef, query, activeIndex, tabId)
       -> findMatches(container.textContent, query) — regex search on rendered text
       -> offsetToRange(container, start, end) — TreeWalker maps text offsets to DOM Ranges
       -> CSS.highlights.set('find-match', new Highlight(...ranges)) — all matches
       -> CSS.highlights.set('find-active', new Highlight(ranges[activeIndex])) — active match
       -> scrollIntoView({ block: 'center' }) — scroll to active match
```

### CSS Highlight API Styles

```css
::highlight(find-match) {
  background-color: rgba(255, 211, 0, 0.35);  /* yellow */
}
::highlight(find-active) {
  background-color: rgba(255, 140, 0, 0.6);   /* orange */
}
```

### Key Design Decisions

- **CSS Highlight API** (not DOM `<mark>` injection): avoids React reconciliation crashes — `CSS.highlights` is a browser overlay that doesn't modify the DOM tree
- **Tab-scoped highlights**: `HighlightLayer` receives `tabId`, clears/rebuilds on tab switch
- **Query persistence**: `findQuery` lives in App state, survives tab switches and find bar open/close
- **Rendered text search**: searches `container.textContent` (rendered), not raw markdown (which has `**bold**` syntax)

### Version History

#### v1.0.1

- Initial implementation: CSS Highlight API + TreeWalker offset-to-range mapping
- Find bar UI: input, match count (4/18), prev/next buttons, close button
- Sticky position, theme-aware colors
- Multiple rewrites: DOM manipulation -> Selection API -> CSS Highlight API (final)

#### v1.0.2

- Query persists across tab switches
- Find bar stays visible on tab switch
- Query persists across open/close
- Enter key detects new queries (searches instead of navigating)
- Active match scrolls into view

#### v1.1.0

- No changes to find bar

---

## 13. Build Configuration (v1.1.0)

### Vite (`vite.config.ts`)

```typescript
// Multi-page app: main (index.html) + settings (settings.html)
// Path alias: @ -> src/
// Dev server: localhost:3000 (strictPort)
// Output: dist/
```

### TypeScript (`tsconfig.json`)

```json
// Target: ES2020, JSX: react-jsx, strict mode
// noUnusedLocals, noUnusedParameters, noFallthroughCasesInSwitch
// Path: @/* -> src/*
```

### Tailwind (`tailwind.config.js`)

```javascript
// Dark mode: class
// Extended colors: primary (sky blue scale)
// Typography overrides for markdown inheritance
// Content: index.html + src/**/*.{js,ts,jsx,tsx}
```

### PostCSS (`postcss.config.mjs`)

```javascript
// Empty plugins (Tailwind not used in production — pure CSS variables)
```

---

## 12. Complete File Tree (v1.1.0)

```
typora-clone/
├── .gitignore
├── LICENSE                          # MIT
├── README.md                        # Project documentation
├── VERSION_STATE_REPORT.md          # This document
├── package.json                     # npm config + electron-builder
├── package-lock.json
├── index.html                       # Main window entry
├── settings.html                    # Settings window entry
├── vite.config.ts                   # Vite config (multi-page)
├── tsconfig.json                    # TypeScript config
├── tsconfig.node.json               # Vite TypeScript config
├── bin/
│   ├── mdview.js                    # CLI wrapper (Node.js)
│   └── mdview.bat                   # CLI wrapper (Windows)
├── build/
│   ├── mdview.ico                   # App icon
│   ├── installer.ico                # Installer icon
│   └── uninstaller.ico              # Uninstaller icon
├── icons/
│   ├── mdview.ico / .png            # App icons (multiple sizes)
│   ├── installer.ico / .png         # Installer icons
│   └── uninstaller.ico / .png       # Uninstaller icons
├── electron/
│   ├── main.js                      # Electron main process (455 lines)
│   └── preload.js                   # IPC bridge (29 lines)
├── src/
│   ├── main.tsx                     # React entry
│   ├── settings.tsx                 # Settings window entry
│   ├── App.tsx                      # Root component (794 lines)
│   ├── store/
│   │   └── appStore.ts              # Zustand store (189 lines)
│   ├── styles/
│   │   └── globals.css              # CSS themes + markdown styles + find bar styles (680 lines)
│   ├── export/
│   │   ├── ExportManager.ts         # Export orchestrator (26 lines)
│   │   ├── types/
│   │   │   └── ExportOptions.ts     # Export types (23 lines)
│   │   ├── exporters/
│   │   │   ├── HtmlExporter.ts      # HTML export via unified (38 lines)
│   │   │   └── PdfExporter.ts       # PDF export via IPC (44 lines)
│   │   └── templates/
│   │       └── html.ts              # HTML document template (364 lines)
│   └── components/
│       ├── FontLoader.tsx           # Dynamic font injection (41 lines)
│       ├── HighlightThemeLoader.tsx  # Dynamic highlight.js theme loader (39 lines)
│       ├── FindBar/
│       │   ├── FindBar.tsx          # Find bar UI component (108 lines)
│       │   └── HighlightLayer.tsx   # CSS Highlight API renderer (141 lines)
│       ├── Layout/
│       │   ├── Header.tsx           # Toolbar (748 lines)
│       │   ├── Sidebar.tsx          # File tree (957 lines)
│       │   └── Tabs.tsx             # Tab bar (223 lines)
│       ├── Markdown/
│       │   └── MarkdownRenderer.tsx # Markdown parser (304 lines)
│       ├── Settings/
│       │   └── SettingsWindow.tsx   # Settings UI (617 lines)
│       ├── Text/
│       │   ├── TextRenderer.tsx     # Text file viewer (128 lines)
│       │   └── languageMap.ts       # Language detection (205 lines)
│       └── Themes/
│           ├── themeDefinitions.ts  # 11 theme configs (70 lines)
│           └── fontDefinitions.ts   # 13 font combos (151 lines)
├── dist/                            # Build output (gitignored)
├── release/                         # electron-builder output (gitignored)
└── node_modules/                    # Dependencies (gitignored)
```

---

## Summary: Version Comparison

| Feature | v0.0.1 | v0.0.2 | v1.0.0 | v1.0.1 | v1.0.2 | v1.1.0 |
|---|---|---|---|---|---|---|
| **Date** | 2026-07-18 00:18 | 2026-07-18 02:06 | 2026-07-18 10:44 | 2026-07-18 18:15 | 2026-07-18 20:45 | 2026-07-19 |
| **React + Electron** | Yes | Yes | Yes | Yes | Yes | Yes |
| **Markdown Rendering** | react-markdown + 5 plugins | Same | Same | Same | Same | Same |
| **Themes** | 5 | 11 | 11 | 11 | 11 | 11 |
| **Fonts** | 13 (10 EN + 3 FA) | 13 | 13 | 13 | 13 | 13 |
| **Settings Window** | No | Yes (5 sections) | Yes | Yes + PDF margins | Yes | Yes |
| **Keyboard Shortcuts** | Yes | Yes | Yes | Yes + Ctrl+F | Yes | Yes |
| **Tab Management** | Basic | + Context menu + Detach | + Fullscreen hide | Same | Same | Same |
| **File Association** | Basic | Basic | Full (pending map, new window) | Same | Same | Same |
| **Single Instance** | No | No | Yes | Yes | Yes | Yes |
| **Protocol** | No | No | `mdview://` | Same | Same | Same |
| **CLI** | No | No | Yes (`mdview` command) | Same | Same | Yes (launches .exe directly) |
| **npm Install** | No | No | Yes (`npm i -g mdview`) | Same | Same | Yes (`npm i -g mdview-app`) |
| **Windows Installer** | No | No | NSIS + Portable | Same | Same | Same |
| **Crash Logging** | No | No | Yes | Same | Same | Same |
| **Drag-and-Drop** | Basic | Basic | FileReader + webUtils | Same | Same | Same |
| **PDF Export** | html2canvas + jsPDF | Same | Same | AST-driven via IPC | Same | Same |
| **HTML Export** | innerHTML snapshot | Same | Same | AST-driven via unified | Same | Same |
| **Text File Viewer** | No | No | No | Yes (100+ languages) | Same | Same |
| **Find Bar (Ctrl+F)** | No | No | No | Yes (CSS Highlight API) | Yes (persistent across tabs) | Same |
| **Sidebar** | Basic | Basic | Basic | Resize + Sort + Search + Refresh | Same | Same |
| **Mermaid Diagrams** | Yes | Yes | Yes | Yes | Yes | Yes |
| **Math/LaTeX** | Yes | Yes | Yes | Yes | Yes | Yes |
| **Persian Support** | Yes | Yes | Yes | Yes | Yes | Yes |
| **Highlight.js Themes** | No | No | No | Dynamic CDN loader | Same | Same |
| **Performance Optimized** | No | No | No | Yes (memo/selectors) | Yes | Yes |
| **npm Package Size** | N/A | N/A | N/A | N/A | ~6.3 MB | ~188 MB (with .exe) |
| **Total Source Files** | 23 | 26 | 36 | 46 | 46 | 42 |
| **Lines of Code (approx)** | ~3,500 | ~4,500 | ~5,300 | ~7,500 | ~7,500 | ~7,200 |
