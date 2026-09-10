import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')

async function read(path) {
  return readFile(resolve(root, path), 'utf8')
}

test('primary navigation points to implemented routes', async () => {
  const header = await read('components/site-header.tsx')
  const expectedRoutes = ['/', '/about', '/services', '/academy', '/contact']

  for (const route of expectedRoutes) {
    assert.match(header, new RegExp(`href=['\"]${route.replace('/', '\\/')}['\"]`))
  }
})

test('primary navigation has an accessible label and mobile control state', async () => {
  const header = await read('components/site-header.tsx')

  assert.match(header, /aria-label="Main navigation"/)
  assert.match(header, /aria-expanded=\{open\}/)
  assert.match(header, /aria-label=\{open \? 'Close menu' : 'Open menu'\}/)
})

test('home page retains the core conversion paths', async () => {
  const hero = await read('components/home/hero.tsx')

  assert.match(hero, /href="\/contact"/)
  assert.match(hero, /href="\/academy"/)
  assert.match(hero, /Deploy With Us/)
  assert.match(hero, /Enter the Academy/)
})
