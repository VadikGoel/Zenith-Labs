import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

async function read(path) {
  return JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'))
}

function versionParts(version) {
  return version.replace(/^[^0-9]*/, '').split('.').map(Number)
}

function atLeast(version, minimum) {
  const actual = versionParts(version)
  const floor = versionParts(minimum)
  for (let index = 0; index < floor.length; index += 1) {
    const a = actual[index] ?? 0
    const b = floor[index] ?? 0
    if (a !== b) return a > b
  }
  return true
}

test('security-critical Next.js dependency remains on the patched 16.3.3 floor', async () => {
  const packageJson = await read('package.json')
  const lockfile = await read('package-lock.json')

  const declared = packageJson.dependencies?.next
  const installed = lockfile.packages?.['node_modules/next']?.version

  assert.ok(declared, 'Next.js must remain an explicit production dependency')
  assert.equal(installed, '16.3.3')
  assert.ok(atLeast(installed, '16.3.3'))
})

test('React stays above the patched React Server Components security floor', async () => {
  const packageJson = await read('package.json')
  const lockfile = await read('package-lock.json')

  const declaredReact = packageJson.dependencies?.react
  const installedReact = lockfile.packages?.['node_modules/react']?.version

  assert.ok(declaredReact, 'React must remain an explicit production dependency')
  assert.ok(installedReact, 'React must be pinned in the npm lockfile')
  assert.ok(atLeast(installedReact, '19.2.1'), `React ${installedReact} is below the patched 19.2.1 security floor`)
})
