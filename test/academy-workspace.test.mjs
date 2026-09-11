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
  assert.match(workspace, /\{verification\.passedCount\}\/\{lesson\.checks\.length\} verified/)
  assert.match(workspace, /lesson\.instructions\.map\(\(instruction, i\) => \(/)
  assert.match(workspace, /verifyLessonCode\(lesson, code\)/)
  assert.doesNotMatch(workspace, /const passedChecks = lesson\.checks\.map/)
})

test('Academy workspace accurately labels deterministic verification instead of simulated compilation', async () => {
  const workspace = await read('components/academy/lesson-workspace.tsx')

  assert.match(workspace, /checking requirements\.\.\./)
  assert.match(workspace, /requirements checked \(deterministic source analysis\)/)
  assert.doesNotMatch(workspace, /compiling\.\.\. done/)
})

test('Academy verification service ignores comment-only requirements', async () => {
  const verifier = await read('lib/academy-verification.ts')

  assert.match(verifier, /function stripComments\(code: string\)/)
  assert.match(verifier, /current === '\/' && next === '\/'/)
  assert.match(verifier, /current === '\/' && next === '\*'/)
  assert.match(verifier, /const executableCode = stripComments\(code\)/)
  assert.match(verifier, /const source = requirement\.includes\('"'\) \|\| requirement\.includes\("'"\)/)
  assert.match(verifier, /source\.includes\(requirement\)/)
})

test('Academy verification preserves quoted source text while stripping comments', async () => {
  const verifier = await read('lib/academy-verification.ts')

  assert.match(verifier, /if \(quote\)/)
  assert.match(verifier, /current === '\\\\'/)
  assert.match(verifier, /current === quote/)
})

test('Academy verification rejects blank requirements instead of passing them implicitly', async () => {
  const verifier = await read('lib/academy-verification.ts')

  assert.match(verifier, /const requirement = check\.trim\(\)/)
  assert.match(verifier, /requirement\.length > 0 && executableCode\.includes\(requirement\)/)
})

test('Academy verification service owns deterministic requirement evaluation', async () => {
  const verifier = await read('lib/academy-verification.ts')

  assert.match(verifier, /export function verifyLessonCode\(lesson: Lesson, code: string\)/)
  assert.match(verifier, /lesson\.checks\.map\(\(check\) => \{[\s\S]*const requirement = check\.trim\(\)/)
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

test('Academy syllabus enforces centralized sequential progression accessibly', async () => {
  const syllabus = await read('components/academy/syllabus-tree.tsx')

  assert.match(syllabus, /import \{ isLessonUnlocked \} from '@\/lib\/academy-progression'/)
  assert.match(syllabus, /const unlocked = isLessonUnlocked\(track, lesson\.id, completedIds\)/)
  assert.doesNotMatch(syllabus, /function isUnlocked\(track: Track, lessonId: string\)/)
  assert.doesNotMatch(syllabus, /completedIds\.has\(lessons\[index - 1\]\?\.id \?\? ''\)/)
  assert.match(syllabus, /disabled=\{!unlocked\}/)
  assert.match(syllabus, /aria-disabled=\{!unlocked\}/)
  assert.match(syllabus, /Complete the previous lesson to unlock this one/)
  assert.match(syllabus, /<Lock[\s\S]*aria-hidden="true"/)
})

test('Academy restores only an unlocked lesson from persisted progress', async () => {
  const dashboard = await read('components/academy/academy-dashboard.tsx')

  assert.match(dashboard, /import \{ getUnlockedLessonIds, sanitizeCompletedLessonIds \} from '@\/lib\/academy-progression'/)
  assert.match(dashboard, /const restoredCompletedIds = sanitizeCompletedLessonIds\(tracks, new Set\(saved\.completedIds \?\? \[\]\)\)/)
  assert.match(dashboard, /const unlocked = getUnlockedLessonIds\(tracks, restoredCompletedIds\)/)
  assert.doesNotMatch(dashboard, /function getUnlockedLessonIds\(completedIds: Set<string>\)/)
  assert.match(dashboard, /unlocked\.has\(saved\.activeLessonId\)/)
  assert.match(dashboard, /const firstLessonId = firstAvailableTrack\?\.modules\[0\]\?\.lessons\[0\]\?\.id \?\? \(\(\) => \{/)
  assert.match(dashboard, /throw new Error\('Academy curriculum must contain an available track with at least one lesson'\)/)
  assert.match(dashboard, /setActiveLessonId\(firstLessonId\)/)
})
