import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')

async function read(path) {
  return readFile(resolve(root, path), 'utf8')
}

test('Academy workspace calls onPass only after a complete verification result', async () => {
  const workspace = await read('components/academy/lesson-workspace.tsx')
  const completeBranch = workspace.match(/if \(verification\.complete\) \{([\s\S]*?)\} else \{/)?.[1] ?? ''
  const failureBranch = workspace.match(/\} else \{([\s\S]*?)\n      \}\n      setRunning\(false\)/)?.[1] ?? ''

  assert.match(completeBranch, /onPass\(\)/)
  assert.doesNotMatch(failureBranch, /onPass\(\)/)
  assert.match(completeBranch, /requirements checked \(deterministic source analysis\)/)
})

test('Academy workspace reports every configured assertion on successful verification', async () => {
  const workspace = await read('components/academy/lesson-workspace.tsx')
  assert.match(workspace, /if \(verification\.complete\) \{[\s\S]*\.\.\.lesson\.successOutput,[\s\S]*onPass\(\)/)
  assert.match(workspace, /const verification = verifyLessonCode\(lesson, code\)/)
})

test('Academy workspace reports the first failed assertion without completing the lesson', async () => {
  const workspace = await read('components/academy/lesson-workspace.tsx')
  assert.match(workspace, /const \{ failedIndex \} = verification/)
  assert.match(workspace, /const failedCheck = lesson\.checks\[failedIndex\]/)
  assert.match(workspace, /ASSERTION FAILED \[\$\{failedIndex \+ 1\}\/\$\{lesson\.checks\.length\}\]/)
  assert.match(workspace, /VERIFICATION FAILED — review the checklist and retry/)
  assert.match(workspace, /\} else \{[\s\S]*VERIFICATION FAILED — review the checklist and retry[\s\S]*\n      \}\n      setRunning\(false\)/)
})

test('Academy workspace blocks empty verification contracts before scheduling completion', async () => {
  const workspace = await read('components/academy/lesson-workspace.tsx')
  const emptyCheckGuard = workspace.match(/if \(lesson\.checks\.length === 0\) \{([\s\S]*?)\n    \}/)?.[1] ?? ''
  assert.match(emptyCheckGuard, /NO VERIFICATION CHECKS CONFIGURED — submission blocked/)
  assert.match(emptyCheckGuard, /setRunning\(false\)/)
  assert.match(emptyCheckGuard, /return/)
})
