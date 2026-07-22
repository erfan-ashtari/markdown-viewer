#!/usr/bin/env node

/**
 * Bundle a runtime plugin's dependencies into a single file.
 * 
 * Usage:
 *   node scripts/bundle-plugin.js <plugin-directory>
 * 
 * This script uses esbuild to bundle all dependencies into a single
 * index.bundled.js file. The plugin's package.json "main" field
 * should be updated to point to this file after bundling.
 * 
 * Requirements:
 *   - esbuild must be installed (npm install -g esbuild)
 *   - Plugin must have a package.json with dependencies
 */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const pluginDir = process.argv[2];

if (!pluginDir) {
  console.error('Usage: node scripts/bundle-plugin.js <plugin-directory>');
  console.error('');
  console.error('Example:');
  console.error('  node scripts/bundle-plugin.js C:\\Users\\user\\AppData\\Roaming\\@mdview\\core\\plugins\\my-plugin');
  process.exit(1);
}

const resolvedDir = path.resolve(pluginDir);

if (!fs.existsSync(path.join(resolvedDir, 'package.json'))) {
  console.error('Error: No package.json found in', resolvedDir);
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(path.join(resolvedDir, 'package.json'), 'utf-8'));
const entryPoint = path.join(resolvedDir, pkg.main || 'index.js');

if (!fs.existsSync(entryPoint)) {
  console.error('Error: Entry point not found:', entryPoint);
  process.exit(1);
}

console.log('Bundling plugin:', pkg.name || resolvedDir);
console.log('Entry point:', entryPoint);

try {
  esbuild.buildSync({
    entryPoints: [entryPoint],
    bundle: true,
    outfile: path.join(resolvedDir, 'index.bundled.js'),
    platform: 'node',
    target: 'node18',
    format: 'cjs',
    external: [], // Bundle everything
    minify: false,
    sourcemap: false,
  });

  console.log('Success! Bundled to:', path.join(resolvedDir, 'index.bundled.js'));
  console.log('');
  console.log('Next steps:');
  console.log('1. Update package.json "main" to "index.bundled.js"');
  console.log('2. Test your plugin');
} catch (err) {
  console.error('Bundle failed:', err.message);
  process.exit(1);
}
