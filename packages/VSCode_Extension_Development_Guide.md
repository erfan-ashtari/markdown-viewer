# VS Code Extension Development: Zero to Hero

A complete guide to building, testing, and publishing Visual Studio Code extensions using the Extension API.

---

## Table of Contents

1. [What Are VS Code Extensions?](#1-what-are-vs-code-extensions)
2. [Prerequisites](#2-prerequisites)
3. [Your First Extension](#3-your-first-extension)
4. [Extension Anatomy](#4-extension-anatomy)
5. [The Three Pillars of the API](#5-the-three-pillars-of-the-api)
6. [Extension Capabilities](#6-extension-capabilities)
7. [Extension Guides & Samples](#7-extension-guides--samples)
8. [Testing Extensions](#8-testing-extensions)
9. [Bundling Extensions](#9-bundling-extensions)
10. [Publishing Extensions](#10-publishing-extensions)
11. [Advanced Topics](#11-advanced-topics)
12. [Complete Workflow Summary](#12-complete-workflow-summary)

---

## 1. What Are VS Code Extensions?

Visual Studio Code is built with extensibility in mind. From the UI to the editing experience, almost every part of VS Code can be customized and enhanced through the Extension API. In fact, many core features of VS Code are built as extensions and use the same Extension API.

### What Extensions Can Do

- **Theming**: Change the look of VS Code with color or file icon themes
- **Custom Views**: Add custom components & views in the UI (sidebars, activity bar, status bar)
- **Webviews**: Display custom webpages built with HTML/CSS/JS inside VS Code
- **Language Support**: Support a new programming language (syntax highlighting, IntelliSense, debugging)
- **Debugging**: Support debugging a specific runtime
- **AI Integration**: Add chat participants, language model tools, and MCP servers

---

## 2. Prerequisites

- [Node.js](https://nodejs.org) (v18+)
- [Git](https://git-scm.com/)
- [Visual Studio Code](https://code.visualstudio.com/)
- [Yeoman](https://yeoman.io/) and [VS Code Extension Generator](https://www.npmjs.com/package/generator-code)

```bash
# Install Yeoman and the VS Code extension generator globally
npm install --global yo generator-code

# Or run without installing globally
npx --package yo --package generator-code -- yo code
```

---

## 3. Your First Extension

### Scaffolding

Run the Yeoman generator:

```bash
yo code
```

Select the following options for a TypeScript project:

```
? What type of extension do you want to create? New Extension (TypeScript)
? What's the name of your extension? HelloWorld
? What's the identifier of your extension? helloworld
? What's the description of your extension?
? Initialize a git repository? Yes
? Which bundler to use? unbundled
? Which package manager to use? npm
? Do you want to open the new folder with Visual Studio Code? Yes
```

### Running the Extension

1. Open the project in VS Code
2. Press `F5` or run **Debug: Start Debugging** from the Command Palette
3. A new **Extension Development Host** window opens
4. In the new window, open the Command Palette and run **Hello World**
5. You see `Hello World from HelloWorld!` notification

### Modifying the Extension

Edit `src/extension.ts` to change the message:

```typescript
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('helloworld.helloWorld', () => {
        vscode.window.showInformationMessage('Hello VS Code!');
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
```

Run **Developer: Reload Window** in the Extension Development Host, then run **Hello World** again.

---

## 4. Extension Anatomy

### File Structure

```
.
├── .vscode
│   ├── launch.json       // Debugging configuration
│   └── tasks.json        // Build task configuration
├── .gitignore
├── README.md
├── src
│   └── extension.ts      // Extension entry point
├── package.json          // Extension manifest (THE most important file)
├── tsconfig.json         // TypeScript configuration
└── node_modules/         // Dependencies
```

### The Extension Manifest (`package.json`)

Every extension must have a `package.json`. Key fields:

```json
{
    "name": "helloworld-sample",
    "displayName": "Hello World Sample",
    "description": "Hello World example for VS Code",
    "version": "0.0.1",
    "publisher": "vscode-samples",
    "engines": {
        "vscode": "^1.51.0"
    },
    "categories": ["Other"],
    "activationEvents": [],
    "main": "./out/extension.js",
    "contributes": {
        "commands": [
            {
                "command": "helloworld.helloWorld",
                "title": "Hello World"
            }
        ]
    },
    "scripts": {
        "vscode:prepublish": "npm run compile",
        "compile": "tsc -p ./",
        "watch": "tsc -watch -p ./"
    },
    "devDependencies": {
        "@types/node": "^8.10.25",
        "@types/vscode": "^1.51.0",
        "typescript": "^3.4.5"
    }
}
```

Key fields explained:

| Field | Purpose |
|-------|---------|
| `name` | Unique extension name |
| `publisher` | Your publisher ID |
| `engines.vscode` | Minimum VS Code version your extension supports |
| `main` | Entry point JavaScript file |
| `activationEvents` | When your extension should activate |
| `contributes` | Static declarations extending VS Code (commands, menus, keybindings, etc.) |

### The Entry File (`src/extension.ts`)

Exports two functions:

```typescript
import * as vscode from 'vscode';

// Called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
    // Register commands, set up UI, etc.
    let disposable = vscode.commands.registerCommand('helloworld.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World!');
    });

    // Push disposables for cleanup
    context.subscriptions.push(disposable);
}

// Called when your extension is deactivated (cleanup)
export function deactivate() {}
```

---

## 5. The Three Pillars of the API

Understanding these three concepts is crucial to writing extensions:

### 5.1 Activation Events

Activation events tell VS Code *when* to load and activate your extension.

```json
"activationEvents": [
    "onLanguage:python",
    "onCommand:helloworld.helloWorld",
    "onUri:github-vscode://vscode.github-authentication",
    "onStartupFinished"
]
```

Common activation events:

| Event | When it fires |
|-------|--------------|
| `onLanguage:{language}` | A file of that language is opened |
| `onCommand:{command}` | Your command is invoked |
| `onUri` | A URI matching your extension is opened |
| `onStartupFinished` | VS Code has finished starting |
| `*` | On VS Code startup (use sparingly) |

> **Note**: Starting with VS Code 1.74.0, commands declared in the `commands` section of `package.json` automatically activate the extension when invoked, without requiring an explicit `onCommand` entry in `activationEvents`.

### 5.2 Contribution Points

Contribution points are static declarations in `package.json` that extend VS Code's UI and behavior.

```json
"contributes": {
    "commands": [
        {
            "command": "myExtension.doSomething",
            "title": "Do Something"
        }
    ],
    "keybindings": [
        {
            "command": "myExtension.doSomething",
            "key": "ctrl+shift+d",
            "mac": "cmd+shift+d"
        }
    ],
    "menus": {
        "editor/context": [
            {
                "command": "myExtension.doSomething",
                "when": "editorHasSelection"
            }
        ]
    },
    "configuration": {
        "title": "My Extension Settings",
        "properties": {
            "myExtension.setting1": {
                "type": "boolean",
                "default": true,
                "description": "Enable setting 1"
            }
        }
    },
    "views": {
        "explorer": [
            {
                "id": "myTreeView",
                "name": "My Tree View"
            }
        ]
    }
}
```

Key contribution points:

- `contributes.commands` - Add commands to the Command Palette
- `contributes.menus` - Add context menu items, editor title bar items, etc.
- `contributes.keybindings` - Define keyboard shortcuts
- `contributes.configuration` - Add settings
- `contributes.views` - Add sidebar views
- `contributes.viewsContainers` - Add activity bar containers
- `contributes.themes` - Add color themes
- `contributes.languages` - Register new languages
- `contributes.debuggers` - Add debug adapters
- `contributes.taskDefinitions` - Define custom task types

### 5.3 VS Code API

The `vscode` module provides the programmatic API to interact with VS Code at runtime:

```typescript
import * as vscode from 'vscode';

// Window API - UI interactions
vscode.window.showInformationMessage('Hello!');
vscode.window.createStatusBarItem();
vscode.window.createWebviewPanel();
vscode.window.createTreeView('myView', { treeDataProvider: myProvider });

// Workspace API - file/folder operations
vscode.workspace.getConfiguration('myExtension');
vscode.workspace.openTextDocument();
vscode.workspace.workspaceFolders;
vscode.workspace.onDidChangeTextDocument();

// Commands API
vscode.commands.registerCommand('myExtension.doSomething', () => {});
await vscode.commands.executeCommand('editor.action.formatDocument');

// Languages API
vscode.languages.registerCompletionItemProvider();
vscode.languages.registerHoverProvider();
vscode.languages.createDiagnosticCollection();

// Debug API
vscode.debug.registerDebugAdapterDescriptorFactory();

// Status Bar
const statusBarItem = vscode.window.createStatusBarItem();
statusBarItem.text = "$(rocket) Ready";
statusBarItem.show();

// Webview
const panel = vscode.window.createWebviewPanel('myPanel', 'My Panel', vscode.ViewColumn.One, {});
panel.webview.html = '<h1>Hello Webview!</h1>';

// Input Box
const input = await vscode.window.showInputBox({ prompt: 'Enter something:' });

// Quick Pick
const items = ['Option 1', 'Option 2', 'Option 3'];
const selected = await vscode.window.showQuickPick(items, { placeHolder: 'Pick an option' });

// Notifications
vscode.window.showWarningMessage('Warning!');
vscode.window.showErrorMessage('Error!');
const choice = await vscode.window.showInformationMessage('Pick one', 'Yes', 'No', 'Cancel');

// Progress
await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: 'Processing...',
    cancellable: true
}, async (progress, token) => {
    progress.report({ increment: 50 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    progress.report({ increment: 50 });
});
```

---

## 6. Extension Capabilities

### Common Capabilities

These are core functionalities available to any extension:

```typescript
// Register a command
let disposable = vscode.commands.registerCommand('myExtension.hello', () => {
    vscode.window.showInformationMessage('Hello!');
});
context.subscriptions.push(disposable);

// Access configuration
const config = vscode.workspace.getConfiguration('myExtension');
const setting = config.get('enableFeature', true);

// Show notifications
vscode.window.showInformationMessage('Info message');
vscode.window.showWarningMessage('Warning message');
vscode.window.showErrorMessage('Error message');

// Quick Pick for user input
const result = await vscode.window.showQuickPick(
    ['Option A', 'Option B', 'Option C'],
    { placeHolder: 'Select an option' }
);

// Input Box for text input
const name = await vscode.window.showInputBox({
    prompt: 'Enter your name',
    placeHolder: 'John Doe'
});

// Progress indicator
await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Window, title: 'Working...' },
    async (progress) => {
        progress.report({ increment: 0 });
        await doWork();
        progress.report({ increment: 50 });
        await doMoreWork();
        progress.report({ increment: 100 });
    }
);
```

### Workbench Extensions

Extend the VS Code UI:

```typescript
// Status Bar Item
const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left, 100
);
statusBarItem.text = "$(sync~spin) Syncing";
statusBarItem.tooltip = "Synchronizing...";
statusBarItem.command = 'myExtension.sync';
statusBarItem.show();

// Tree View in Sidebar
const treeDataProvider = new MyTreeDataProvider();
vscode.window.registerTreeDataProvider('myView', treeDataProvider);

// Webview Panel
const panel = vscode.window.createWebviewPanel(
    'preview',           // View ID
    'Preview',           // Title
    vscode.ViewColumn.One, // Column
    {}                   // Options
);

// Set HTML content
panel.webview.html = getWebviewContent();

// Dispose when closed
panel.onDidDispose(() => {
    // Cleanup
}, null, context.subscriptions);
```

### Restrictions

Extensions cannot:
- Access the DOM of VS Code UI directly
- Add custom stylesheets to VS Code
- Modify VS Code's internal DOM structure

These restrictions ensure VS Code remains stable and performant. Extensions run in a separate **Extension Host** process.

---

## 7. Extension Guides & Samples

### Complete Guide Reference Table

| Guide | API Used | Purpose |
|-------|----------|---------|
| **Command** | `commands`, `contributes.commands` | Register and execute commands |
| **Color Theme** | `contributes.themes` | Create editor color themes |
| **File Icon Theme** | `contributes.iconThemes` | Create file icon themes |
| **Product Icon Theme** | `contributes.productIconThemes` | Create product icons |
| **Tree View** | `window.createTreeView`, `contributes.views` | Build sidebar tree explorers |
| **Webview** | `window.createWebviewPanel` | Build custom web UI panels |
| **Notebook** | Notebook API | Create notebook renderers |
| **Custom Editors** | `window.registerCustomEditorProvider` | Custom file editors |
| **Task Provider** | `tasks.registerTaskProvider` | Add custom tasks |
| **Source Control** | `scm.createSourceControl` | Create SCM providers |
| **Debugger** | `contributes.debuggers` | Build debug adapters |
| **Markdown** | `markdown.markdownItPlugins` | Extend markdown preview |
| **Test** | `TestController`, `TestItem` | Build test explorers |
| **AI/Chat** | Chat Participant, Language Model | Integrate with AI features |
| **MCP** | MCP Dev Guide | Model Context Protocol servers |

### Tree View Example

```typescript
// TreeDataProvider implementation
class MyTreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
    getTreeItem(element: TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: TreeItem): TreeItem[] {
        if (!element) {
            // Root level items
            return [
                new TreeItem('Item 1', vscode.TreeItemCollapsibleState.None),
                new TreeItem('Item 2', vscode.TreeItemCollapsibleState.Expanded),
            ];
        }
        // Children of expanded items
        return [new TreeItem('Child Item', vscode.TreeItemCollapsibleState.None)];
    }
}

class TreeItem extends vscode.TreeItem {
    constructor(label: string, collapsibleState: vscode.TreeItemCollapsibleState) {
        super(label, collapsibleState);
        this.tooltip = `Tooltip for ${label}`;
        this.contextValue = 'item';
        this.command = {
            command: 'myExtension.selectItem',
            title: 'Select',
            arguments: [this]
        };
    }
}
```

### Webview Example

```typescript
function getWebviewContent(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Webview</title>
</head>
<body>
    <h1>Hello from Webview!</h1>
    <button id="btn">Click Me</button>
    <script>
        const btn = document.getElementById('btn');
        btn.addEventListener('click', () => {
            // Send message back to extension
            window.acquireVsCodeApi().postMessage({ type: 'clicked' });
        });

        // Receive messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            console.log('Received:', message);
        });
    </script>
</body>
</html>`;
}

// Create the panel
const panel = vscode.window.createWebviewPanel(
    'myWebview',
    'My Webview',
    vscode.ViewColumn.One,
    { enableScripts: true }  // Enable JavaScript in webview
);

panel.webview.html = getWebviewContent();

// Handle messages from webview
panel.webview.onDidReceiveMessage(
    message => {
        switch (message.type) {
            case 'clicked':
                vscode.window.showInformationMessage('Button clicked!');
                break;
        }
    },
    undefined,
    context.subscriptions
);
```

---

## 8. Testing Extensions

### Quick Setup with Test CLI

```bash
npm install --save-dev @vscode/test-cli @vscode/test-electron
```

Add to `package.json`:

```json
"scripts": {
    "test": "vscode-test"
}
```

Create `.vscode-test.js`:

```javascript
const { defineConfig } = require('@vscode/test-cli');

module.exports = defineConfig({
    files: 'out/test/**/*.test.js'
});
```

### Test File

```typescript
// src/test/suite/extension.test.ts
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Sample test', () => {
        assert.strictEqual(-1, [1, 2, 3].indexOf(5));
        assert.strictEqual(-1, [1, 2, 3].indexOf(0));
    });

    test('Command registration', async () => {
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('helloworld.helloWorld'));
    });
});
```

### Advanced Setup with Custom Runner

```typescript
// src/test/runTest.ts
import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
    try {
        const extensionDevelopmentPath = path.resolve(__dirname, '../../');
        const extensionTestsPath = path.resolve(__dirname, './suite/index');

        await runTests({ extensionDevelopmentPath, extensionTestsPath });
    } catch (err) {
        console.error('Failed to run tests');
        process.exit(1);
    }
}

main();
```

```typescript
// src/test/suite/index.ts
import * as path from 'path';
import * as Mocha from 'mocha';
import { glob } from 'glob';

export function run(): Promise<void> {
    const mocha = new Mocha({ ui: 'tdd', color: true });
    const testsRoot = path.resolve(__dirname, '..');

    return new Promise((c, e) => {
        glob('**/**.test.js', { cwd: testsRoot })
            .then(files => {
                files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));
                mocha.run(failures => {
                    if (failures > 0) {
                        e(new Error(`${failures} tests failed.`));
                    } else {
                        c();
                    }
                });
            })
            .catch(e);
    });
}
```

### Debug Configuration

```json
// .vscode/launch.json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Extension Tests",
            "type": "extensionHost",
            "request": "launch",
            "runtimeExecutable": "${execPath}",
            "args": [
                "--extensionDevelopmentPath=${workspaceFolder}",
                "--extensionTestsPath=${workspaceFolder}/out/test/suite/index"
            ],
            "outFiles": ["${workspaceFolder}/out/test/**/*.js"]
        }
    ]
}
```

### Run Tests

```bash
# Run from command line
npm test

# Or from VS Code: Test: Run All Tests
# Or: Test: Debug All Tests
```

### Tips

- Use VS Code Insiders for testing while developing in VS Code Stable
- Add `--disable-extensions` to avoid loading other extensions during tests
- Test both trusted and untrusted workspace states

---

## 9. Bundling Extensions

### Why Bundle?

1. **Web Support**: Only bundled extensions work in VS Code for Web (vscode.dev, github.dev)
2. **Performance**: One large file loads faster than 100 small files
3. **Package Size**: Excludes `node_modules` and source maps

### Using esbuild (Recommended)

```bash
npm i --save-dev esbuild
```

Create `esbuild.js`:

```javascript
const esbuild = require('esbuild');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

async function main() {
    const ctx = await esbuild.context({
        entryPoints: ['src/extension.ts'],
        bundle: true,
        format: 'cjs',
        minify: production,
        sourcemap: !production,
        sourcesContent: false,
        platform: 'node',
        outfile: 'dist/extension.js',
        external: ['vscode'],
        logLevel: 'warning'
    });

    if (watch) {
        await ctx.watch();
    } else {
        await ctx.rebuild();
        await ctx.dispose();
    }
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
```

Update `package.json`:

```json
"scripts": {
    "compile": "npm run check-types && node esbuild.js",
    "check-types": "tsc --noEmit",
    "watch": "npm-run-all -p watch:*",
    "watch:esbuild": "node esbuild.js --watch",
    "watch:tsc": "tsc --noEmit --watch --project tsconfig.json",
    "vscode:prepublish": "npm run package",
    "package": "npm run check-types && node esbuild.js --production"
}
```

Update `package.json` to point to bundled output:

```json
"main": "./dist/extension.js"
```

### Using webpack

```bash
npm i --save-dev webpack webpack-cli ts-loader
```

Create `webpack.config.js`:

```javascript
const path = require('path');

module.exports = {
    target: 'webworker',
    entry: './src/extension.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'extension.js',
        libraryTarget: 'commonjs2'
    },
    devtool: 'source-map',
    externals: {
        vscode: 'commonjs vscode'
    },
    resolve: {
        mainFields: ['browser', 'module', 'main'],
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [{ loader: 'ts-loader' }]
            }
        ]
    }
};
```

Update `package.json`:

```json
"scripts": {
    "compile": "webpack --mode development",
    "watch": "webpack --mode development --watch",
    "vscode:prepublish": "npm run package",
    "package": "webpack --mode production --devtool hidden-source-map"
}
```

### .vscodeignore

Exclude files not needed at runtime:

```
.vscode
node_modules
src/
tsconfig.json
webpack.config.js
esbuild.js
**/*.ts
```

---

## 10. Publishing Extensions

### Step 1: Install vsce

```bash
npm install -g @vscode/vsce
```

### Step 2: Create a Publisher

1. Go to [Visual Studio Marketplace publisher management](https://marketplace.visualstudio.com/manage)
2. Log in with your Microsoft account
3. Click **Create publisher**
4. Set your publisher ID and name
5. Verify with `vsce login <publisher id>`

### Step 3: Package Your Extension

```bash
vsce package
# Creates my-extension-0.0.1.vsix
```

### Step 4: Publish

```bash
# Publish to Marketplace
vsce publish

# Or publish with version bump
vsce publish minor  # 1.0.0 -> 1.1.0
vsce publish major  # 1.0.0 -> 2.0.0
vsce publish patch  # 1.0.0 -> 1.0.1
```

### Step 5: Install Your Extension

```bash
# From command line
code --install-extension my-extension-0.0.1.vsix

# Or from VS Code:
# Extensions > Views and More Actions > Install from VSIX...
```

### Packaging Without Publishing

```bash
vsce package
# Share the .vsix file directly
```

### Pre-release Versions

```bash
# Publish as pre-release
vsce package --pre-release
vsce publish --pre-release
```

Recommended versioning: `major.EVEN_NUMBER.patch` for releases, `major.ODD_NUMBER.patch` for pre-releases (e.g., `0.2.0` for release, `0.3.0` for pre-release).

### Platform-Specific Extensions

```bash
# Build for specific platform
vsce package --target win32-x64
vsce package --target linux-x64
vsce package --target darwin-arm64
vsce package --target web  # For VS Code for Web
```

Available platforms: `win32-x64`, `win32-arm64`, `linux-x64`, `linux-arm64`, `linux-armhf`, `alpine-x64`, `alpine-arm64`, `darwin-x64`, `darwin-arm64`, `web`

### Unpublishing & Removing

```bash
# Unpublish (keeps stats)
vsce unpublish <publisher>.<extension-name>
```

Or use the [Marketplace management page](https://marketplace.visualstudio.com/manage) for more options.

### Security: Entra ID Publishing (Recommended)

Use Microsoft Entra ID with workload identity federation instead of PATs:

```yaml
- task: AzureCLI@2
  displayName: 'Publish using managed identity'
  inputs:
    azureSubscription: <ServiceConnectionName>
    scriptType: pscore
    scriptLocation: inlineScript
    inlineScript: |
      cd <ExtensionDirectory>
      vsce publish --azure-credential
```

---

## 11. Advanced Topics

### Extension Host

Extensions run in a separate **Extension Host** process, isolated from the VS Code UI. This ensures:
- Extensions can't crash the main VS Code process
- Extensions can't access VS Code's DOM
- Multiple extensions can run concurrently

### Remote Development

Extensions can run in different contexts:
- **Local**: Standard desktop VS Code
- **Remote**: SSH, Containers, WSL
- **Web**: vscode.dev, github.dev

The same extension can work across all contexts if it follows the Extension Host's API contract.

### Workspace Trust

```typescript
// Check trust status
const isTrusted = vscode.workspace.isTrusted;

// Listen for trust changes
vscode.workspace.onDidGrantWorkspaceTrust(() => {
    // Trust was granted - enable restricted features
});

// Declare trust requirements in package.json
"capabilities": {
    "untrustedWorkspaces": {
        "supported": "limited",
        "description": "This extension requires workspace trust to enable all features."
    }
}
```

### Web Extensions

Web extensions run in the browser and have different constraints:
- Must be bundled into a single file
- Cannot use Node.js APIs
- Must declare `browser` entry point

```json
"browser": "./dist/web-extension.js"
```

---

## 12. Complete Workflow Summary

### Development Lifecycle

```
1. SCAFFOLD
   yo code → Generate project structure

2. DEVELOP
   - Write extension.ts (activate/deactivate)
   - Add contribution points in package.json
   - Use VS Code API for runtime behavior
   - F5 to launch Extension Development Host

3. TEST
   npm test → Run integration tests
   @vscode/test-cli for easy setup
   @vscode/test-electron for desktop testing

4. BUNDLE
   esbuild or webpack → Single file output
   dist/extension.js → Production bundle

5. PACKAGE
   vsce package → Create .vsix file

6. PUBLISH
   vsce publish → Upload to Marketplace

7. MAINTAIN
   - Version bumping (vsce publish minor)
   - Pre-release channels
   - Platform-specific builds
   - CI/CD automation
```

### Key Commands Reference

| Command | Purpose |
|---------|---------|
| `yo code` | Scaffold new extension |
| `npm run compile` | Compile TypeScript |
| `npm run watch` | Watch mode for development |
| `npm test` | Run integration tests |
| `vsce package` | Package extension as .vsix |
| `vsce publish` | Publish to Marketplace |
| `vsce login <publisher>` | Authenticate with Marketplace |
| `vsce unpublish <id>` | Remove extension from Marketplace |

### Essential Files

| File | Purpose |
|------|---------|
| `package.json` | Extension manifest (activation events, contribution points, metadata) |
| `src/extension.ts` | Entry point (activate/deactivate functions) |
| `tsconfig.json` | TypeScript compiler options |
| `.vscode/launch.json` | Debug configuration |
| `.vscodeignore` | Files to exclude from package |
| `README.md` | Extension description on Marketplace |
| `CHANGELOG.md` | Version history |
| `LICENSE` | Extension license |

---

## Resources

- [VS Code API Reference](https://code.visualstudio.com/api/references/vscode-api)
- [Contribution Points](https://code.visualstudio.com/api/references/contribution-points)
- [Activation Events](https://code.visualstudio.com/api/references/activation-events)
- [Extension Manifest](https://code.visualstudio.com/api/references/extension-manifest)
- [Extension Samples Repository](https://github.com/microsoft/vscode-extension-samples)
- [UX Guidelines](https://code.visualstudio.com/api/ux-guidelines/overview)
- [VS Code Discussions](https://github.com/microsoft/vscode-discussions)
- [Stack Overflow - vscode-extensions](https://stackoverflow.com/questions/tagged/vscode-extensions)
