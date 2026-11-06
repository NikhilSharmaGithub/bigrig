const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Monkey-patch fs.symlink and fs.promises.symlink
const originalSymlink = fs.symlink;
fs.symlink = function(target, path, type, callback) {
  if (typeof type === 'function') {
    callback = type;
    type = null;
  }
  console.log(`[HACK] Redirecting symlink to copy: ${target} -> ${path}`);
  // Simple copy instead of symlink
  fs.cp(target, path, { recursive: true }, callback);
};

const originalSymlinkPromise = fs.promises.symlink;
fs.promises.symlink = async function(target, path, type) {
  console.log(`[HACK] Redirecting promise symlink to copy: ${target} -> ${path}`);
  return fs.promises.cp(target, path, { recursive: true });
};

// Run netlify deploy
const args = process.argv.slice(2);
const child = spawn('npx.cmd', ['netlify', ...args], {
  stdio: 'inherit',
  shell: true
});

child.on('exit', (code) => {
  process.exit(code);
});
