// Builds the bookmarklet link from text-spacing.js:
// removes comments and indentation, then URL-encodes the code.
// Usage: node build.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const source = readFileSync(new URL('./text-spacing.js', import.meta.url), 'utf8');
const code = source
  .split('\n')
  .map(line => line.trim())
  .filter(line => line && !line.startsWith('//'))
  .join('\n');

new Function(code); // throws on syntax errors
writeFileSync(new URL('./bookmarklet.txt', import.meta.url), `javascript:${encodeURIComponent(code)}\n`);
console.log(`bookmarklet.txt written (${code.length} characters of code)`);
