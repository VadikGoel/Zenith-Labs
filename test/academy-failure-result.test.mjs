import test from 'node:test'
import assert from 'node:assert/strict'
import { tracks } from '../lib/academy-data.ts'
import { verifyLessonCode } from '../lib/academy-verification.ts'

function completionFixture(track, lesson) {
  return lesson.checks.map((check) => {
    if (typeof check === 'string') return check
    if (check.kind === 'output') {
      const literal = JSON.stringify(check.value)
      return track.language === 'cpp' ? `std::cout << ${literal};` : `Console.WriteLine(${literal});`
    }
    if (check.kind === 'quoted' && check.value === '$"') return 'var label = $"Zenith";'
    return check.value
  }).join('\n')
}

test('Every active Academy failure result reports the first failed assertion and exact pass count', () => {
  const activeLessons = tracks
    .filter((track) => track.available)
    .flatMap((track) => track.modules.flatMap((module) => module.lessons.map((lesson) => ({ track, lesson }))))

  assert.ok(activeLessons.length > 0)
  for (const { track, lesson } of activeLessons) {
    const completionCode = completionFixture(track, lesson)
    const firstRequirement = typeof lesson.checks[0] === 'string' ? lesson.checks[0] : lesson.checks[0].value
    const nearMiss = completionCode.replace(firstRequirement, '__ZENITH_REQUIRED_ASSERTION_REMOVED__')
    assert.notEqual(nearMiss, completionCode, `${track.id}/${lesson.id} first assertion must be represented in its completion fixture`)

    const result = verifyLessonCode(lesson, nearMiss)
    const firstFailedIndex = result.passedChecks.findIndex((passed) => !passed)
    const passedCount = result.passedChecks.filter(Boolean).length

    assert.equal(result.complete, false, `${track.id}/${lesson.id} near-miss must remain incomplete`)
    assert.equal(result.failedIndex, firstFailedIndex, `${track.id}/${lesson.id} must identify the first failed assertion`)
    assert.equal(result.passedCount, passedCount, `${track.id}/${lesson.id} must report the exact number of passing assertions`)
    assert.ok(result.failedIndex >= 0, `${track.id}/${lesson.id} must expose a failed assertion for an incomplete submission`)
  }
})

test('Academy verifier fails closed for a lesson with no checks', () => {
  const result = verifyLessonCode({ checks: [] }, 'Console.WriteLine("ready");')
  assert.deepEqual(result, {
    passedChecks: [],
    passedCount: 0,
    complete: false,
    failedIndex: 0,
  })
})
