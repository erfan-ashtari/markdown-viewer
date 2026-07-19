#!/usr/bin/env node

var spawn = require('child_process').spawn;
var path = require('path');
var fs = require('fs');
var execFile = require('child_process').execFile;

var args = process.argv.slice(2);
var platform = process.platform;

if (args.indexOf('--help') !== -1 || args.indexOf('-h') !== -1) {
  console.log('\n  Markdown Viewer - A lightweight Markdown viewer\n');
  console.log('  Usage:');
  console.log('    mdview [file]               Open a markdown file');
  console.log('    mdview --help               Show this help message');
  console.log('    mdview --version            Show version');
  console.log('    mdview --re-download        Re-download the app binary');
  console.log('');
  process.exit(0);
}

if (args.indexOf('--version') !== -1 || args.indexOf('-v') !== -1) {
  var pkg = require('../package.json');
  console.log('mdview-app v' + pkg.version);
  process.exit(0);
}

// Resolve binary path based on platform
var binaryPath;
if (platform === 'win32') {
  binaryPath = path.join(__dirname, 'MarkdownViewer.exe');
} else if (platform === 'linux') {
  binaryPath = path.join(__dirname, 'MarkdownViewer.AppImage');
} else if (platform === 'darwin') {
  binaryPath = path.join(__dirname, 'MarkdownViewer.dmg');
} else {
  console.error('Unsupported platform: ' + platform);
  process.exit(1);
}

function launchApp() {
  var fileArgs = args.filter(function(a) { return a.charAt(0) !== '-'; });
  var exeArgs = [];
  for (var i = 0; i < fileArgs.length; i++) {
    exeArgs.push(path.resolve(fileArgs[i]));
  }

  var options = {
    stdio: 'ignore',
    detached: true
  };

  // On macOS, use 'open' command for .dmg
  if (platform === 'darwin') {
    exeArgs = [binaryPath].concat(exeArgs);
    var child = spawn('open', exeArgs, options);
    child.on('error', function(err) {
      console.error('Failed to start Markdown Viewer:', err.message);
      process.exit(1);
    });
    child.unref();
    process.exit(0);
    return;
  }

  var child = spawn(binaryPath, exeArgs, options);

  child.on('error', function(err) {
    console.error('Failed to start Markdown Viewer:', err.message);
    process.exit(1);
  });

  child.unref();
  process.exit(0);
}

function downloadAndLaunch() {
  var displayName = path.basename(binaryPath);
  console.log(displayName + ' not found. Downloading...');
  execFile('node', [path.join(__dirname, 'download.js')], function(err) {
    if (err) {
      console.error('');
      console.error('Automatic download failed.');
      console.error('Please download manually from:');
      console.error('  https://github.com/erfan-ashtari/markdown-viewer/releases/latest');
      console.error('');
      console.error('Place the file as: ' + binaryPath);
      process.exit(1);
    }
    launchApp();
  });
}

var validBinary = fs.existsSync(binaryPath) && fs.statSync(binaryPath).size > 1000000;

if (args.indexOf('--re-download') !== -1) {
  if (fs.existsSync(binaryPath)) fs.unlinkSync(binaryPath);
  downloadAndLaunch();
} else if (validBinary) {
  launchApp();
} else {
  downloadAndLaunch();
}
