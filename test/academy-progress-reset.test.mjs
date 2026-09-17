import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')

async function readDashboard() {
  return readFile(resolve(root, 'components/academy/academy-dashboard.tsx'), 'utf8')
}

test('Academy exposes an explicit reset-progress control', async () => {
  const dashboard = await readDashboard()
  assert.match(dashboard, /const resetProgress = \(\) => \{[\s\S]*window\.localStorage\.removeItem\(STORAGE_KEY\)/)
  assert.match(dashboard, /onClick=\{resetProgress\}/)
  assert.match(dashboard, />\s*Reset progress\s*</)
  assert.match(dashboard, /aria-label="Reset all Academy progress and saved code"/)
})

test('Academy reset requires confirmation and restores the first lesson state', async () => {
  const dashboard = await readDashboard()
  assert.match(dashboard, /window\.confirm\('Reset all Zenith Academy progress and saved code\? This cannot be undone\.'\)/)
  assert.match(dashboard, /setActiveLessonId\(firstLessonId\)/)
  assert.match(dashboard, /setCompletedIds\(new Set\(\)\)/)
  assert.match(dashboard, /setCodeByLesson\(\{\}\)/)
})

test('Academy persistence flushes the latest progress when the page is hidden or unloaded', async () => {
  const dashboard = await readDashboard()
  assert.match(dashboard, /const snapshot = progressRef\.current/)
  assert.match(dashboard, /const flushProgress = \(\) => \{[\s\S]*persistProgress\(\{[\s\S]*codeByLesson: snapshot\.codeByLesson[\s\S]*\}\)/)
  assert.match(dashboard, /window\.addEventListener\('pagehide', flushProgress\)/)
  assert.match(dashboard, /document\.addEventListener\('visibilitychange', flushWhenHidden\)/)
  assert.match(dashboard, /if \(document\.visibilityState === 'hidden'\) flushProgress\(\)/)
  assert.match(dashboard, /window\.removeEventListener\('pagehide', flushProgress\)/)
  assert.match(dashboard, /document\.removeEventListener\('visibilitychange', flushWhenHidden\)/)
})

test('Academy debounces saved-code persistence without delaying ordinary progress persistence', async () => {
  const dashboard = await readDashboard()
  assert.match(dashboard, /const CODE_PERSIST_DEBOUNCE_MS = 250/)
  assert.match(dashboard, /if \(!hydrated\) return/)
  assert.match(dashboard, /const timeoutId = window\.setTimeout\(\(\) => \{[\s\S]*codeByLesson: snapshot\.codeByLesson[\s\S]*\}, CODE_PERSIST_DEBOUNCE_MS\)/)
  assert.match(dashboard, /return \(\) => window\.clearTimeout\(timeoutId\)/)
  assert.match(dashboard, /\}, \[codeByLesson, hydrated\]\)/)
  assert.match(dashboard, /\}, \[activeLessonId, completedIds, hydrated\]\)/)
})
