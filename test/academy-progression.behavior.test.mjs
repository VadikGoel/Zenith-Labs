import test from 'node:test'
import assert from 'node:assert/strict'
import { getLessonPrerequisiteId, isLessonUnlocked, sanitizeCompletedLessonIds, getUnlockedLessonIds } from '../lib/academy-progression.ts'

const lesson = (id, prerequisiteId) => ({
  id,
  title: id,
  points: 10,
  instructions: ['Complete the lesson'],
  starterCode: '',
  prerequisiteId,
  checks: ['answer'],
  successOutput: ['PASS'],
})

const track = (lessons, available = true) => ({
  id: 'test-track',
  name: 'Test Track',
  language: 'test',
  available,
  modules: [{ id: 'module', title: 'Module', lessons }],
})

test('progression unlocks and restores an explicit prerequisite graph by behavior', () => {
  const current = track([
    lesson('root', undefined),
    lesson('branch', 'root'),
    lesson('capstone', 'branch'),
    lesson('independent', 'root'),
  ])

  assert.equal(getLessonPrerequisiteId(current, 'root'), null)
  assert.equal(getLessonPrerequisiteId(current, 'branch'), 'root')
  assert.equal(getLessonPrerequisiteId(current, 'capstone'), 'branch')

  assert.equal(isLessonUnlocked(current, 'root', new Set()), true)
  assert.equal(isLessonUnlocked(current, 'branch', new Set()), false)
  assert.equal(isLessonUnlocked(current, 'branch', new Set(['root'])), true)
  assert.equal(isLessonUnlocked(current, 'capstone', new Set(['root'])), false)
  assert.equal(isLessonUnlocked(current, 'capstone', new Set(['root', 'branch'])), true)

  const restored = sanitizeCompletedLessonIds(
    [current],
    new Set(['root', 'branch', 'capstone', 'ghost']),
  )
  assert.deepEqual([...restored].sort(), ['branch', 'capstone', 'root'])
  assert.deepEqual(
    [...getUnlockedLessonIds([current], restored)].sort(),
    ['branch', 'capstone', 'independent', 'root'],
  )
})

test('progression remains fail-closed for malformed explicit prerequisite graphs', () => {
  const current = track([
    lesson('root', undefined),
    lesson('self', 'self'),
    lesson('missing', 'does-not-exist'),
    lesson('other', 'root'),
  ])

  assert.equal(isLessonUnlocked(current, 'self', new Set(['self'])), false)
  assert.equal(isLessonUnlocked(current, 'missing', new Set(['does-not-exist'])), false)
  assert.equal(isLessonUnlocked(current, 'other', new Set(['root'])), true)
})

test('progression preserves sequential fallback for lessons without explicit metadata', () => {
  const current = track([
    lesson('first', undefined),
    lesson('second', undefined),
    lesson('third', undefined),
  ])

  assert.equal(getLessonPrerequisiteId(current, 'first'), null)
  assert.equal(getLessonPrerequisiteId(current, 'second'), 'first')
  assert.equal(getLessonPrerequisiteId(current, 'third'), 'second')
  assert.equal(isLessonUnlocked(current, 'third', new Set(['first'])), false)
  assert.equal(isLessonUnlocked(current, 'third', new Set(['first', 'second'])), true)
})
