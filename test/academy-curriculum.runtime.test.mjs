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

function track(id, lessons, moduleId = `${id}-module`) {
  return { id, title: id, modules: [{ id: moduleId, title: moduleId, lessons }] }
}

test('Academy production curriculum passes structural integrity validation', () => {
  const issues = validateCurriculum(tracks)
  assert.deepEqual(issues, [], `Academy curriculum integrity issues:\n${JSON.stringify(issues, null, 2)}`)
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
