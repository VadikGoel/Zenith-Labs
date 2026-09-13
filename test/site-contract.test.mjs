import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
async function read(path) { return readFile(resolve(root, path), 'utf8') }

test('primary navigation defines every implemented route', async () => {
  const header = await read('components/site-header.tsx')
  for (const route of ['/', '/about', '/services', '/academy', '/contact']) {
    const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    assert.match(header, new RegExp(`href: ['\\"]${escaped}['\\"]`))
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

test('package scripts and package-manager declaration match the CI contract', async () => {
  const packageJson = JSON.parse(await read('package.json'))
  assert.equal(packageJson.name, 'zenith-labs')
  assert.equal(packageJson.packageManager, 'npm@10.9.8')
  assert.equal(typeof packageJson.scripts.build, 'string')
  assert.equal(typeof packageJson.scripts.test, 'string')
})

test('CI pins third-party GitHub Actions to immutable commit SHAs', async () => {
  const workflow = await read('.github/workflows/ci.yml')
  assert.match(workflow, /uses: actions\/checkout@[0-9a-f]{40} # v5\.0\.0/)
  assert.match(workflow, /uses: actions\/setup-node@[0-9a-f]{40} # v5\.0\.0/)
  assert.doesNotMatch(workflow, /uses: actions\/(checkout|setup-node)@v\d/)
})

test('root metadata is production-oriented and identifies Zenith Labs', async () => {
  const layout = await read('app/layout.tsx')
  assert.match(layout, /default: 'Zenith Labs — AI-Powered Digital Engineering Studio'/)
  assert.match(layout, /template: '%s — Zenith Labs'/)
  assert.match(layout, /applicationName: 'Zenith Labs'/)
  assert.match(layout, /robots: \{\s*index: true,\s*follow: true,\s*\}/)
  assert.doesNotMatch(layout, /generator: 'v0\.app'/)
})

test('baseline security headers are configured for every application route', async () => {
  const config = await read('next.config.ts')
  assert.match(config, /source: '\/\(\.\*\)'/)
  assert.match(config, /X-Content-Type-Options.*nosniff/)
  assert.match(config, /X-Frame-Options.*SAMEORIGIN/)
  assert.match(config, /Referrer-Policy.*strict-origin-when-cross-origin/)
  assert.match(config, /Permissions-Policy.*camera=\(\).*microphone=\(\).*geolocation=\(\)/)
})

test('Academy has the expected active-track curriculum baseline', async () => {
  const academy = await read('lib/academy-data.ts')
  assert.deepEqual([...academy.matchAll(/id: '(csharp|cpp|java|python)'[\s\S]{0,220}?available: (true|false)/g)].map(m => [m[1], m[2]]), [['csharp','true'],['cpp','true'],['java','false'],['python','false']])
  const lessons = [...academy.matchAll(/lesson\('([^']+)',\s*'[^']+',\s*(\d+)/g)]
  assert.equal(lessons.length, 40)
  assert.equal(new Set(lessons.map(m => m[1])).size, 40)
  assert.equal(lessons.reduce((sum, m) => sum + Number(m[2]), 0), 945)
  assert.doesNotMatch(academy, /checks: \[\]/)
})

test('Academy progress survives reloads through local storage', async () => {
  const dashboard = await read('components/academy/academy-dashboard.tsx')
  assert.match(dashboard, /localStorage\.getItem\(STORAGE_KEY\)/)
  assert.match(dashboard, /localStorage\.setItem\(/)
  assert.match(dashboard, /completedIds: \[\.\.\.completedIds\]/)
  assert.match(dashboard, /codeByLesson/)
  assert.match(dashboard, /zenith-academy-progress-v1/)
  assert.match(dashboard, /lessonIndex\.has\(value\.activeLessonId\)/)
})

test('Academy persistence is debounced and bounded', async () => {
  const dashboard = await read('components/academy/academy-dashboard.tsx')
  assert.match(dashboard, /const CODE_PERSIST_DEBOUNCE_MS = 250/)
  assert.match(dashboard, /return \(\) => window\.clearTimeout\(timeoutId\)/)
  assert.match(dashboard, /const MAX_PERSISTED_JSON_LENGTH = 1_000_000/)
  assert.match(dashboard, /candidateLength > MAX_PERSISTED_JSON_LENGTH/)
  assert.match(dashboard, /const baseLength = JSON\.stringify\(base\)\.length/)
})

test('Academy flushes committed progress on page lifecycle changes', async () => {
  const dashboard = await read('components/academy/academy-dashboard.tsx')
  assert.match(dashboard, /const flushProgress = \(\) => \{\n      const snapshot = progressRef\.current/)
  assert.match(dashboard, /window\.addEventListener\('pagehide', flushProgress\)/)
  assert.match(dashboard, /document\.addEventListener\('visibilitychange', flushWhenHidden\)/)
  assert.match(dashboard, /window\.removeEventListener\('pagehide', flushProgress\)/)
})

test('Academy accurately describes deterministic verification', async () => {
  const dashboard = await read('components/academy/academy-dashboard.tsx')
  assert.match(dashboard, /Every lesson is verified against a deterministic\s+assertion engine\./)
  assert.doesNotMatch(dashboard, /Every lesson is verified against a live\s+assertion engine\./)
})

test('Academy syllabus uses accessible semantic lesson controls', async () => {
  const syllabus = await read('components/academy/syllabus-tree.tsx')
  assert.match(syllabus, /<nav aria-label="Course syllabus"/)
  assert.match(syllabus, /aria-expanded=\{isOpen\}/)
  assert.match(syllabus, /aria-controls=\{lessonListId\}/)
  assert.match(syllabus, /<ul id=\{lessonListId\}/)
  assert.doesNotMatch(syllabus, /\n\s+disabled=\{!unlocked\}/)
  assert.match(syllabus, /aria-disabled=\{!unlocked\}/)
  assert.match(syllabus, /aria-current=\{active \? 'true' : undefined\}/)
  assert.match(syllabus, /Complete “\$\{prerequisiteTitle\}” to unlock this lesson/)
})

test('Academy lesson workspace exposes accessible editor and verification output', async () => {
  const workspace = await read('components/academy/lesson-workspace.tsx')
  assert.match(workspace, /const editorId = `code-editor-\$\{lesson\.id\}`/)
  assert.match(workspace, /const requirementsId = `verification-requirements-\$\{lesson\.id\}`/)
  assert.match(workspace, /const outputId = `verification-output-\$\{lesson\.id\}`/)
  assert.match(workspace, /<label htmlFor=\{editorId\}/)
  assert.match(workspace, /aria-describedby=\{`\$\{requirementsId\} \$\{outputId\}`\}/)
  assert.match(workspace, /role="log" aria-live="polite"/)
  assert.match(workspace, /aria-busy=\{running\}/)
  assert.match(workspace, /role="status"[\s\S]*?aria-live="polite"[\s\S]*?>\s*Completed/)
})

test('Academy editor cannot change while verification is running', async () => {
  const workspace = await read('components/academy/lesson-workspace.tsx')
  assert.match(workspace, /disabled=\{running\}/)
  assert.match(workspace, /aria-busy=\{running\}/)
  assert.match(workspace, /disabled:cursor-wait/)
})
