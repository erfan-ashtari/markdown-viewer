# Project Structure Analysis

## Current Structure

```
typora-clone/                          (root)
├── package.json                       (npm CLI distribution)
├── package-lock.json
├── .gitignore
├── .npmignore
├── .npmrc                             (does not exist)
├── LICENSE
├── README.md
├── COMMANDS.md
├── RUNTIME-PLUGIN-GUIDE.md
├── VERSION_STATE_REPORT.md
├── PRE_PUBLISH_REPORT.md
├── bin/                               (CLI scripts for npm package)
│   ├── mdview.js
│   ├── mdview.bat
│   └── download.js
├── build/                             (electron-builder icons, gitignored for .ico/.png)
│   ├── mdview.ico
│   ├── installer.ico
│   └── uninstaller.ico
├── icons/                             (duplicate icons, tracked in git)
│   ├── mdview.ico, mdview.png
│   ├── installer.ico, installer.png
│   └── uninstaller.ico, uninstaller.png
├── release/                           (old build output, 434 MB, gitignored)
├── scripts/
│   └── bundle-plugin.js
├── test-plugins/                      (example runtime plugins)
│   ├── plugin-all-features-test/
│   ├── plugin-html-renderer/
│   ├── plugin-icon-test/
│   ├── plugin-iframe-test/
│   └── plugin-ui-tester/
├── packages/
│   ├── plugins.json                   (generated, not source)
│   ├── PLUGIN_DEV_GUIDE.md
│   ├── core/                          (the actual Electron app)
│   │   ├── package.json               (real dependencies + build config)
│   │   ├── index.html
│   │   ├── settings.html
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   ├── tsconfig.node.json
│   │   ├── electron/                  (main process)
│   │   │   ├── main.js
│   │   │   ├── preload.js
│   │   │   ├── runtimePluginManager.js
│   │   │   └── plugins.json           (generated)
│   │   ├── scripts/
│   │   │   └── generate-plugin-config.js
│   │   ├── src/                       (renderer process)
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   ├── settings.tsx
│   │   │   ├── pluginLoader.ts
│   │   │   ├── store/appStore.ts
│   │   │   ├── styles/globals.css
│   │   │   ├── components/...
│   │   │   ├── export/...
│   │   │   └── generated-plugin-aliases.ts
│   │   ├── node_modules/              (JUNCTIONS to root, 36 MB)
│   │   │   ├── electron/ -> root/node_modules/electron
│   │   │   ├── electron-builder/ -> root/node_modules/electron-builder
│   │   │   └── .vite/
│   │   └── release/                   (current build output)
│   ├── plugin-api/                    (shared TypeScript types)
│   │   ├── package.json
│   │   └── src/
│   ├── plugin-pdf/
│   │   ├── package.json
│   │   └── src/index.tsx
│   ├── plugin-images/
│   │   ├── package.json
│   │   └── src/index.tsx
│   └── plugin-editor/
│       ├── package.json
│       └── src/
│           ├── index.tsx
│           └── Editor.tsx
└── node_modules/                      (root, 994 MB, hoisted workspace deps)
```

## Two package.json Files

### Root package.json
```json
{
  "name": "markdown-viewer",
  "version": "1.1.1",
  "private": true,
  "workspaces": ["packages/*"],
  "bin": { "mdview": "bin/mdview.js" },
  "files": ["bin/mdview.js", "bin/mdview.bat", "bin/download.js"],
  "scripts": {
    "postinstall": "node bin/download.js",
    "dev": "npm run dev --workspace=packages/core",
    "build": "npm run build --workspace=packages/core",
    "build:win": "npm run build:win --workspace=packages/core",
    ...
  },
  "devDependencies": {
    "electron": "^33.4.11",
    "electron-builder": "^25.1.8"
  }
}
```

**Purpose:** npm package distribution. When someone runs `npm install -g mdview-app`, this is what gets installed. It contains only the CLI wrapper (`bin/mdview.js`) and the `postinstall` script that downloads the pre-built binary.

