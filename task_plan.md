# Task Plan: Markdown Viewer (Electron + React)

## Goal
Build a lightweight, beautiful Markdown file viewer with Electron + React, using Zettlr as reference for themes and patterns.

## Requirements Summary
- **View-only mode** (no editing)
- **Electron + React + TypeScript** stack
- **Theme system** with multiple built-in themes (reference Zettlr's themes)
- **Zoom in/out** functionality
- **File explorer** sidebar
- **Tabs** (with setting: new tab or new window)
- **Open local file links** with default programs
- **Export options** (PDF, HTML)
- **Syntax highlighting** for code blocks
- **Math/LaTeX** support
- **Diagram support** (Mermaid)

## Zettlr Reference Points
- **Theme system**: `source/app/service-providers/appearance/` - Theme detection and switching
- **Markdown rendering**: `source/common/modules/markdown-utils/` - Markdown processing
- **File explorer**: `source/app/service-providers/fsal/` - File system abstraction
- **Tab management**: `source/win-main/` - Window and tab handling

## Phases
- [x] Phase 1: Research and planning
- [x] Phase 2: Electron setup with React
- [x] Phase 3: Core markdown rendering
- [x] Phase 4: Theme system (reference Zettlr)
- [x] Phase 5: File explorer
- [x] Phase 6: Tab management
- [x] Phase 7: Local file link handling
- [x] Phase 8: Export options
- [ ] Phase 9: Advanced features (math, diagrams, syntax highlighting) - DONE
- [ ] Phase 10: Polish and testing

## Technology Stack
- **Framework**: Electron + React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: CSS Variables (no Tailwind - lighter)
- **Markdown**: unified/remark/rehype ecosystem
- **Syntax Highlighting**: highlight.js
- **Math**: KaTeX
- **Diagrams**: Mermaid
- **State Management**: Zustand
- **File System**: Node.js fs module (via Electron IPC)

## Key Files Created
```
markdown-viewer/
├── electron/
│   ├── main.js              # Electron main process
│   └── preload.js           # Preload script for IPC
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Sidebar.tsx          # File explorer
│   │   │   ├── Header.tsx           # Toolbar with zoom, theme, export
│   │   │   └── Tabs.tsx             # Tab bar
│   │   ├── Markdown/
│   │   │   └── MarkdownRenderer.tsx # Core renderer
│   │   └── Themes/
│   │       └── themeDefinitions.ts  # Theme definitions
│   ├── store/
│   │   └── appStore.ts              # Global state (Zustand)
│   ├── styles/
│   │   └── globals.css              # Global styles with CSS variables
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tsconfig.json
├── vite.config.ts
└── postcss.config.js
```

## Current Status
- Frontend is built and running on Vite dev server (http://localhost:3000)
- Electron installation needs to be completed (large download)
- All React components are ready

## To Run
```bash
# Install dependencies (if not done)
npm install

# Start Vite dev server (frontend only)
npx vite --port 3000

# Or start full Electron app (requires Electron installed)
npm run dev
```

## Next Steps
1. Complete Electron installation
2. Test the full app with Electron
3. Add keyboard shortcuts
4. Add file watching (auto-reload on file changes)
5. Package the app for distribution

## Decisions Made
- **Electron + React**: Full native capabilities, your preferred stack
- **Zettlr as reference**: Learned from their theme system and patterns
- **View-only mode**: Simplifies architecture
- **Lightweight**: Removed all editor functionality
- **CSS Variables**: No Tailwind dependency for lighter bundle

## Errors Encountered
- Electron installation timeout (large binary download)
- PostCSS config referencing missing tailwindcss (fixed)
- Missing html2canvas/jspdf packages (installed)

## Status
**Currently in Phase 9** - All features implemented, ready for testing
