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

test('Academy production tracks require explicit prerequisites for every non-root lesson', () => {
  const activeTracks = tracks.filter((track) => track.available)
  assert.ok(activeTracks.length > 0)

  for (const track of activeTracks) {
    const lessons = track.modules.flatMap((module) => module.lessons)
    assert.ok(lessons.length > 0, `${track.id} must contain lessons`)
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

test('Academy curriculum validator rejects empty tracks and modules at runtime', () => {
  const issues = validateCurriculum([
    { id: 'empty-track', name: 'Empty Track', language: 'test', available: true, modules: [] },
    { id: 'empty-module', name: 'Empty Module', language: 'test', available: true, modules: [{ id: 'empty', title: 'Empty', lessons: [] }] },
  ])
  const codes = issues.map((issue) => issue.code)
  assert.ok(codes.includes('empty-track'))
  assert.ok(codes.includes('empty-module'))
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