### packages/core/package.json
```json
{
  "name": "@mdview/core",
  "version": "1.1.1",
  "private": true,
  "main": "electron/main.js",
  "scripts": {
    "dev": "concurrently \"vite\" \"wait-on tcp:3000 && electron .\"",
    "build": "vite build",
    "build:win": "vite build && electron-builder --win",
    ...
  },
  "dependencies": {
    "@mdview/plugin-api": "file:../plugin-api",
    "highlight.js", "katex", "lucide-react", "mermaid",
    "react", "react-dom", "react-markdown",
    "rehype-highlight", "rehype-katex", "rehype-raw", "rehype-stringify",
    "remark-gfm", "remark-math", "remark-rehype", "zustand"
  },
  "devDependencies": {
    "@types/react", "@types/react-dom", "@vitejs/plugin-react",
    "concurrently", "electron", "electron-builder",
    "typescript", "vite", "wait-on"
  },
  "build": {
    "appId": "com.markdown-viewer.app",
    "productName": "Markdown Viewer",
    "electronDist": "node_modules/electron/dist",
    "asar": true,
    "compression": "maximum",
    "files": ["dist/**/*", "electron/**/*", "!node_modules/katex/..."],
    "win": { "icon": "../../build/mdview.ico", ... },
    "nsis": { "installerIcon": "../../build/installer.ico", ... },
    ...
  }
}
```

**Purpose:** The actual Electron application. Contains all source code, dependencies, and build configuration.

## The Problems

### 1. workspace:* was pnpm/yarn syntax (now fixed)
All 4 plugin packages used `"@mdview/plugin-api": "workspace:*"` which npm doesn't support. Fixed to `"file:../plugin-api"`.

### 2. Junctions required for build
`packages/core/node_modules/` contains junctions (symlinks) to root `node_modules/electron` and `node_modules/electron-builder`. These exist because:
- electron-builder runs from `packages/core/` and looks for `electron` in `node_modules/electron/`
- npm workspaces don't hoist `electron` to `packages/core/node_modules/` properly
- Without junctions, electron-builder fails: "Cannot compute electron version from installed node modules"

### 3. Confusing double package.json
Root `package.json` has only `electron` and `electron-builder` as devDependencies. `packages/core/package.json` has 18 dependencies + 7 devDependencies. All root scripts just delegate to `packages/core` via `--workspace=packages/core`.

### 4. Duplicate icons
`icons/` directory (319 KB, tracked in git) contains `.ico` and `.png` files. `build/` directory (91 KB, gitignored) contains the same `.ico` files. electron-builder references `build/`, not `icons/`. The `icons/` directory appears to be unused.

### 5. Old build output
`release/` at root contains 434 MB of old v1.1.0 builds. Current builds output to `packages/core/release/`.

### 6. Two release directories
- `release/` (root) — old, 434 MB, gitignored
- `packages/core/release/` — current builds

### 7. packages/plugins.json is generated
`packages/plugins.json` is generated by `packages/core/scripts/generate-plugin-config.js`. It's tracked in git but shouldn't be — it's a build artifact.

## Options

### Option A: Keep current structure, add postinstall junctions
- Add a `postinstall` script in root `package.json` that creates the junctions
- Keep two `package.json` files
- Minimal change
- Still confusing for newcomers

### Option B: Flatten to single package.json at root
- Move `packages/core/*` to root (src/, electron/, vite.config.ts, etc.)
- Merge dependencies from both package.json files
- Remove `workspaces` config
- One `node_modules/` at root, no junctions needed
- All paths simplify (no more `../../build/`)
- Bigger refactor but cleaner long-term

### Option C: Switch to pnpm
- pnpm supports `workspace:*` natively
- Better monorepo support
- Requires all contributors to install pnpm
- Most "correct" solution for monorepos

## Dependency Conflict

Both root and `packages/core` declare `electron` and `electron-builder` as devDependencies. Root has them to make electron-builder find them. Core has them because it's the actual build target. This duplication is confusing.

## Recommendation

For this project's size (1 app + 3 plugins + 1 shared types package), the monorepo overhead isn't justified. A single package.json at root with `packages/` as plain directories (not workspaces) would be simplest. But that requires moving files and updating all relative paths.
