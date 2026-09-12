import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import vm from 'node:vm'
import ts from 'typescript'

const root = resolve(import.meta.dirname, '..')

async function loadVerifier() {
  const source = await readFile(resolve(root, 'lib/academy-verification.ts'), 'utf8')
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const module = { exports: {} }
  const context = vm.createContext({ module, exports: module.exports })
  vm.runInContext(transpiled, context, { filename: 'academy-verification.ts' })
  return module.exports.verifyLessonCode
}

const lesson = {
  id: 'behavior-test',
  title: 'Behavior test',
  checks: ['int main', 'cout << "Hello"', 'return 0'],
}

function checks(result) {
  return Array.from(result.passedChecks)
}

test('verifier reports complete only when every requirement is present in executable source', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode(lesson, `// int main\nint main() {\n  cout << "Hello";\n  return 0;\n}`)
  assert.deepEqual(checks(result), [true, true, true])
  assert.equal(result.passedCount, 3)
  assert.equal(result.complete, true)
  assert.equal(result.failedIndex, -1)
})

test('verifier identifies the first missing requirement and preserves later failures', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode(lesson, `int main() {\n  cout << "Hello";\n}`)
  assert.deepEqual(checks(result), [true, true, false])
  assert.equal(result.passedCount, 2)
  assert.equal(result.complete, false)
  assert.equal(result.failedIndex, 2)
})

test('verifier ignores requirements that appear only inside comments', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode({ ...lesson, checks: ['int main', 'return 0'] }, `int main() {\n  // return 0\n}`)
  assert.deepEqual(checks(result), [true, false])
  assert.equal(result.passedCount, 1)
  assert.equal(result.complete, false)
  assert.equal(result.failedIndex, 1)
})

test('verifier does not satisfy structural checks from inside string literals', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode({ ...lesson, checks: ['std::cout'] }, 'const char* note = "std::cout";')
  assert.deepEqual(checks(result), [false])
  assert.equal(result.passedCount, 0)
  assert.equal(result.complete, false)
  assert.equal(result.failedIndex, 0)
})

test('verifier does not satisfy quoted expressions from inside a larger string literal', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode({ ...lesson, checks: ['cout << "Hello"'] }, 'const char* note = "cout << \\"Hello\\"";')
  assert.deepEqual(checks(result), [false])
  assert.equal(result.passedCount, 0)
  assert.equal(result.complete, false)
  assert.equal(result.failedIndex, 0)
})

test('verifier still supports requirements that intentionally include quoted output', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode({ ...lesson, checks: ['cout << "Hello"'] }, 'cout << "Hello";')
  assert.deepEqual(checks(result), [true])
  assert.equal(result.passedCount, 1)
  assert.equal(result.complete, true)
  assert.equal(result.failedIndex, -1)
})

test('verifier rejects blank requirements', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode({ checks: ['   '] }, 'anything')
  assert.deepEqual(checks(result), [false])
  assert.equal(result.passedCount, 0)
  assert.equal(result.complete, false)
  assert.equal(result.failedIndex, 0)
})

test('verifier fails closed when a malformed lesson has no checks', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode({ checks: [] }, 'anything that would otherwise look valid')
  assert.deepEqual(checks(result), [])
  assert.equal(result.passedCount, 0)
  assert.equal(result.complete, false)
  assert.equal(result.failedIndex, 0)
})
