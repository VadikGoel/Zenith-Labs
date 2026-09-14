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
