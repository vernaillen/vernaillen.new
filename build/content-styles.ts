import { transformSync } from 'esbuild'

// Canonicalize Shiki's generated CSS before it enters both the HTML and the
// payload. A later HTML-only minifier otherwise changes Vue's hydration text.
export function minifyContentStyles(node: unknown): void {
  if (Array.isArray(node)) {
    if (node[0] === 'style' && typeof node[2] === 'string' && node[2].includes('--shiki-')) {
      node[2] = transformSync(node[2], { loader: 'css', minify: true }).code.trim()
    } else {
      node.forEach(minifyContentStyles)
    }
  } else if (node && typeof node === 'object') {
    Object.values(node).forEach(minifyContentStyles)
  }
}
