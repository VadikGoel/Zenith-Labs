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
    const escapedRoute = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    assert.match(header, new RegExp(`href: ['\\"]${escapedRoute}['\\"]`))
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

test('Academy selects the first lesson even when the first available module is empty', async () => {
  const dashboard = await read('components/academy/academy-dashboard.tsx')
  assert.match(dashboard, /const firstAvailableTrack = tracks\.find\(\(track\) => track\.available\)/)
  assert.match(dashboard, /firstAvailableTrack\?\.modules\n  \.flatMap\(\(module\) => module\.lessons\)/)
  assert.match(dashboard, /\.find\(\(lesson\) => lesson !== undefined\)\?\.id/)
  assert.doesNotMatch(dashboard, /firstAvailableTrack\?\.modules\[0\]\?\.lessons\[0\]\?\.id/)
})

test('Academy code persistence is debounced to avoid a storage write on every keystroke', async () => {
  const dashboard = await read('components/academy/academy-dashboard.tsx')
  assert.match(dashboard, /const CODE_PERSIST_DEBOUNCE_MS = 250/)
  assert.match(dashboard, /window\.setTimeout\(\(\) => \{[\s\S]*?persistProgress\(/)
  assert.match(dashboard, /return \(\) => window\.clearTimeout\(timeoutId\)/)
  assert.match(dashboard, /\[codeByLesson, hydrated\]/)
  assert.doesNotMatch(dashboard, /\[codeByLesson, hydrated, activeLessonId, completedIds\]/)
})

test('Academy progress writes stay within a bounded serialized storage budget', async () => {
  const dashboard = await read('components/academy/academy-dashboard.tsx')
  assert.match(dashboard, /const MAX_PERSISTED_JSON_LENGTH = 1_000_000/)
  assert.match(dashboard, /function serializeProgress\(progress: StoredProgress\)/)
  assert.match(dashboard, /candidateLength > MAX_PERSISTED_JSON_LENGTH/)
  assert.match(dashboard, /codeObjectLength = nextCodeObjectLength/)
  assert.match(dashboard, /localStorage\.setItem\(STORAGE_KEY, serializeProgress\(progress\)\)/)
  assert.match(dashboard, /progress\.activeLessonId/)
  assert.match(dashboard, /progress\.completedIds/)
})

test('Academy persistence budgeting avoids quadratic candidate serialization', async () => {
  const dashboard = await read('components/academy/academy-dashboard.tsx')
  assert.match(dashboard, /const baseLength = JSON\.stringify\(base\)\.length/)
  assert.match(dashboard, /const codeFieldPrefix = ',"codeByLesson":'/)
  assert.match(dashboard, /const entryLength = JSON\.stringify\(id\)\.length \+ 1 \+ JSON\.stringify\(code\)\.length/)
  assert.match(dashboard, /const candidateLength = baseLength \+ codeFieldPrefix\.length \+ nextCodeObjectLength/)
  assert.doesNotMatch(dashboard, /const candidate = JSON\.stringify\(\{ \.\.\.base, codeByLesson \}\)/)
})

test('Academy persistence ref is synchronized after commit, not mutated during render', async () => {
  const dashboard = await read('components/academy/academy-dashboard.tsx')
  assert.match(dashboard, /useEffect\(\(\) => \{\n    progressRef\.current = \{ activeLessonId, completedIds, codeByLesson \}\n  \}, \[activeLessonId, completedIds, codeByLesson\]\)/)
  assert.doesNotMatch(dashboard, /\n  progressRef\.current = \{ activeLessonId, completedIds, codeByLesson \}\n\n  useEffect/)
  assert.match(dashboard, /const snapshot = progressRef\.current/)
  assert.match(dashboard, /activeLessonId: snapshot\.activeLessonId/)
  assert.match(dashboard, /completedIds: \[\.\.\.snapshot\.completedIds\]/)
  assert.match(dashboard, /codeByLesson: snapshot\.codeByLesson/)
  assert.doesNotMatch(dashboard, /\}, \[activeLessonId, completedIds, hydrated, codeByLesson\]\)/)
})

test('Academy flushes the latest committed progress when the page is hidden or unloaded', async () => {
  const dashboard = await read('components/academy/academy-dashboard.tsx')
  assert.match(dashboard, /const flushProgress = \(\) => \{\n      const snapshot = progressRef\.current/)
  assert.match(dashboard, /const flushWhenHidden = \(\) => \{\n      if \(document\.visibilityState === 'hidden'\) flushProgress\(\)/)
  assert.match(dashboard, /window\.addEventListener\('pagehide', flushProgress\)/)
  assert.match(dashboard, /document\.addEventListener\('visibilitychange', flushWhenHidden\)/)
  assert.match(dashboard, /window\.removeEventListener\('pagehide', flushProgress\)/)
  assert.match(dashboard, /document\.removeEventListener\('visibilitychange', flushWhenHidden\)/)
  assert.match(dashboard, /persistProgress\(\{\n        activeLessonId: snapshot\.activeLessonId,[\s\S]*?codeByLesson: snapshot\.codeByLesson,/)
})

test('Academy describes its current deterministic verification model accurately', async () => {
  const dashboard = await read('components/academy/academy-dashboard.tsx')
  assert.match(dashboard, /Every lesson is verified against a deterministic\s+assertion engine\./)
  assert.doesNotMatch(dashboard, /Every lesson is verified against a live\s+assertion engine\./)
})

test('Academy syllabus exposes keyboard-friendly semantic controls and locked-lesson context', async () => {
  const syllabus = await read('components/academy/syllabus-tree.tsx')
  assert.match(syllabus, /<nav aria-label="Course syllabus"/)
  assert.match(syllabus, /<button[\s\S]*?type="button"[\s\S]*?aria-expanded=\{isOpen\}[\s\S]*?aria-controls=\{lessonListId\}/)
  assert.match(syllabus, /<ul id=\{lessonListId\}/)
  assert.match(syllabus, /disabled=\{!unlocked\}/)
  assert.match(syllabus, /aria-disabled=\{!unlocked\}/)
  assert.match(syllabus, /aria-current=\{active \? 'true' : undefined\}/)
  assert.match(syllabus, /aria-label=\{unlocked \? lesson\.title : `\$\{lesson\.title\}\. \$\{lockedReason\}`\}/)
  assert.match(syllabus, /Complete “\$\{prerequisiteTitle\}” to unlock this lesson/)
  assert.match(syllabus, /focus-visible:outline-primary/)
})

test('Academy lesson workspace exposes uniquely associated editor and live verification output', async () => {
  const workspace = await read('components/academy/lesson-workspace.tsx')
  assert.match(workspace, /const editorId = `code-editor-\$\{lesson\.id\}`/)
  assert.match(workspace, /const requirementsId = `verification-requirements-\$\{lesson\.id\}`/)
  assert.match(workspace, /const outputId = `verification-output-\$\{lesson\.id\}`/)
  assert.match(workspace, /<label htmlFor=\{editorId\}/)
  assert.match(workspace, /id=\{editorId\}/)
  assert.match(workspace, /aria-describedby=\{`\$\{requirementsId\} \$\{outputId\}`\}/)
  assert.match(workspace, /id=\{requirementsId\}/)
  assert.match(workspace, /id=\{outputId\}/)
  assert.match(workspace, /role="log" aria-live="polite"/)
  assert.match(workspace, /aria-busy=\{running\}/)
  assert.match(workspace, /focus-visible:ring-primary\/70/)
  assert.match(workspace, /focus-visible:outline-primary/)
  assert.match(workspace, /role="status"[\s\S]*?aria-live="polite"[\s\S]*?>\s*Completed/)
})

test('Academy editor cannot change while verification is running', async () => {
  const workspace = await read('components/academy/lesson-workspace.tsx')
  assert.match(workspace, /disabled=\{running\}/)
  assert.match(workspace, /aria-busy=\{running\}/)
  assert.match(workspace, /disabled:cursor-wait/)
})
