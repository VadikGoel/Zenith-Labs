import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')

async function read(path) {
  return readFile(resolve(root, path), 'utf8')
}

test('Zenith UI animations respect prefers-reduced-motion', async () => {
  const css = await read('app/globals.css')
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/)
  assert.match(css, /\.animate-zenith-float,\s*\.animate-zenith-blip,\s*\.animate-zenith-caret\s*\{\s*animation: none;/)
})

test('mobile navigation toggle exposes its controlled menu region', async () => {
  const header = await read('components/site-header.tsx')
  assert.match(header, /<button[\s\S]*?aria-expanded=\{open\}[\s\S]*?aria-controls="mobile-main-menu"/)
  assert.match(header, /<div[\s\S]*?id="mobile-main-menu"/)
})

test('navigation links expose the active page semantically', async () => {
  const header = await read('components/site-header.tsx')
  const activePageBindings = header.match(/aria-current=\{pathname === link\.href \? 'page' : undefined\}/g) ?? []
  assert.equal(activePageBindings.length, 2)
})
