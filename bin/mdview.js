#!/usr/bin/env node

const { spawn, execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
  Markdown Viewer - A lightweight Markdown viewer

  Usage:
    mdview [file]               Open a markdown file
    mdview --help               Show this help message
    mdview --version            Show version

  Examples:
    mdview README.md            Open README.md
  `);
  process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
  const pkg = require('../package.json');
  console.log('mdview-app v' + pkg.version);
  process.exit(0);
}

// Resolve the packaged Electron app (pre-built .exe)
const pkgRoot = path.join(__dirname, '..');
const exePath = path.join(pkgRoot, 'release', 'win-unpacked', 'MarkdownViewer.exe');

if (!fs.existsSync(exePath)) {
  console.error('Error: MarkdownViewer.exe not found at ' + exePath);
  console.error('The app may not be installed correctly. Try reinstalling:');
  console.error('  npm install -g mdview-app');
  process.exit(1);
}

// Build arguments — the .exe accepts file paths directly
const exeArgs = [];
const fileArgs = args.filter(function(a) { return !a.startsWith('--'); });
if (fileArgs.length > 0) {
  for (const file of fileArgs) {
    exeArgs.push(path.resolve(file));
  }
}

const child = spawn(exePath, exeArgs, {
  stdio: 'ignore',
  detached: true,
  windowsHide: false,
});

child.on('error', function(err) {
  console.error('Failed to start Markdown Viewer:', err.message);
  process.exit(1);
});

child.unref();
process.exit(0);
