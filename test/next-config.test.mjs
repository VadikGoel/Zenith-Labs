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
  assert.match(config, /type SecurityHeader = \{ key: string; value: string \}/)
  assert.match(config, /satisfies SecurityHeader\[\]/)
  assert.doesNotMatch(config, /\]\s+as const/)
  assert.match(config, /Strict-Transport-Security.*max-age=31536000; includeSubDomains/)
  assert.match(config, /Content-Security-Policy.*base-uri 'self'/)
  assert.match(config, /Content-Security-Policy.*object-src 'none'/)
  assert.match(config, /Content-Security-Policy.*frame-ancestors 'self'/)
  assert.doesNotMatch(config, /ignoreBuildErrors\s*:\s*true/)
})

test('Node module semantics are explicit for TypeScript Academy sources', async () => {
  const packageJson = JSON.parse(await read('package.json'))

  assert.equal(packageJson.type, 'module')
})

test('Supported Node runtime matches the Next.js 16 baseline', async () => {
  const packageJson = JSON.parse(await read('package.json'))

  assert.equal(packageJson.engines?.node, '>=20.9.0')
})

test('Next.js stays on the patched 16.3.3 security floor', async () => {
  const packageJson = JSON.parse(await read('package.json'))
  const lockfile = JSON.parse(await read('package-lock.json'))

  assert.equal(packageJson.dependencies?.next, '16.3.3')
  assert.equal(lockfile.packages?.['node_modules/next']?.version, '16.3.3')
})

test('npm lockfile root metadata matches the project manifest', async () => {
  const packageJson = JSON.parse(await read('package.json'))
  const lockfile = JSON.parse(await read('package-lock.json'))

  assert.equal(lockfile.name, packageJson.name)
  assert.equal(lockfile.version, packageJson.version)
  assert.equal(lockfile.packages?.['']?.name, packageJson.name)
  assert.equal(lockfile.packages?.['']?.version, packageJson.version)
})
