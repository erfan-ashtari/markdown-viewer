#!/usr/bin/env node

var spawn = require('child_process').spawn;
var path = require('path');
var fs = require('fs');
var execFile = require('child_process').execFile;

var args = process.argv.slice(2);

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

var exePath = path.join(__dirname, 'MarkdownViewer.exe');

function launchApp() {
  var exeArgs = [];
  var fileArgs = args.filter(function(a) { return a.charAt(0) !== '-'; });
  for (var i = 0; i < fileArgs.length; i++) {
    exeArgs.push(path.resolve(fileArgs[i]));
  }

  var child = spawn(exePath, exeArgs, {
    stdio: 'ignore',
    detached: true,
    windowsHide: false
  });

  child.on('error', function(err) {
    console.error('Failed to start Markdown Viewer:', err.message);
    process.exit(1);
  });

  child.unref();
  process.exit(0);
}

function downloadAndLaunch() {
  console.log('MarkdownViewer.exe not found. Downloading...');
  execFile('node', [path.join(__dirname, 'download.js')], function(err) {
    if (err) {
      console.error('');
      console.error('Automatic download failed.');
      console.error('Please download manually from:');
      console.error('  https://github.com/erfan-ashtari/markdown-viewer/releases/latest');
      console.error('');
      console.error('Place the portable .exe as: ' + exePath);
      process.exit(1);
    }
    launchApp();
  });
}

var validExe = fs.existsSync(exePath) && fs.statSync(exePath).size > 1000000;

if (args.indexOf('--re-download') !== -1) {
  if (fs.existsSync(exePath)) fs.unlinkSync(exePath);
  downloadAndLaunch();
} else if (validExe) {
  launchApp();
} else {
  downloadAndLaunch();
}
