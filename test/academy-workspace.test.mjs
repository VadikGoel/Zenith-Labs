import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')

async function read(path) {
  return readFile(resolve(root, path), 'utf8')
}

test('Academy workspace keeps learning instructions independent from verification checks', async () => {
  const workspace = await read('components/academy/lesson-workspace.tsx')

  assert.match(workspace, /Verification requirements/)
  assert.match(workspace, /passedCount\/\{lesson\.checks\.length\} verified/)
  assert.match(workspace, /lesson\.instructions\.map\(\(instruction, i\) => \(/)
  assert.doesNotMatch(workspace, /const done = passedChecks\[i\]/)
})

test('Academy verification timer is cleaned up on unmount and completion', async () => {
  const workspace = await read('components/academy/lesson-workspace.tsx')

  assert.match(workspace, /useEffect\(\(\) => \{[\s\S]*?clearTimeout\(timeoutRef\.current\)/)
  assert.match(workspace, /timeoutRef\.current = null/)
})

test('Academy verification exposes its busy state to assistive technology', async () => {
  const workspace = await read('components/academy/lesson-workspace.tsx')

  assert.match(workspace, /disabled=\{running\}/)
  assert.match(workspace, /aria-busy=\{running\}/)
})
