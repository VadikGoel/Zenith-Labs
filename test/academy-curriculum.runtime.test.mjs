import test from 'node:test'
import assert from 'node:assert/strict'
import { tracks } from '../lib/academy-data.ts'
import { validateCurriculum } from '../lib/academy-curriculum.ts'
import { verifyLessonCode } from '../lib/academy-verification.ts'

function lesson(id, prerequisiteId, overrides = {}) {
  return {
    id,
    title: id,
    points: 1,
    instructions: ['Complete the task'],
    starterCode: '',
    checks: ['task'],
    successOutput: ['passed'],
    ...(prerequisiteId ? { prerequisiteId } : {}),
    ...overrides,
  }
}

function track(id, lessons, moduleId = `${id}-module`, available = false) {
  return { id, name: id, language: 'test', available, modules: [{ id: moduleId, title: moduleId, lessons }] }
}

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

test('Academy production root lessons use explicit verification kinds', () => {
  const roots = tracks
    .filter((track) => track.available)
    .flatMap((track) => track.modules.flatMap((module) => module.lessons))
    .filter((lesson) => !lesson.prerequisiteId)

  assert.equal(roots.length, 2)
  for (const root of roots) {
    assert.equal(root.checks.length, 2, `${root.id} should keep its two verification assertions`)
    assert.ok(root.checks.every((check) => typeof check === 'object'), `${root.id} should use typed checks`)
    assert.deepEqual(root.checks.map((check) => check.kind), ['structural', 'output'])
    assert.ok(root.checks.every((check) => check.value.trim().length > 0))
  }
})

test('Academy active lessons use explicit verification kinds after curriculum migration', () => {
  const activeLessons = tracks
    .filter((track) => track.available)
    .flatMap((track) => track.modules.flatMap((module) => module.lessons))

  assert.ok(activeLessons.length > 0)
  for (const lesson of activeLessons) {
    assert.ok(lesson.checks.length > 0, `${lesson.id} should declare verification checks`)
    assert.ok(
      lesson.checks.every((check) => typeof check === 'object' && ['structural', 'output', 'quoted'].includes(check.kind)),
      `${lesson.id} should use explicit verification kinds`,
    )
  }
})

test('Every production Academy output check is satisfiable by a supported language output expression', () => {
  const outputChecks = tracks
    .filter((track) => track.available)
    .flatMap((track) => track.modules.flatMap((module) => module.lessons.map((lesson) => ({ track, lesson }))))
    .flatMap(({ track, lesson }) => lesson.checks
      .filter((check) => typeof check === 'object' && check.kind === 'output')
      .map((check) => ({ track, lesson, check })))

  assert.ok(outputChecks.length > 0)
  for (const { track, lesson, check } of outputChecks) {
    const literal = JSON.stringify(check.value)
    const code = track.language === 'cpp'
      ? `std::cout << ${literal};`
      : `Console.WriteLine(${literal});`
    const result = verifyLessonCode(lesson, code)
    assert.equal(
      result.passedChecks[lesson.checks.indexOf(check)],
      true,
      `${track.id}/${lesson.id} output check should accept its supported ${track.language} output form`,
    )
  }
})

test('Every active Academy lesson has an end-to-end completion fixture and an incomplete starter', () => {
  const activeLessons = tracks
    .filter((track) => track.available)
    .flatMap((track) => track.modules.flatMap((module) => module.lessons.map((lesson) => ({ track, lesson }))))

  assert.ok(activeLessons.length > 0)
  for (const { track, lesson } of activeLessons) {
    const completionCode = completionFixture(track, lesson)
    const completed = verifyLessonCode(lesson, completionCode)
    assert.equal(completed.complete, true, `${track.id}/${lesson.id} should have a submission that satisfies every configured check`)
    assert.deepEqual(
      completed.passedChecks,
      lesson.checks.map(() => true),
      `${track.id}/${lesson.id} completion fixture should turn every assertion green`,
    )

    const starter = verifyLessonCode(lesson, lesson.starterCode)
    assert.equal(starter.complete, false, `${track.id}/${lesson.id} starter must remain incomplete before learner work`)
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

test('Academy curriculum validator rejects empty metadata and non-positive lesson points', () => {
  const issues = validateCurriculum([
    {
      id: '',
      name: '',
      language: 'test',
      available: true,
      modules: [{ id: '', title: '', lessons: [lesson('', undefined, { title: '', points: 0 })] }],
    },
  ])
  const codes = issues.map((issue) => issue.code)
  assert.ok(codes.includes('empty-track-id'))
  assert.ok(codes.includes('empty-track-name'))
  assert.ok(codes.includes('empty-module-id'))
  assert.ok(codes.includes('empty-module-title'))
  assert.ok(codes.includes('empty-lesson-id'))
  assert.ok(codes.includes('empty-lesson-title'))
  assert.ok(codes.includes('non-positive-points'))
})

test('Academy curriculum validator rejects non-finite lesson points', () => {
  const issues = validateCurriculum([
    track('invalid-points', [
      lesson('root'),
      lesson('nan-points', 'root', { points: Number.NaN }),
      lesson('infinite-points', 'nan-points', { points: Number.POSITIVE_INFINITY }),
    ]),
  ])
  assert.equal(issues.filter((issue) => issue.code === 'non-finite-points').length, 2)
})

test('Academy curriculum validator rejects blank verification assertions', () => {
  const issues = validateCurriculum([
    track('blank-checks', [
      lesson('root', undefined, { checks: ['Console.WriteLine', '  '] }),
    ]),
  ])
  assert.equal(issues.filter((issue) => issue.code === 'empty-check-assertion').length, 1)
})

test('Academy curriculum validator rejects whitespace-only instructions and success messages', () => {
  const issues = validateCurriculum([
    track('blank-content', [
      lesson('root', undefined, {
        instructions: ['Explain the task', '  '],
        successOutput: ['passed', '\t'],
      }),
    ]),
  ])
  const codes = issues.map((issue) => issue.code)
  assert.equal(codes.filter((code) => code === 'empty-instruction').length, 1)
  assert.equal(codes.filter((code) => code === 'empty-success-message').length, 1)
})
