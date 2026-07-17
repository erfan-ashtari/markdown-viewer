#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const isDev = !fs.existsSync(path.join(__dirname, '..', 'dist'));

// Show help
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
  Markdown Viewer - A lightweight Markdown viewer

  Usage:
    mdview [file]              Open a markdown file
    mdview --help              Show this help message
    mdview --version           Show version
    mdview --dev               Run in development mode

  Examples:
    mdview README.md           Open README.md
    mdview ./docs/             Open folder in file explorer
  `);
  process.exit(0);
}

// Show version
if (args.includes('--version') || args.includes('-v')) {
  const pkg = require('../package.json');
  console.log(`mdview v${pkg.version}`);
  process.exit(0);
}

// Determine electron path
let electronPath;
if (isDev) {
  electronPath = require('electron');
} else {
  // In production, electron is packaged
  electronPath = path.join(__dirname, '..', 'electron');
}

// Build electron args
const electronArgs = [path.join(__dirname, '..', 'electron')];

// Pass file/folder arguments
const fileArgs = args.filter(a => !a.startsWith('--'));
if (fileArgs.length > 0) {
  const target = path.resolve(fileArgs[0]);
  electronArgs.push('--open', target);
}

// Spawn electron
const child = spawn(electronPath, electronArgs, {
  stdio: 'inherit',
  detached: true,
});

child.on('close', (code) => {
  process.exit(code || 0);
});

// Unref so the CLI can exit
child.unref();
