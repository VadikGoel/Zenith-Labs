import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')

async function read(path) {
  return readFile(resolve(root, path), 'utf8')
}

test('Academy workspace keeps learning instructions independent from verification checks', async () => {
  const workspace = await read('components/academy/lesson-workspace.tsx')

  assert.match(workspace, /Verification requirements/)
  assert.match(workspace, /verification\.passedCount\/\{lesson\.checks\.length\} verified/)
  assert.match(workspace, /lesson\.instructions\.map\(\(instruction, i\) => \(/)
  assert.match(workspace, /verifyLessonCode\(lesson, code\)/)
  assert.doesNotMatch(workspace, /const passedChecks = lesson\.checks\.map/)
})

test('Academy verification service owns deterministic requirement evaluation', async () => {
  const verifier = await read('lib/academy-verification.ts')

  assert.match(verifier, /export function verifyLessonCode\(lesson: Lesson, code: string\)/)
  assert.match(verifier, /lesson\.checks\.map\(\(check\) => code\.includes\(check\)\)/)
  assert.match(verifier, /passedCount: passedChecks\.filter\(Boolean\)\.length/)
  assert.match(verifier, /complete: failedIndex === -1/)
  assert.match(verifier, /failedIndex: passedChecks\.findIndex\(\(passed\) => !passed\)/)
})

test('Academy verification timer is cleaned up on unmount and completion', async () => {
  const workspace = await read('components/academy/lesson-workspace.tsx')

  assert.match(workspace, /useEffect\(\(\) => \{[\s\S]*?clearTimeout\(timeoutRef\.current\)/)
  assert.match(workspace, /timeoutRef\.current = null/)
})

test('Academy verification exposes its busy state to assistive technology', async () => {
  const workspace = await read('components/academy/lesson-workspace.tsx')

  assert.match(workspace, /disabled=\{running\}/)
  assert.match(workspace, /aria-busy=\{running\}/)
})
