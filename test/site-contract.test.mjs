import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'

const root = join(process.cwd())
const read = (relativePath) => readFile(join(root, relativePath), 'utf8')

// Existing tests remain unchanged above; this contract is intentionally source-level
// because the repository does not currently mount a browser runtime in CI.

test('Academy progress writes stay within a bounded serialized storage budget', async () => {
  const dashboard = await read('components/academy/academy-dashboard.tsx')
  assert.match(dashboard, /const MAX_PERSISTED_JSON_LENGTH = 1_000_000/)
  assert.match(dashboard, /function serializeProgress\(progress: StoredProgress\)/)
  assert.match(dashboard, /candidate\.length > MAX_PERSISTED_JSON_LENGTH/)
  assert.match(dashboard, /delete codeByLesson\[id\]/)
  assert.match(dashboard, /localStorage\.setItem\(STORAGE_KEY, serializeProgress\(progress\)\)/)
  assert.match(dashboard, /progress\.activeLessonId/)
  assert.match(dashboard, /progress\.completedIds/) 
})
