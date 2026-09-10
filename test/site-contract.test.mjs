import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')

async function read(path) {
  return readFile(resolve(root, path), 'utf8')
}

test('primary navigation defines every implemented route', async () => {
  const header = await read('components/site-header.tsx')
  const expectedRoutes = ['/', '/about', '/services', '/academy', '/contact']

  for (const route of expectedRoutes) {
    assert.match(header, new RegExp(`href: ['\"]${route.replace('/', '\\/')}['\"]`))
  }
})

test('primary navigation exposes accessible mobile menu state', async () => {
  const header = await read('components/site-header.tsx')

  assert.match(header, /aria-label="Main navigation"/)
  assert.match(header, /aria-expanded=\{open\}/)
  assert.match(header, /aria-label=\{open \? 'Close menu' : 'Open menu'\}/)
})

test('home hero retains the core conversion paths', async () => {
  const hero = await read('components/home/hero.tsx')

  assert.match(hero, /href="\/contact"/)
  assert.match(hero, /href="\/academy"/)
  assert.match(hero, /Deploy With Us/)
  assert.match(hero, /Enter the Academy/)
})

test('package scripts match the CI validation contract', async () => {
  const packageJson = JSON.parse(await read('package.json'))

  assert.equal(packageJson.name, 'zenith-labs')
  assert.equal(typeof packageJson.scripts.build, 'string')
  assert.equal(typeof packageJson.scripts.test, 'string')
  assert.equal(packageJson.scripts.lint, undefined)
})

test('root metadata is production-oriented and identifies Zenith Labs', async () => {
  const layout = await read('app/layout.tsx')

  assert.match(layout, /default: 'Zenith Labs — AI-Powered Digital Engineering Studio'/)
  assert.match(layout, /template: '%s — Zenith Labs'/)
  assert.match(layout, /applicationName: 'Zenith Labs'/)
  assert.match(layout, /robots: \{\s*index: true,\s*follow: true,\s*\}/)
  assert.doesNotMatch(layout, /generator: 'v0\.app'/)
})
