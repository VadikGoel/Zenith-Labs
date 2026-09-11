import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')

async function read(path) {
  return readFile(resolve(root, path), 'utf8')
}

test('Academy progression is centralized in a reusable prerequisite service', async () => {
  const progression = await read('lib/academy-progression.ts')

  assert.match(progression, /export function flattenTrackLessons\(track: Track\)/)
  assert.match(progression, /export function getLessonPrerequisiteId\(track: Track, lessonId: string\)/)
  assert.match(progression, /lessons\[index\]\?\.prerequisiteId \?\? \(index <= 0 \? null : lessons\[index - 1\]\?\.id \?\? null\)/)
  assert.match(progression, /export function isLessonUnlocked\(track: Track, lessonId: string, completedIds: Set<string>\)/)
  assert.match(progression, /completedIds\.has\(prerequisiteId\)/)
})

test('Academy syllabus consumes the centralized progression rule', async () => {
  const syllabus = await read('components/academy/syllabus-tree.tsx')

  assert.match(syllabus, /import \{ isLessonUnlocked \} from '@\/lib\/academy-progression'/)
  assert.match(syllabus, /isLessonUnlocked\(track, lesson\.id, completedIds\)/)
  assert.doesNotMatch(syllabus, /function isUnlocked\(track: Track, lessonId: string\)/)
})

test('Academy progression keeps tracks isolated and ignores unavailable tracks', async () => {
  const progression = await read('lib/academy-progression.ts')

  assert.match(progression, /for \(const track of tracks\)/)
  assert.match(progression, /if \(!track\.available\) continue/)
  assert.match(progression, /if \(!track\.available\) return false/)
  assert.match(progression, /flattenTrackLessons\(track\)/)
})

test('Academy progression gives each track first lesson no prerequisite', async () => {
  const progression = await read('lib/academy-progression.ts')

  assert.match(progression, /index <= 0 \? null : lessons\[index - 1\]\?\.id \?\? null/)
  assert.match(progression, /first lesson|index <= 0/)
})

test('Academy progression rejects unknown lesson IDs instead of unlocking them', async () => {
  const progression = await read('lib/academy-progression.ts')

  assert.match(progression, /const lesson = lessons\.find\(\(candidate\) => candidate\.id === lessonId\)/)
  assert.match(progression, /if \(!lesson\) return false/)
})

test('Academy restore sanitizes forged or stale completion state', async () => {
  const progression = await read('lib/academy-progression.ts')
  const dashboard = await read('components/academy/academy-dashboard.tsx')

  assert.match(progression, /export function sanitizeCompletedLessonIds\(tracks: Track\[\], candidateIds: Set<string>\)/)
  assert.match(progression, /if \(!candidateIds\.has\(lesson\.id\) \|\| sanitized\.has\(lesson\.id\)\) continue/)
  assert.match(progression, /localIds\.has\(prerequisiteId\) && sanitized\.has\(prerequisiteId\)/)
  assert.match(dashboard, /sanitizeCompletedLessonIds\(tracks, new Set\(saved\.completedIds \?\? \[\]\)\)/)
})

test('Academy restore respects explicit prerequisites instead of requiring unrelated earlier lessons', async () => {
  const progression = await read('lib/academy-progression.ts')

  assert.match(progression, /may allow a lesson to be completed without completing unrelated lessons/)
  assert.match(progression, /let changed = true/)
  assert.match(progression, /while \(changed\)/)
  assert.match(progression, /localIds\.has\(prerequisiteId\) && sanitized\.has\(prerequisiteId\)/)
})

test('Academy dashboard starts from the first lesson of the first available track', async () => {
  const dashboard = await read('components/academy/academy-dashboard.tsx')

  assert.match(dashboard, /const firstAvailableTrack = tracks\.find\(\(track\) => track\.available\)/)
  assert.match(dashboard, /firstAvailableTrack\?\.modules\[0\]\?\.lessons\[0\]\?\.id/)
  assert.match(dashboard, /Academy curriculum must contain an available track with at least one lesson/)
  assert.doesNotMatch(dashboard, /const firstLessonId = tracks\[0\]\.modules\[0\]\.lessons\[0\]\.id/)
})

test('Academy unlocks explicit prerequisites only within the current track', async () => {
  const progression = await read('lib/academy-progression.ts')

  assert.match(progression, /if \(prerequisiteId === null\) return true/)
  assert.match(progression, /if \(prerequisiteId === lesson\.id\) return false/)
  assert.match(progression, /if \(!lessons\.some\(\(candidate\) => candidate\.id === prerequisiteId\)\) return false/)
  assert.match(progression, /return completedIds\.has\(prerequisiteId\)/)
})

test('Academy progression fails closed when a track contains duplicate lesson IDs', async () => {
  const progression = await read('lib/academy-progression.ts')

  assert.match(progression, /function hasDuplicateLessonIds\(lessons: Lesson\[\]\): boolean/)
  assert.match(progression, /if \(hasDuplicateLessonIds\(lessons\)\) return false/)
  assert.match(progression, /if \(hasDuplicateLessonIds\(lessons\)\) continue/)
})

test('Academy progression fails closed on self-referential prerequisites', async () => {
  const progression = await read('lib/academy-progression.ts')

  assert.match(progression, /A lesson cannot unlock itself/)
  assert.match(progression, /if \(prerequisiteId === lesson\.id\) return false/)
})
