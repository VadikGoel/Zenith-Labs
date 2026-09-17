import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')

async function read(path) {
  return readFile(resolve(root, path), 'utf8')
}

test('Academy workspace gates completion on verification.complete', async () => {
  const workspace = await read('components/academy/lesson-workspace.tsx')
  const completeBranchStart = workspace.indexOf('if (verification.complete) {')
  const failureBranchStart = workspace.indexOf('} else {', completeBranchStart)

  assert.notEqual(completeBranchStart, -1)
  assert.notEqual(failureBranchStart, -1)

  const completeBranch = workspace.slice(completeBranchStart, failureBranchStart)
  const failureBranch = workspace.slice(failureBranchStart, workspace.indexOf('setRunning(false)', failureBranchStart))

  assert.match(completeBranch, /onPass\(\)/)
  assert.doesNotMatch(failureBranch, /onPass\(\)/)
  assert.match(completeBranch, /requirements checked \(deterministic source analysis\)/)
})

test('Academy workspace emits an explicit pass state before completing a lesson', async () => {
  const workspace = await read('components/academy/lesson-workspace.tsx')
  const completeBranchStart = workspace.indexOf('if (verification.complete) {')
  const failureBranchStart = workspace.indexOf('} else {', completeBranchStart)
  const completeBranch = workspace.slice(completeBranchStart, failureBranchStart)

  assert.match(completeBranch, /'VERIFICATION PASSED'/)
  assert.match(completeBranch, /\.\.\.lesson\.successOutput/)
  assert.match(completeBranch, /onPass\(\)/)
  assert.ok(completeBranch.indexOf('VERIFICATION PASSED') < completeBranch.indexOf('onPass()'))
  assert.ok(completeBranch.indexOf('...lesson.successOutput') < completeBranch.indexOf('onPass()'))
  assert.match(workspace, /const verification = verifyLessonCode\(lesson, code\)/)
})

test('Academy workspace reports the first failed assertion without completing', async () => {
  const workspace = await read('components/academy/lesson-workspace.tsx')
  const failureStart = workspace.indexOf('} else {', workspace.indexOf('if (verification.complete) {'))
  const runningReset = workspace.indexOf('setRunning(false)', failureStart)
  const failureBranch = workspace.slice(failureStart, runningReset)

  assert.match(failureBranch, /const \{ failedIndex \} = verification/)
  assert.match(failureBranch, /const failedCheck = lesson\.checks\[failedIndex\]/)
  assert.match(failureBranch, /ASSERTION FAILED \[\$\{failedIndex \+ 1\}\/\$\{lesson\.checks\.length\}\]/)
  assert.match(failureBranch, /expected: \$\{formatVerificationCheck\(failedCheck\)\}/)
  assert.match(failureBranch, /VERIFICATION FAILED — review the checklist and retry/)
  assert.doesNotMatch(failureBranch, /onPass\(\)/)
})

test('Academy workspace blocks empty verification contracts before scheduling completion', async () => {
  const workspace = await read('components/academy/lesson-workspace.tsx')
  const guardStart = workspace.indexOf('if (lesson.checks.length === 0) {')
  const guardEnd = workspace.indexOf('    }', guardStart)
  const emptyCheckGuard = workspace.slice(guardStart, guardEnd)

  assert.notEqual(guardStart, -1)
  assert.match(emptyCheckGuard, /NO VERIFICATION CHECKS CONFIGURED — submission blocked/)
  assert.match(emptyCheckGuard, /setRunning\(false\)/)
  assert.match(emptyCheckGuard, /return/)
})

test('Academy workspace prevents duplicate submissions while verification is running', async () => {
  const workspace = await read('components/academy/lesson-workspace.tsx')

  assert.match(workspace, /function runVerification\(\) \{\n    if \(running\) return/)
  assert.match(workspace, /onClick=\{runVerification\}/)
  assert.match(workspace, /disabled=\{running\}/)
  assert.match(workspace, /aria-busy=\{running\}/)
})

test('Academy workspace exposes verification output as a live log', async () => {
  const workspace = await read('components/academy/lesson-workspace.tsx')
  const outputStart = workspace.indexOf('role="log"')
  const outputEnd = workspace.indexOf('</div>', outputStart)
  const output = workspace.slice(outputStart, outputEnd)

  assert.notEqual(outputStart, -1)
  assert.match(output, /role="log"/)
  assert.match(output, /aria-live="polite"/)
  assert.match(output, /aria-atomic="false"/)
  assert.match(output, /terminalLines\.map/)
})

test('Academy workspace connects editor descriptions to requirements and verification output', async () => {
  const workspace = await read('components/academy/lesson-workspace.tsx')
  const editorStart = workspace.indexOf('<textarea')
  const editorEnd = workspace.indexOf('/>', editorStart)
  const editor = workspace.slice(editorStart, editorEnd)

  assert.match(editor, /aria-describedby=\{`\$\{requirementsId\} \$\{outputId\}`\}/)
  assert.match(workspace, /id=\{requirementsId\}/)
  assert.match(workspace, /id=\{outputId\}/)
})
