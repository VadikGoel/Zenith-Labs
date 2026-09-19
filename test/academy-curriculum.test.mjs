import test from 'node:test'
import assert from 'node:assert/strict'

async function read(path) {
  const fs = await import('node:fs/promises')
  return fs.readFile(path, 'utf8')
}

test('Academy curriculum validation normalizes check values before rejecting empties', async () => {
  const validator = await read('lib/academy-curriculum.ts')

  assert.match(validator, /import \{ isCurriculumCheck, normalizeCheck \} from '\.\/academy-checks\.ts'/)
  assert.match(validator, /for \(const rawCheck of lesson\.checks as unknown\[\]\)/)
  assert.match(validator, /const check = normalizeCheck\(rawCheck\)/)
  assert.match(validator, /if \(!check\.value\) issues\.push\(\{ code: 'empty-check-assertion'/)
})

test('Academy curriculum validation rejects malformed typed check definitions', async () => {
  const validator = await read('lib/academy-curriculum.ts')

  assert.match(validator, /invalid-check-definition/)
  assert.match(validator, /!isCurriculumCheck\(rawCheck\)/)
  assert.match(validator, /import \{ isCurriculumCheck, normalizeCheck \} from '\.\/academy-checks\.ts'/)
})

test('Academy curriculum check contract keeps legacy strings and typed checks compatible', async () => {
  const checks = await read('lib/academy-checks.ts')

  assert.match(checks, /export type CurriculumCheck = string \| VerificationCheck/)
  assert.match(checks, /export function isCurriculumCheck\(value: unknown\): value is CurriculumCheck/)
  assert.match(checks, /return \(typeof value === 'string' && value\.trim\(\)\.length > 0\) \|\| isVerificationCheck\(value\)/)
})

test('Academy syllabus scopes ARIA module ids by track', async () => {
  const syllabus = await read('components/academy/syllabus-tree.tsx')

  assert.match(syllabus, /const lessonListId = `academy-\$\{track\.id\}-module-\$\{module\.id\}`/)
  assert.match(syllabus, /aria-controls=\{lessonListId\}/)
  assert.match(syllabus, /id=\{lessonListId\}/)
})
