import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')

async function read(path) {
  return readFile(resolve(root, path), 'utf8')
}

test('Academy curriculum validator checks structural identity, lesson contracts, and prerequisite integrity', async () => {
  const validator = await read('lib/academy-curriculum.ts')

  assert.match(validator, /export function validateCurriculum\(tracks: Track\[\]\): CurriculumIssue\[\]/)
  assert.match(validator, /duplicate-track-id/)
  assert.match(validator, /duplicate-module-id/)
  assert.match(validator, /duplicate-lesson-id/)
  assert.match(validator, /missing-prerequisite/)
  assert.match(validator, /cross-track-prerequisite/)
  assert.match(validator, /prerequisite-cycle/)
  assert.match(validator, /forward-prerequisite/)
  assert.match(validator, /empty-instructions/)
  assert.match(validator, /empty-checks/)
  assert.match(validator, /empty-success-output/)
})

test('Academy progression uses the first-class Lesson prerequisite field', async () => {
  const progression = await read('lib/academy-progression.ts')
  const curriculum = await read('lib/academy-data.ts')

  assert.match(curriculum, /export type Lesson = \{[\s\S]*prerequisiteId\?: string/)
  assert.match(progression, /lessons\[index\]\?\.prerequisiteId/)
  assert.doesNotMatch(progression, /type LessonWithPrerequisite = Lesson & \{ prerequisiteId\?: string \}/)
  assert.match(progression, /index <= 0 \? null : lessons\[index - 1\]\?\.id/)
})

test('Academy curriculum validator rejects invalid prerequisite placement', async () => {
  const validator = await read('lib/academy-curriculum.ts')

  assert.match(validator, /code: lessonOwners\.has\(prerequisiteId\) \? 'cross-track-prerequisite' : 'missing-prerequisite'/)
  assert.match(validator, /if \(index === 0\) issues\.push\(\{ code: 'first-lesson-prerequisite'/)
  assert.match(validator, /prerequisiteIndex !== undefined && prerequisiteIndex >= index/)
  assert.match(validator, /code: 'forward-prerequisite'/)
})

test('Academy curriculum validator rejects lessons that could auto-pass without a contract', async () => {
  const validator = await read('lib/academy-curriculum.ts')

  assert.match(validator, /if \(lesson\.instructions\.length === 0\) issues\.push\(\{ code: 'empty-instructions'/)
  assert.match(validator, /if \(lesson\.checks\.length === 0\) issues\.push\(\{ code: 'empty-checks'/)
  assert.match(validator, /if \(lesson\.successOutput\.length === 0\) issues\.push\(\{ code: 'empty-success-output'/)
})
