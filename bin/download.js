#!/usr/bin/env node

var https = require('https');
var http = require('http');
var fs = require('fs');
var path = require('path');

var VERSION = require('../package.json').version;
var EXE_NAME = 'Markdown.Viewer-' + VERSION + '-portable.exe';
var TARGET = path.join(__dirname, 'MarkdownViewer.exe');
var URL = 'https://github.com/erfan-ashtari/markdown-viewer/releases/download/v' + VERSION + '/' + EXE_NAME;

function follow(url, dest) {
  return new Promise(function(resolve, reject) {
    var mod = url.indexOf('https') === 0 ? https : http;
    mod.get(url, function(res) {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        follow(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error('HTTP ' + res.statusCode + ' for ' + url));
        return;
      }

      var total = parseInt(res.headers['content-length'], 10) || 0;
      var downloaded = 0;
      var lastPct = 0;
      var file = fs.createWriteStream(dest);

      res.on('data', function(chunk) {
        downloaded += chunk.length;
        if (total) {
          var pct = Math.floor((downloaded / total) * 100);
          if (pct >= lastPct + 10) {
            lastPct = pct;
            console.log('  ' + pct + '% (' + (downloaded / 1048576).toFixed(1) + ' / ' + (total / 1048576).toFixed(1) + ' MB)');
          }
        }
      });

      res.pipe(file);
      file.on('finish', function() {
        file.close(function() {
          console.log('\n  Download complete.');
          resolve();
        });
      });
      file.on('error', function(err) {
        fs.unlink(dest, function() {});
        reject(err);
      });
    }).on('error', function(err) {
      reject(err);
    });
  });
}

if (fs.existsSync(TARGET)) {
  var stats = fs.statSync(TARGET);
  if (stats.size > 1000000) {
    console.log('MarkdownViewer.exe already downloaded (' + (stats.size / 1048576).toFixed(1) + ' MB).');
    process.exit(0);
  }
  fs.unlinkSync(TARGET);
}

console.log('Downloading Markdown Viewer v' + VERSION + '...');
follow(URL, TARGET).then(function() {
  process.exit(0);
}).catch(function(err) {
  console.error('');
  console.error('Failed to download MarkdownViewer.exe.');
  console.error('You can download it manually from:');
  console.error('  https://github.com/erfan-ashtari/markdown-viewer/releases/latest');
  console.error('');
  console.error('Place the portable .exe as: ' + TARGET);
  console.error('Error: ' + err.message);
  process.exit(1);
});
