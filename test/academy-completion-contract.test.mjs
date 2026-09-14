import test from 'node:test'
import assert from 'node:assert/strict'
import { tracks } from '../lib/academy-data.ts'

test('every active Academy lesson has a complete verification contract', () => {
  const activeLessons = tracks
    .filter((track) => track.available)
    .flatMap((track) => track.modules.flatMap((module) => module.lessons.map((lesson) => ({ track, lesson }))))

  assert.ok(activeLessons.length > 0)

  for (const { track, lesson } of activeLessons) {
    assert.ok(lesson.checks.length > 0, `${track.id}/${lesson.id} must define at least one verification check`)

    const completionLine = lesson.successOutput.at(-1) ?? ''
    assert.match(
      completionLine,
      new RegExp(`^VERIFICATION PASSED — ${lesson.checks.length}/${lesson.checks.length} assertions green$`),
      `${track.id}/${lesson.id} success output must report every configured check as verified`,
    )
  }
})

test('active Academy lesson checks use explicit kinds or supported legacy strings', () => {
  const supportedKinds = new Set(['structural', 'output', 'quoted'])

  for (const track of tracks.filter((candidate) => candidate.available)) {
    for (const module of track.modules) {
      for (const lesson of module.lessons) {
        for (const check of lesson.checks) {
          if (typeof check === 'string') {
            assert.ok(check.trim(), `${track.id}/${lesson.id} must not contain an empty legacy check`)
            continue
          }

          assert.ok(supportedKinds.has(check.kind), `${track.id}/${lesson.id} uses unsupported check kind: ${check.kind}`)
          assert.ok(check.value.trim(), `${track.id}/${lesson.id} must not contain an empty ${check.kind} check`)
        }
      }
    }
  }
})
