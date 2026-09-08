/* Applies full-color browser-tab favicon links to every HTML page. */
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const previousFullColor = '<link rel="icon" href="/assets/images/favicon-32.png" sizes="32x32" type="image/png"><link rel="icon" href="/assets/images/favicon-48.png" sizes="48x48" type="image/png"><link rel="shortcut icon" href="/assets/images/favicon-32.png" type="image/png">';
const favicon = '<link rel="icon" href="/assets/images/favicon-32.png" sizes="32x32" type="image/png"><link rel="icon" href="/assets/images/favicon-48.png" sizes="48x48" type="image/png"><link rel="shortcut icon" href="/favicon.ico" type="image/x-icon">';
const excluded = new Set(['.git', 'node_modules']);

function visit(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && !excluded.has(entry.name)) visit(path.join(directory, entry.name));
    if (entry.isFile() && entry.name === 'index.html') {
      const file = path.join(directory, entry.name);
      const html = fs.readFileSync(file, 'utf8');
      if (html.includes(previousFullColor)) fs.writeFileSync(file, html.replace(previousFullColor, favicon));
    }
  }
}

visit(root);
