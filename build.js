import { readdirSync, copyFileSync, mkdirSync, statSync, readFileSync, existsSync } from 'fs';
import { join, resolve, relative, dirname, extname, isAbsolute } from 'path';
import esbuild from 'esbuild';
import { htmlPlugin } from '@craftamap/esbuild-plugin-html';


/**
 * @param {string} src
 * @param {string} dest
 * @returns {void}
 */
// Recursive function to copy files, ignoring .ts*
function copyStaticFiles(src, dest) {
  mkdirSync(dest, { recursive: true });
  const entries = readdirSync(src);
  entries.forEach(entry => {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    const stats = statSync(srcPath);
    if (stats.isDirectory()) {
      // Recurse into subfolders
      copyStaticFiles(srcPath, destPath);
    } else {
      const ext = extname(entry).toLowerCase();
      if (ext !== '.ts' && ext !== '.html') {
        copyFileSync(srcPath, destPath);
      }
    }
  });
}

copyStaticFiles("src", "dist");

function isWhitespace(ch) {
  return ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t' || ch === '\f';
}

function isNameChar(ch) {
  const code = ch.charCodeAt(0);
  const isUpper = code >= 65 && code <= 90;
  const isLower = code >= 97 && code <= 122;
  const isDigit = code >= 48 && code <= 57;
  return isUpper || isLower || isDigit || ch === '-' || ch === '_' || ch === ':' || ch === '.';
}

function extractHtmlAssetRefs(htmlText) {
  const assets = new Set();
  let i = 0;
  const len = htmlText.length;

  while (i < len) {
    const lt = htmlText.indexOf('<', i);
    if (lt === -1) break;
    i = lt + 1;
    if (i >= len) break;

    const first = htmlText[i];
    if (first === '!' || first === '/' || first === '?') {
      const gt = htmlText.indexOf('>', i);
      if (gt === -1) break;
      i = gt + 1;
      continue;
    }

    while (i < len && isWhitespace(htmlText[i])) i++;
    const tagStart = i;
    while (i < len && isNameChar(htmlText[i])) i++;
    if (i === tagStart) {
      i++;
      continue;
    }

    while (i < len) {
      while (i < len && isWhitespace(htmlText[i])) i++;
      if (i >= len) break;
      const ch = htmlText[i];
      if (ch === '>' || ch === '/') {
        while (i < len && htmlText[i] !== '>') i++;
        if (i < len) i++;
        break;
      }

      const nameStart = i;
      while (i < len && isNameChar(htmlText[i])) i++;
      const name = htmlText.slice(nameStart, i).toLowerCase();
      if (!name) {
        i++;
        continue;
      }

      while (i < len && isWhitespace(htmlText[i])) i++;
      let value = '';
      if (htmlText[i] === '=') {
        i++;
        while (i < len && isWhitespace(htmlText[i])) i++;
        const quote = htmlText[i];
        if (quote === '"' || quote === "'") {
          i++;
          const valueStart = i;
          while (i < len && htmlText[i] !== quote) i++;
          value = htmlText.slice(valueStart, i);
          if (i < len) i++;
        } else {
          const valueStart = i;
          while (i < len && !isWhitespace(htmlText[i]) && htmlText[i] !== '>' && htmlText[i] !== '/') i++;
          value = htmlText.slice(valueStart, i);
        }
      }

      if ((name === 'src' || name === 'href') && value) {
        assets.add(value);
      }
    }
  }

  return Array.from(assets);
}

function stripQueryAndHash(value) {
  const q = value.indexOf('?');
  const h = value.indexOf('#');
  let end = value.length;
  if (q !== -1 && q < end) end = q;
  if (h !== -1 && h < end) end = h;
  return value.slice(0, end);
}

function isLocalAssetRef(value) {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('http://')) return false;
  if (lower.startsWith('https://')) return false;
  if (lower.startsWith('//')) return false;
  if (lower.startsWith('data:')) return false;
  if (lower.startsWith('chrome-extension:')) return false;
  if (lower.startsWith('mailto:')) return false;
  if (lower.startsWith('javascript:')) return false;
  if (lower.startsWith('#')) return false;
  return true;
}

function copyHtmlDependencies(htmlPath, srcRoot, distRoot) {
  const htmlText = readFileSync(htmlPath, 'utf8');
  const htmlDir = dirname(htmlPath);
  const refs = extractHtmlAssetRefs(htmlText);

  refs.forEach(ref => {
    if (!isLocalAssetRef(ref)) return;
    const cleaned = stripQueryAndHash(ref.trim());
    if (!cleaned) return;

    const assetPath = cleaned.startsWith('/')
      ? resolve(srcRoot, '.' + cleaned)
      : resolve(htmlDir, cleaned);

    if (!existsSync(assetPath)) return;
    const rel = relative(srcRoot, assetPath);
    if (!rel || rel.startsWith('..') || isAbsolute(rel)) return;

    const destPath = join(distRoot, rel);
    mkdirSync(dirname(destPath), { recursive: true });
    copyFileSync(assetPath, destPath);
  });
}

copyHtmlDependencies(resolve('src/popup/popup.html'), resolve('src'), resolve('dist'));

const content = ["first.ts"].map(x => "content/" + x);
const entryPoints = [...content, "background/index.ts"].map(x => "./src/" + x);

esbuild.build({
  entryPoints: entryPoints,
  bundle: true,
  metafile: true,  // Required for the plugin
  outdir: 'dist',
  plugins: [
    htmlPlugin({
      files: [
        {
          filename: 'popup/popup.html',  // Output path relative to outdir
          htmlTemplate: './src/popup/popup.html',  // Input template
          entryPoints: [],  // Add paths like ['./src/popup/popup.ts'] if you have JS to bundle and inject
          // Optional: scriptLoading: 'module', hash: true, extraScripts: [...], extraStyles: [...], etc.
        },
        // Add more objects here if you have additional HTML files
      ],
    }),
  ],
  // Uncomment and add your other options as needed:
  // minify: true,
  // sourcemap: true,
  // format: 'esm',
  // target: ['esnext'],
  // splitting: true,
  // platform: 'browser',
});
