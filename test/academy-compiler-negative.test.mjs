import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

test('C# compiler gate rejects malformed Academy source', () => {
  const root = mkdtempSync(join(tmpdir(), 'zenith-csharp-negative-'))
  try {
    execFileSync('dotnet', ['new', 'console', '--force', '--no-restore'], { cwd: root, stdio: 'pipe' })
    execFileSync('dotnet', ['restore', '--nologo'], { cwd: root, stdio: 'pipe' })
    writeFileSync(join(root, 'Program.cs'), 'using System; class Program { static void Main() { Console.WriteLine("broken") } }')
    assert.throws(() => execFileSync('dotnet', ['run', '--no-restore', '--nologo'], { cwd: root, stdio: 'pipe' }))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('C++ compiler gate rejects malformed Academy source', () => {
  const root = mkdtempSync(join(tmpdir(), 'zenith-cpp-negative-'))
  try {
    const source = join(root, 'broken.cpp')
    const binary = join(root, 'broken')
    writeFileSync(source, '#include <iostream>\nint main() { std::cout << "broken" return 0; }')
    assert.throws(() => execFileSync('g++', ['-std=c++20', '-Wall', '-Wextra', '-Werror', source, '-o', binary], { stdio: 'pipe' }))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
