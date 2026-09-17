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
  assert.match(header, /aria-label=\{open \? 'Close menu' : 'Open menu'\}/)
})

test('navigation links expose the active page semantically in both desktop and mobile menus', async () => {
  const header = await read('components/site-header.tsx')
  const activePageBindings = header.match(/aria-current=\{pathname === link\.href \? 'page' : undefined\}/g) ?? []
  assert.equal(activePageBindings.length, 2)
})

test('navigation controls retain visible keyboard focus styling', async () => {
  const header = await read('components/site-header.tsx')
  assert.match(header, /focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/)
  assert.match(header, /focus-visible:outline-2 focus-visible:outline-offset-\[-2px\] focus-visible:outline-primary/)
})

test('locked Academy lessons remain keyboard discoverable with an accessible reason', async () => {
  const syllabus = await read('components/academy/syllabus-tree.tsx')
  assert.doesNotMatch(syllabus, /\n\s+disabled=\{!unlocked\}/)
  assert.match(syllabus, /aria-disabled=\{!unlocked\}/)
  assert.match(syllabus, /aria-label=\{unlocked \? lesson\.title : `\$\{lesson\.title\}\. \$\{lockedReason\}`\}/)
  assert.match(syllabus, /if \(unlocked\) onSelectLesson\(lesson\.id\)/)
})

test('active Academy lesson buttons use boolean aria-current state', async () => {
  const syllabus = await read('components/academy/syllabus-tree.tsx')
  assert.match(syllabus, /aria-current=\{active \? 'true' : undefined\}/)
  assert.doesNotMatch(syllabus, /aria-current=\{active \? 'page' : undefined\}/)
})
