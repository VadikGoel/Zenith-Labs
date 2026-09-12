import test from 'node:test'
import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const IGNORED_DIRECTORIES = new Set(['.git', '.next', 'node_modules'])
const TEXT_EXTENSIONS = new Set([
  '.css',
  '.js',
  '.jsx',
  '.md',
  '.mjs',
  '.ts',
  '.tsx',
  '.json',
])

async function collectTextFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRECTORIES.has(entry.name)) {
        files.push(...await collectTextFiles(join(directory, entry.name)))
      }
      continue
    }

    const extension = entry.name.includes('.') ? `.${entry.name.split('.').pop()}` : ''
    if (TEXT_EXTENSIONS.has(extension)) {
      files.push(join(directory, entry.name))
    }
  }

  return files
}

test('Zenith curriculum code does not reference freeCodeCamp content', async () => {
  const files = await collectTextFiles(ROOT)
  const references = []

  for (const file of files) {
    const content = await readFile(file, 'utf8')
    if (/freecodecamp/i.test(content)) {
      references.push(relative(ROOT, file))
    }
  }

  assert.deepEqual(
    references,
    [],
    `Remove external curriculum references from Zenith Labs: ${references.join(', ')}`,
  )
})
