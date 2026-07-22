#!/usr/bin/env node

/**
 * Bundle a runtime plugin's dependencies into a single file.
 * 
 * Usage:
 *   node bundle-plugin.js <plugin-directory>
 * 
 * Requirements:
 *   - esbuild must be installed globally: npm install -g esbuild
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const pluginDir = process.argv[2];

if (!pluginDir) {
  console.error('Usage: node bundle-plugin.js <plugin-directory>');
  console.error('');
  console.error('Example:');
  console.error('  node bundle-plugin.js .');
  process.exit(1);
}

const resolvedDir = path.resolve(pluginDir);

if (!fs.existsSync(path.join(resolvedDir, 'package.json'))) {
  console.error('Error: No package.json found in', resolvedDir);
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(path.join(resolvedDir, 'package.json'), 'utf-8'));
const entryFile = pkg.main === 'index.bundled.js' ? 'index.js' : (pkg.main || 'index.js');
const entryPoint = path.join(resolvedDir, entryFile);

if (!fs.existsSync(entryPoint)) {
  console.error('Error: Entry point not found:', entryPoint);
  console.error('Expected:', entryFile);
  process.exit(1);
}

const outFile = path.join(resolvedDir, 'index.bundled.js');

console.log('Bundling:', pkg.name || resolvedDir);
console.log('Entry:', entryFile);
console.log('Output: index.bundled.js');

try {
  execSync(
    `npx esbuild "${entryFile}" --bundle --outfile=index.bundled.js --platform=node --target=node18 --format=cjs`,
    { cwd: resolvedDir, stdio: 'inherit' }
  );

  console.log('');
  console.log('Done! Bundled to index.bundled.js');
  console.log('');
  console.log('Next: Update package.json "main" to "index.bundled.js"');
} catch (err) {
  console.error('Bundle failed. Is esbuild installed? Run: npm install -g esbuild');
  process.exit(1);
}
