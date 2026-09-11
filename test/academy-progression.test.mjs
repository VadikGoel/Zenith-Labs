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
  assert.match(progression, /return lessons\[index - 1\]\?\.id \?\? null/)
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

  assert.match(progression, /if \(index <= 0\) return null/)
  assert.match(progression, /first lesson in each available track has no prerequisite/)
})

test('Academy progression rejects unknown lesson IDs instead of unlocking them', async () => {
  const progression = await read('lib/academy-progression.ts')

  assert.match(progression, /if \(!lessons\.some\(\(lesson\) => lesson\.id === lessonId\)\) return false/)
})

test('Academy restore sanitizes forged or stale completion state', async () => {
  const progression = await read('lib/academy-progression.ts')
  const dashboard = await read('components/academy/academy-dashboard.tsx')

  assert.match(progression, /export function sanitizeCompletedLessonIds\(tracks: Track\[\], candidateIds: Set<string>\)/)
  assert.match(progression, /if \(!candidateIds\.has\(lesson\.id\)\) break/)
  assert.match(progression, /if \(prerequisiteId !== null && !sanitized\.has\(prerequisiteId\)\) break/)
  assert.match(dashboard, /sanitizeCompletedLessonIds\(tracks, new Set\(saved\.completedIds \?\? \[\]\)\)/)
})
