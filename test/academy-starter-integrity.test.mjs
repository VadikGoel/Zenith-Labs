import test from 'node:test'
import assert from 'node:assert/strict'
import { tracks } from '../lib/academy-data.ts'
import { verifyLessonCode } from '../lib/academy-verification.ts'

test('every active Academy lesson starts incomplete', () => {
  const activeLessons = tracks
    .filter((track) => track.available)
    .flatMap((track) => track.modules.flatMap((module) => module.lessons.map((lesson) => ({ track, lesson }))))

  assert.ok(activeLessons.length > 0)

  for (const { track, lesson } of activeLessons) {
    const result = verifyLessonCode(lesson, lesson.starterCode)
    assert.equal(
      result.complete,
      false,
      `${track.id}/${lesson.id} starter code must not already satisfy every lesson check`,
    )
    assert.ok(
      result.failedIndex >= 0 && result.failedIndex < lesson.checks.length,
      `${track.id}/${lesson.id} starter code should identify a failing check`,
    )
  }
})

test('cs-interfaces starter leaves the contract method for the learner to implement', () => {
  const lesson = tracks
    .find((track) => track.id === 'csharp')
    ?.modules.flatMap((module) => module.lessons)
    .find((candidate) => candidate.id === 'cs-interfaces')

  assert.ok(lesson)
  assert.match(lesson.starterCode, /interface IRunner/)
  assert.match(lesson.starterCode, /\/\* TODO: string Run\(\); \*\//)
  assert.equal(verifyLessonCode(lesson, lesson.starterCode).complete, false)
})
