#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const isDev = !fs.existsSync(path.join(__dirname, '..', 'dist'));

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
  Markdown Viewer - A lightweight Markdown viewer

  Usage:
    mdview-app [file]           Open a markdown file
    mdview-app --help           Show this help message
    mdview-app --version        Show version

  Examples:
    mdview-app README.md        Open README.md
  `);
  process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
  const pkg = require('../package.json');
  console.log('mdview-app v' + pkg.version);
  process.exit(0);
}

let electronPath;
if (isDev) {
  electronPath = require('electron');
} else {
  electronPath = path.join(__dirname, '..', 'electron');
}

const electronArgs = [path.join(__dirname, '..', 'electron')];

const fileArgs = args.filter(function(a) { return !a.startsWith('--'); });
if (fileArgs.length > 0) {
  const target = path.resolve(fileArgs[0]);
  electronArgs.push('--open', target);
}

const child = spawn(electronPath, electronArgs, {
  stdio: 'inherit',
  detached: true,
});

child.on('close', function(code) {
  process.exit(code || 0);
});

child.unref();
