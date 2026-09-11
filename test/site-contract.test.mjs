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

test('Academy has a 20-lesson minimum for every active track', async () => {
  const academy = await read('lib/academy-data.ts')
  const expectedTrackIds = ['csharp', 'cpp', 'java', 'python']
  const trackFieldsPattern = /id: '(csharp|cpp|java|python)'[\s\S]{0,220}?available: (true|false)/g
  const trackFields = [...academy.matchAll(trackFieldsPattern)]

  assert.deepEqual(trackFields.map((match) => match[1]), expectedTrackIds)
  assert.deepEqual(trackFields.map((match) => match[2]), ['true', 'true', 'false', 'false'])
  assert.match(academy, /id: 'java'[\s\S]{0,220}?available: false,[\s\S]{0,80}?modules: \[\]/)
  assert.match(academy, /id: 'python'[\s\S]{0,220}?available: false,[\s\S]{0,80}?modules: \[\]/)

  const activeTracks = trackFields.filter((match) => match[2] === 'true')
  for (const match of activeTracks) {
    const start = match.index ?? 0
    const nextStart = activeTracks.find((candidate) => (candidate.index ?? 0) > start)?.index
    const end = nextStart ?? academy.length
    const section = academy.slice(start, end)
    const lessonIds = [...section.matchAll(/lesson\('([^']+)'/g)].map((lesson) => lesson[1])
    assert.ok(lessonIds.length >= 20, `${match[1]} must have at least 20 lessons`)
    assert.equal(new Set(lessonIds).size, lessonIds.length)
  }

  const allLessons = [...academy.matchAll(/lesson\('([^']+)',\s*'[^']+',\s*(\d+)/g)]
  const totalPoints = allLessons.reduce((sum, match) => sum + Number(match[2]), 0)
  assert.equal(allLessons.length, 40)
  assert.equal(totalPoints, 945)
  assert.match(academy, /export const maxPoints = tracks[\s\S]*?reduce\(/)
  assert.doesNotMatch(academy, /checks: \[\]/)
})

test('Academy progress survives reloads through local storage', async () => {
  const dashboard = await read('components/academy/academy-dashboard.tsx')
  assert.match(dashboard, /useEffect/)
  assert.match(dashboard, /localStorage\.getItem\(STORAGE_KEY\)/)
  assert.match(dashboard, /localStorage\.setItem\(/)
  assert.match(dashboard, /completedIds: \[\.\.\.completedIds\]/)
  assert.match(dashboard, /codeByLesson/)
  assert.match(dashboard, /zenith-academy-progress-v1/)
  assert.match(dashboard, /lessonIndex\.has\(value\.activeLessonId\)/)
})
