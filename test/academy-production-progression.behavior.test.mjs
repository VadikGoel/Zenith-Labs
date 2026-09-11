import test from 'node:test'
import assert from 'node:assert/strict'
import { tracks } from '../lib/academy-data.ts'
import {
  getLessonPrerequisiteId,
  isLessonUnlocked,
  sanitizeCompletedLessonIds,
} from '../lib/academy-progression.ts'

const csharp = tracks.find((track) => track.id === 'csharp')

function lessonById(track, id) {
  return track?.modules.flatMap((module) => module.lessons).find((lesson) => lesson.id === id)
}

test('production C# Foundations progression follows the intended lesson chain', () => {
  assert.ok(csharp, 'C# track must exist')
  assert.equal(csharp.available, true)

  const expectedPrerequisites = [
    ['cs-hello', null],
    ['cs-vars', 'cs-hello'],
    ['cs-branching', 'cs-vars'],
    ['cs-methods', 'cs-branching'],
    ['cs-loops', 'cs-methods'],
  ]

  for (const [lessonId, prerequisiteId] of expectedPrerequisites) {
    assert.ok(lessonById(csharp, lessonId), `${lessonId} must exist in production curriculum`)
    assert.equal(getLessonPrerequisiteId(csharp, lessonId), prerequisiteId)
  }
})

test('production C# Foundations unlock and restore behavior stays sequentially safe', () => {
  assert.ok(csharp)

  assert.equal(isLessonUnlocked(csharp, 'cs-hello', new Set()), true)
  assert.equal(isLessonUnlocked(csharp, 'cs-vars', new Set()), false)
  assert.equal(isLessonUnlocked(csharp, 'cs-vars', new Set(['cs-hello'])), true)
  assert.equal(isLessonUnlocked(csharp, 'cs-branching', new Set(['cs-hello'])), false)

  const restored = sanitizeCompletedLessonIds(
    [csharp],
    new Set(['cs-hello', 'cs-vars', 'cs-branching', 'cs-methods', 'cs-loops', 'not-a-lesson']),
  )

  for (const id of ['cs-hello', 'cs-vars', 'cs-branching', 'cs-methods', 'cs-loops']) {
    assert.equal(restored.has(id), true, `${id} should restore after its prerequisites`)
  }
  assert.equal(restored.has('not-a-lesson'), false)
})
