import test from 'node:test'
import assert from 'node:assert/strict'
import { validateCurriculum } from '../lib/academy-curriculum.ts'

function lesson(id) {
  return {
    id,
    title: id,
    points: 1,
    instructions: ['Complete the task'],
    starterCode: '',
    checks: ['task'],
    successOutput: ['passed'],
  }
}

function track(id, modules) {
  return { id, name: id, language: 'test', available: false, modules }
}

test('Academy module identity is scoped to its track while track identity remains global', () => {
  const issues = validateCurriculum([
    track('first', [
      { id: 'shared-module', title: 'Shared module', lessons: [lesson('first-lesson')] },
    ]),
    track('second', [
      { id: 'shared-module', title: 'Shared module', lessons: [lesson('second-lesson')] },
    ]),
  ])

  assert.equal(issues.filter((issue) => issue.code === 'duplicate-module-id').length, 0)
  assert.equal(issues.filter((issue) => issue.code === 'duplicate-track-id').length, 0)
})

test('Academy module identity collision is detected within one track', () => {
  const issues = validateCurriculum([
    track('single-track', [
      { id: 'duplicate-module', title: 'First', lessons: [lesson('first')] },
      { id: 'duplicate-module', title: 'Second', lessons: [lesson('second')] },
    ]),
  ])

  assert.equal(issues.filter((issue) => issue.code === 'duplicate-module-id').length, 1)
})
