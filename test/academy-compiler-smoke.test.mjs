import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { tracks } from '../lib/academy-data.ts'
import { verifyLessonCode } from '../lib/academy-verification.ts'

function findLesson(trackId, lessonId) {
  const track = tracks.find((candidate) => candidate.id === trackId)
  const lesson = track?.modules.flatMap((module) => module.lessons).find((candidate) => candidate.id === lessonId)
  assert.ok(lesson, `expected Academy lesson ${trackId}/${lessonId}`)
  return lesson
}

test('C# Academy hello lesson has a runtime-valid completion path', () => {
  const lesson = findLesson('csharp', 'cs-hello')
  const code = `using System;
class Program {
  static void Main() {
    Console.WriteLine("Hello, Zenith");
  }
}`

  const verification = verifyLessonCode(lesson, code)
  assert.equal(verification.complete, true)
  assert.deepEqual(verification.passedChecks, [true, true])

  const root = mkdtempSync(join(tmpdir(), 'zenith-csharp-'))
  try {
    execFileSync('dotnet', ['new', 'console', '--force', '--no-restore'], { cwd: root, stdio: 'pipe' })
    writeFileSync(join(root, 'Program.cs'), code)
    execFileSync('dotnet', ['restore', '--nologo'], { cwd: root, stdio: 'pipe' })
    const output = execFileSync('dotnet', ['run', '--no-restore', '--nologo'], { cwd: root, encoding: 'utf8' })
    assert.equal(output.trim(), 'Hello, Zenith')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('C++ Academy hello lesson has a runtime-valid completion path', () => {
  const lesson = findLesson('cpp', 'cpp-hello')
  const code = `#include <iostream>
int main() {
  std::cout << "Zenith Systems Online";
  return 0;
}`

  const verification = verifyLessonCode(lesson, code)
  assert.equal(verification.complete, true)
  assert.deepEqual(verification.passedChecks, [true, true])

  const root = mkdtempSync(join(tmpdir(), 'zenith-cpp-'))
  const source = join(root, 'main.cpp')
  const binary = join(root, 'main')
  try {
    writeFileSync(source, code)
    execFileSync('g++', ['-std=c++20', '-Wall', '-Wextra', '-Werror', source, '-o', binary], { stdio: 'pipe' })
    const output = execFileSync(binary, [], { encoding: 'utf8' })
    assert.equal(output.trim(), 'Zenith Systems Online')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
