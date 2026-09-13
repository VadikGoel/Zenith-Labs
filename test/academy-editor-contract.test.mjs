import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')

async function read(path) {
  return readFile(resolve(root, path), 'utf8')
}

test('Academy editor bounds input to the persisted code budget', async () => {
  const workspace = await read('components/academy/lesson-workspace.tsx')
  assert.match(workspace, /const MAX_SAVED_CODE_LENGTH = 100_000/)
  assert.match(workspace, /maxLength=\{100_000\}/)
})
