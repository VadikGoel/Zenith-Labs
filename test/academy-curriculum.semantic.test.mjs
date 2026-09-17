import test from 'node:test'
import assert from 'node:assert/strict'
import { tracks } from '../lib/academy-data.ts'

function activeLessons() {
  return tracks
    .filter((track) => track.available)
    .flatMap((track) => track.modules.flatMap((module) => module.lessons.map((lesson) => ({ track, lesson }))))
}

test('Every active typed output check is represented in the lesson success output', () => {
  const lessons = activeLessons()
  assert.ok(lessons.length > 0)

  for (const { track, lesson } of lessons) {
    const expectedOutput = lesson.successOutput
      .filter((line) => !line.startsWith('VERIFICATION PASSED —'))
      .map((line) => line.trim())

    for (const check of lesson.checks) {
      if (typeof check !== 'object' || check.kind !== 'output') continue
      assert.ok(
        expectedOutput.includes(check.value.trim()),
        `${track.id}/${lesson.id} output check ${JSON.stringify(check.value)} must match a success-output line`,
      )
    }
  }
})

test('Every active typed check has kind-specific semantic invariants', () => {
  const lessons = activeLessons()
  assert.ok(lessons.length > 0)

  for (const { track, lesson } of lessons) {
    for (const check of lesson.checks) {
      assert.equal(typeof check, 'object', `${track.id}/${lesson.id} must use typed checks`)
      assert.ok(check.value.trim().length > 0, `${track.id}/${lesson.id} ${check.kind} check must have a non-empty value`)

      if (check.kind === 'quoted') {
        assert.ok(check.value.includes('"') || check.value.includes("'"), `${track.id}/${lesson.id} quoted check must contain a quote marker`)
      }

      if (check.kind === 'output') {
        assert.ok(lesson.successOutput.some((line) => line.trim() === check.value.trim()), `${track.id}/${lesson.id} output check must have a matching success-output line`)
      }
    }
  }
})
