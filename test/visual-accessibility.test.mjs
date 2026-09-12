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
