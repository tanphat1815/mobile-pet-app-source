#!/usr/bin/env node
/**
 * Bump the app version in app.json + package.json + iOS infoPlist
 * in lockstep. Matches the semantic of `npm version`.
 *
 * Usage:
 *   node ./scripts/bump-version.js patch    # 0.1.0 -> 0.1.1
 *   node ./scripts/bump-version.js minor    # 0.1.0 -> 0.2.0
 *   node ./scripts/bump-version.js major    # 0.1.0 -> 1.0.0
 *
 * Also bumps android.versionCode and iOS CFBundleVersion.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APP_JSON = path.join(ROOT, 'app.json');
const PACKAGE_JSON = path.join(ROOT, 'package.json');

const bumpKind = process.argv[2];
if (!['patch', 'minor', 'major'].includes(bumpKind)) {
  console.error('Usage: bump-version.js <patch|minor|major>');
  process.exit(1);
}

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJSON(file, obj) {
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function bump(version, kind) {
  const parts = version.split('.').map((p) => parseInt(p, 10));
  while (parts.length < 3) parts.push(0);
  if (kind === 'major') {
    parts[0] += 1;
    parts[1] = 0;
    parts[2] = 0;
  } else if (kind === 'minor') {
    parts[1] += 1;
    parts[2] = 0;
  } else {
    parts[2] += 1;
  }
  return parts.join('.');
}

const pkg = readJSON(PACKAGE_JSON);
const app = readJSON(APP_JSON);

const oldVersion = pkg.version;
const newVersion = bump(oldVersion, bumpKind);

pkg.version = newVersion;
app.expo.version = newVersion;

// Bump Android versionCode (monotonically increasing integer)
if (typeof app.expo.android?.versionCode === 'number') {
  app.expo.android.versionCode += 1;
}

// Bump iOS CFBundleVersion (must be a positive integer string)
const bundleVersion = String(
  (parseInt(app.expo.ios?.infoPlist?.CFBundleVersion ?? '1', 10) || 0) + 1
);
app.expo.ios = app.expo.ios || {};
app.expo.ios.infoPlist = app.expo.ios.infoPlist || {};
app.expo.ios.infoPlist.CFBundleVersion = bundleVersion;
app.expo.ios.infoPlist.CFBundleShortVersionString = newVersion;

writeJSON(PACKAGE_JSON, pkg);
writeJSON(APP_JSON, app);

console.log(`Bumped ${oldVersion} -> ${newVersion}`);
console.log(`Android versionCode: ${app.expo.android?.versionCode}`);
console.log(`iOS CFBundleVersion: ${bundleVersion}`);