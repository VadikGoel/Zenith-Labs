import test from 'node:test'
import assert from 'node:assert/strict'
import { tracks } from '../lib/academy-data.ts'
import { validateCurriculum } from '../lib/academy-curriculum.ts'

function lesson(id, prerequisiteId) {
  return {
    id,
    title: id,
    points: 1,
    instructions: ['Complete the task'],
    starterCode: '',
    checks: ['task'],
    successOutput: ['passed'],
    ...(prerequisiteId ? { prerequisiteId } : {}),
  }
}

function track(id, lessons, moduleId = `${id}-module`, available = false) {
  return { id, name: id, language: 'test', available, modules: [{ id: moduleId, title: moduleId, lessons }] }
}

test('Academy production curriculum passes structural integrity validation', () => {
  const issues = validateCurriculum(tracks)
  assert.deepEqual(issues, [], `Academy curriculum integrity issues:\n${JSON.stringify(issues, null, 2)}`)
})

test('Academy production tracks require exactly one root and explicit prerequisites for every later lesson', () => {
  const activeTracks = tracks.filter((track) => track.available)
  assert.ok(activeTracks.length > 0)

  for (const track of activeTracks) {
    const lessons = track.modules.flatMap((module) => module.lessons)
    assert.ok(lessons.length > 0, `${track.id} must contain lessons`)
    assert.equal(lessons.filter((lesson) => !lesson.prerequisiteId).length, 1, `${track.id} must contain exactly one root lesson`)
    assert.equal(lessons[0]?.prerequisiteId, undefined, `${track.id} root lesson must not have a prerequisite`)
    for (const lesson of lessons.slice(1)) {
      assert.ok(lesson.prerequisiteId, `${track.id}/${lesson.id} must declare an explicit prerequisite`)
    }
  }
})

test('Academy curriculum validator catches implicit prerequisites in active tracks', () => {
  const issues = validateCurriculum([
    track('active', [lesson('root'), lesson('implicit')], undefined, true),
  ])
  assert.ok(issues.some((issue) => issue.code === 'implicit-prerequisite'))
})

test('Academy curriculum validator rejects active tracks with zero or multiple roots', () => {
  const issues = validateCurriculum([
    track('no-root', [lesson('first', 'missing'), lesson('second', 'first')], undefined, true),
    track('multiple-roots', [lesson('root-a'), lesson('root-b')], undefined, true),
  ])
  assert.equal(issues.filter((issue) => issue.code === 'root-count').length, 2)
})

test('Academy curriculum validator rejects empty active tracks and modules but permits unavailable placeholders', () => {
  const issues = validateCurriculum([
    { id: 'empty-active-track', name: 'Empty Active Track', language: 'test', available: true, modules: [] },
    { id: 'empty-active-module', name: 'Empty Active Module', language: 'test', available: true, modules: [{ id: 'empty', title: 'Empty', lessons: [] }] },
    { id: 'unavailable-track', name: 'Unavailable Track', language: 'test', available: false, modules: [] },
    { id: 'unavailable-module', name: 'Unavailable Module', language: 'test', available: false, modules: [{ id: 'empty', title: 'Empty', lessons: [] }] },
  ])
  const codes = issues.map((issue) => issue.code)
  assert.equal(codes.filter((code) => code === 'empty-track').length, 1)
  assert.equal(codes.filter((code) => code === 'empty-module').length, 1)
})

test('Academy curriculum validator catches broken prerequisite graphs at runtime', () => {
  const issues = validateCurriculum([
    track('broken', [
      lesson('root'),
      lesson('missing', 'does-not-exist'),
      lesson('forward', 'cycle'),
      lesson('cycle', 'forward'),
    ]),
  ])
  const codes = issues.map((issue) => issue.code)
  assert.ok(codes.includes('missing-prerequisite'))
  assert.ok(codes.includes('forward-prerequisite'))
  assert.ok(codes.includes('prerequisite-cycle'))
})

test('Academy curriculum validator distinguishes cross-track and duplicate identities at runtime', () => {
  const issues = validateCurriculum([
    track('first', [lesson('shared'), lesson('external')]),
    track('second', [lesson('shared'), lesson('cross-track', 'external')]),
  ])
  const codes = issues.map((issue) => issue.code)
  assert.ok(codes.includes('duplicate-lesson-id'))
  assert.ok(codes.includes('cross-track-prerequisite'))
})

test('Academy curriculum validator catches a prerequisite on the first lesson', () => {
  const issues = validateCurriculum([
    track('first-prerequisite', [lesson('root', 'later'), lesson('later')]),
  ])
  assert.ok(issues.some((issue) => issue.code === 'first-lesson-prerequisite'))
  assert.ok(issues.some((issue) => issue.code === 'forward-prerequisite'))
})
