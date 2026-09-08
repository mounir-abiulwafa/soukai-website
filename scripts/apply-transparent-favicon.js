/* Applies the intentionally blank browser-tab favicon to every public HTML page. */
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const favicon = '<link rel="icon" href="/assets/images/favicon-transparent.svg" type="image/svg+xml">';
const excluded = new Set(['.git', 'node_modules']);

function visit(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && !excluded.has(entry.name)) visit(path.join(directory, entry.name));
    if (entry.isFile() && entry.name === 'index.html') {
      const file = path.join(directory, entry.name);
      const html = fs.readFileSync(file, 'utf8');
      if (!html.includes(favicon)) fs.writeFileSync(file, html.replace('</head>', `${favicon}</head>`));
    }
  }
}

visit(root);
