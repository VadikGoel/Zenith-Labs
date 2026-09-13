import test from 'node:test'
import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')

async function read(path) {
  return readFile(resolve(root, path), 'utf8')
}

test('Next.js uses one typed configuration with release-safe build validation', async () => {
  const config = await read('next.config.ts')

  await assert.rejects(
    access(resolve(root, 'next.config.mjs')),
    /ENOENT/,
  )

  assert.match(config, /import type \{ NextConfig \} from 'next'/)
  assert.match(config, /images:\s*\{\s*unoptimized: true,\s*\}/)
  assert.doesNotMatch(config, /ignoreBuildErrors\s*:\s*true/)
})
