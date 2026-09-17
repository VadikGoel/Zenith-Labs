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

async function assertInstalledFloor(lockfile, packageName, minimum) {
  const installed = lockfile.packages?.[`node_modules/${packageName}`]?.version
  assert.ok(installed, `${packageName} must be present in the npm lockfile`)
  assert.ok(atLeast(installed, minimum), `${packageName} ${installed} is below the patched ${minimum} security floor`)
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

test('audited transitive dependency floors stay above current high-severity fixes', async () => {
  const packageJson = await read('package.json')
  const lockfile = await read('package-lock.json')

  const expectedOverrides = {
    'brace-expansion': '5.0.9',
    browserslist: '4.29.0',
    'fast-uri': '3.1.7',
    'ip-address': '10.3.1',
    'js-yaml': '4.3.2',
    undici: '7.29.0',
    hono: '4.13.5',
    '@hono/node-server': '1.19.15',
    qs: '6.16.0',
  }

  for (const [packageName, minimum] of Object.entries(expectedOverrides)) {
    assert.equal(packageJson.overrides?.[packageName], minimum, `${packageName} override must stay on the audited floor`)
    await assertInstalledFloor(lockfile, packageName, minimum)
  }
})
