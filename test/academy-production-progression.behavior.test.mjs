import test from 'node:test'
import assert from 'node:assert/strict'
import { tracks } from '../lib/academy-data.ts'
import {
  getLessonPrerequisiteId,
  isLessonUnlocked,
  sanitizeCompletedLessonIds,
} from '../lib/academy-progression.ts'

const csharp = tracks.find((track) => track.id === 'csharp')
const cpp = tracks.find((track) => track.id === 'cpp')

function lessonById(track, id) {
  return track?.modules.flatMap((module) => module.lessons).find((lesson) => lesson.id === id)
}

function assertExplicitChain(track, expectedPrerequisites) {
  assert.ok(track, 'production track must exist')
  assert.equal(track.available, true)

  for (const [lessonId, prerequisiteId] of expectedPrerequisites) {
    const lesson = lessonById(track, lessonId)
    assert.ok(lesson, `${lessonId} must exist in production curriculum`)
    assert.equal(lesson?.prerequisiteId, prerequisiteId)
    assert.equal(getLessonPrerequisiteId(track, lessonId), prerequisiteId ?? null)
  }
}

test('production C# progression is defined by explicit prerequisite metadata', () => {
  assertExplicitChain(csharp, [
    ['cs-hello', undefined],
    ['cs-vars', 'cs-hello'],
    ['cs-branching', 'cs-vars'],
    ['cs-methods', 'cs-branching'],
    ['cs-loops', 'cs-methods'],
    ['cs-arrays', 'cs-loops'],
    ['cs-lists', 'cs-arrays'],
    ['cs-dictionary', 'cs-lists'],
    ['cs-exceptions', 'cs-dictionary'],
    ['cs-enums', 'cs-exceptions'],
    ['cs-class', 'cs-enums'],
    ['cs-properties', 'cs-class'],
    ['cs-inheritance', 'cs-properties'],
    ['cs-interfaces', 'cs-inheritance'],
    ['cs-delegates', 'cs-interfaces'],
    ['cs-linq', 'cs-delegates'],
    ['cs-async', 'cs-linq'],
    ['cs-files', 'cs-async'],
    ['cs-generics', 'cs-files'],
    ['cs-testing', 'cs-generics'],
  ])
})

test('production C++ progression is defined by explicit prerequisite metadata', () => {
  assertExplicitChain(cpp, [
    ['cpp-hello', undefined],
    ['cpp-refs', 'cpp-hello'],
    ['cpp-vectors', 'cpp-refs'],
    ['cpp-structs', 'cpp-vectors'],
    ['cpp-functions', 'cpp-structs'],
    ['cpp-unique', 'cpp-functions'],
    ['cpp-raii', 'cpp-unique'],
    ['cpp-shared', 'cpp-raii'],
    ['cpp-move', 'cpp-shared'],
    ['cpp-rule', 'cpp-move'],
    ['cpp-algorithms', 'cpp-rule'],
    ['cpp-maps', 'cpp-algorithms'],
    ['cpp-templates', 'cpp-maps'],
    ['cpp-lambdas', 'cpp-templates'],
    ['cpp-iterators', 'cpp-lambdas'],
    ['cpp-errors', 'cpp-iterators'],
    ['cpp-files', 'cpp-errors'],
    ['cpp-concurrency', 'cpp-files'],
    ['cpp-performance', 'cpp-concurrency'],
    ['cpp-production', 'cpp-performance'],
  ])
})

test('production C# progression unlock and restore behavior stays explicit', () => {
  assert.ok(csharp)

  assert.equal(isLessonUnlocked(csharp, 'cs-hello', new Set()), true)
  assert.equal(isLessonUnlocked(csharp, 'cs-vars', new Set()), false)
  assert.equal(isLessonUnlocked(csharp, 'cs-vars', new Set(['cs-hello'])), true)
  assert.equal(isLessonUnlocked(csharp, 'cs-arrays', new Set(['cs-loops'])), true)
  assert.equal(isLessonUnlocked(csharp, 'cs-arrays', new Set()), false)
  assert.equal(isLessonUnlocked(csharp, 'cs-testing', new Set(['cs-generics'])), true)
  assert.equal(isLessonUnlocked(csharp, 'cs-testing', new Set(['cs-loops'])), false)

  const restored = sanitizeCompletedLessonIds(
    [csharp],
    new Set(['cs-hello', 'cs-vars', 'cs-branching', 'cs-methods', 'cs-loops', 'not-a-lesson']),
  )

  for (const id of ['cs-hello', 'cs-vars', 'cs-branching', 'cs-methods', 'cs-loops']) {
    assert.equal(restored.has(id), true, `${id} should restore after its prerequisites`)
  }
  assert.equal(restored.has('not-a-lesson'), false)
})
