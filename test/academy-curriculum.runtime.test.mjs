import test from 'node:test'
import assert from 'node:assert/strict'
import { tracks } from '../lib/academy-data.ts'
import { validateCurriculum } from '../lib/academy-curriculum.ts'

test('Academy production curriculum passes structural integrity validation', () => {
  const issues = validateCurriculum(tracks)
  assert.deepEqual(issues, [], `Academy curriculum integrity issues:\n${JSON.stringify(issues, null, 2)}`)
})
