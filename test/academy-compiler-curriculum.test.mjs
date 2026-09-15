import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { tracks } from '../lib/academy-data.ts'
import { verifyLessonCode } from '../lib/academy-verification.ts'

const fixtures = {
  csharp: {
    'cs-hello': `using System; class Program { static void Main() { Console.WriteLine("Hello, Zenith"); } }`,
    'cs-vars': `using System; class Program { static void Main() { int credits = 42; string studio = "Zenith"; Console.WriteLine($"{studio} grants {credits} credits"); } }`,
    'cs-branching': `using System; class Program { static void Main() { int score = 80; if (score >= 60) Console.WriteLine("PASS"); else Console.WriteLine("FAIL"); } }`,
    'cs-methods': `using System; class Program { static int Add(int a, int b) { return a + b; } static void Main() { Console.WriteLine(Add(20, 22)); } }`,
    'cs-loops': `using System; class Program { static void Main() { for (int i = 1; i <= 3; i++) Console.WriteLine(i); } }`,
    'cs-arrays': `using System; class Program { static void Main() { int[] values = { 10, 20, 30 }; Console.WriteLine(values[1]); } }`,
    'cs-lists': `using System; using System.Collections.Generic; class Program { static void Main() { var values = new List<int>(); values.Add(10); values.Add(30); Console.WriteLine(values[1]); } }`,
    'cs-dictionary': `using System; using System.Collections.Generic; class Program { static void Main() { var values = new Dictionary<string, string>(); values["owner"] = "Zenith"; Console.WriteLine(values["owner"]); } }`,
    'cs-exceptions': `using System; class Program { static void Main() { try { throw new InvalidOperationException(); } catch (Exception) { Console.WriteLine("Recovered"); } } }`,
    'cs-enums': `using System; enum Status { Draft, Ready, Live } class Program { static void Main() { Status status = Status.Live; Console.WriteLine(status); } }`,
    'cs-class': `using System; record Agent(string Name, int Version); class Program { static void Main() { var agent = new Agent("Sentinel", 2); Console.WriteLine(agent); } }`,
    'cs-properties': `using System; class Agent { public string Name { get; set; } = "Sentinel"; } class Program { static void Main() { var agent = new Agent(); Console.WriteLine(agent.Name); } }`,
    'cs-inheritance': `using System; class Agent { public virtual string Run() => "base"; } class Sentinel : Agent { public override string Run() => "sentinel"; } class Program { static void Main() { Console.WriteLine(new Sentinel().Run()); } }`,
    'cs-interfaces': `using System; interface IRunner { string Run(); } class Agent : IRunner { public string Run() => "running"; } class Program { static void Main() { IRunner agent = new Agent(); Console.WriteLine(agent.Run()); } }`,
    'cs-delegates': `using System; class Program { delegate int Operation(int a, int b); static int Add(int a, int b) => a + b; static void Main() { Operation operation = Add; Console.WriteLine(operation(20, 22)); } }`,
    'cs-linq': `using System; using System.Linq; class Program { static void Main() { var values = new[] { 10, 20, 30 }; var filtered = values.Where(value => value == 20); Console.WriteLine(filtered.Single()); } }`,
    'cs-async': `using System; using System.Threading.Tasks; class Program { static async Task<int> GetValue() { return await Task.FromResult(42); } static async Task Main() { Console.WriteLine(await GetValue()); } }`,
    'cs-files': `using System; using System.IO; class Program { static void Main() { string path = Path.GetTempFileName(); File.WriteAllText(path, "Zenith"); string value = File.ReadAllText(path); File.Delete(path); Console.WriteLine(value); } }`,
    'cs-generics': `using System; class Box<T> { public T Value { get; } public Box(T value) { Value = value; } } class Program { static void Main() { var box = new Box<string>("generic ok"); Console.WriteLine(box.Value); } }`,
    'cs-testing': `using System; class Program { static void Main() { int Expected = 42; int Actual = 42; bool Assert = Expected == Actual; Console.WriteLine(Assert ? "PASS" : "FAIL"); } }`,
  },
  cpp: {
    'cpp-hello': `#include <iostream>\nint main() { std::cout << "Zenith Systems Online"; return 0; }`,
    'cpp-refs': `#include <iostream>\nvoid boost(int& power) { power *= 2; }\nint main() { int power = 100; boost(power); std::cout << "power = " << power; return 0; }`,
    'cpp-vectors': `#include <iostream>\n#include <vector>\nint main() { std::vector<int> values{10,20,30}; for (int value : values) std::cout << value << ' '; return 0; }`,
    'cpp-structs': `#include <iostream>\n#include <string>\nstruct Agent { std::string name; };\nint main() { Agent agent{"Sentinel"}; std::cout << agent.name; return 0; }`,
    'cpp-functions': `#include <iostream>\nint add(int a, int b) { return a + b; }\ndouble add(double a, double b) { return a + b; }\nint main() { std::cout << add(20, 22); return 0; }`,
    'cpp-unique': `#include <iostream>\n#include <memory>\nint main() { auto value = std::make_unique<int>(7); std::cout << *value; return 0; }`,
    'cpp-raii': `#include <iostream>\nclass Resource { public: Resource() { std::cout << "acquire\\n"; } ~Resource() { std::cout << "release\\n"; } };\nint main() { Resource resource; return 0; }`,
    'cpp-shared': `#include <iostream>\n#include <memory>\nint main() { auto owner = std::make_shared<int>(7); std::shared_ptr<int> shared = owner; std::cout << "shared"; return 0; }`,
    'cpp-move': `#include <iostream>\n#include <string>\n#include <utility>\nvoid take(std::string value) { std::cout << value; }\nint main() { std::string value = "moved"; take(std::move(value)); return 0; }`,
    'cpp-rule': `#include <iostream>\n#include <memory>\nclass Buffer { std::unique_ptr<int> value; public: Buffer() : value(std::make_unique<int>(1)) {} };\nint main() { Buffer buffer; std::cout << "ownership safe"; return 0; }`,
    'cpp-algorithms': `#include <algorithm>\n#include <iostream>\n#include <vector>\nint main() { std::vector<int> values{3,1,2}; std::sort(values.begin(), values.end()); for (int value : values) std::cout << value << ' '; return 0; }`,
    'cpp-maps': `#include <iostream>\n#include <map>\n#include <string>\nint main() { std::map<std::string, std::string> values; values["owner"] = "Zenith"; std::cout << values["owner"]; return 0; }`,
    'cpp-templates': `#include <iostream>\ntemplate <typename T> T echo(T value) { return value; }\nint main() { std::cout << echo(42); return 0; }`,
    'cpp-lambdas': `#include <iostream>\nint main() { int base = 40; auto add = [base](int value) { return base + value; }; std::cout << add(2); return 0; }`,
    'cpp-iterators': `#include <iostream>\n#include <vector>\nint main() { std::vector<int> values{10,20,30}; auto first = values.begin(); auto last = values.end(); for (auto it = first; it != last; ++it) std::cout << *it << ' '; return 0; }`,
    'cpp-errors': `#include <iostream>\n#include <stdexcept>\nint main() { try { throw std::runtime_error("failure"); } catch (const std::exception&) { std::cout << "Recovered"; } return 0; }`,
    'cpp-files': `#include <cstdio>\n#include <fstream>\n#include <iostream>\n#include <string>\nint main() { std::ofstream out("zenith-test.txt"); out << "Zenith"; out.close(); std::ifstream in("zenith-test.txt"); std::string value; in >> value; in.close(); std::remove("zenith-test.txt"); std::cout << value; return 0; }`,
    'cpp-concurrency': `#include <iostream>\n#include <mutex>\n#include <thread>\nint main() { std::mutex mutex; int value = 0; std::thread worker([&] { std::lock_guard<std::mutex> lock(mutex); value = 1; }); worker.join(); std::cout << "thread complete"; return 0; }`,
    'cpp-performance': `#include <chrono>\n#include <iostream>\nint main() { auto start = std::chrono::high_resolution_clock::now(); int value = 1; (void)value; auto end = std::chrono::high_resolution_clock::now(); (void)start; (void)end; std::cout << "timed"; return 0; }`,
    'cpp-production': `#include <iostream>\n#include <memory>\n#include <vector>\nint main() { std::unique_ptr<int> value = std::make_unique<int>(1); std::vector<int> values{*value}; std::cout << "SYSTEM READY"; return 0; }`,
  },
}

function lessonsFor(trackId) {
  const track = tracks.find((candidate) => candidate.id === trackId)
  assert.ok(track, `missing Academy track ${trackId}`)
  return track.modules.flatMap((module) => module.lessons)
}

function expectedRuntimeOutput(lesson) {
  return lesson.successOutput
    .filter((line) => !line.startsWith('VERIFICATION PASSED —'))
    .join('\n')
}

function runCSharp(root, code) {
  writeFileSync(join(root, 'Program.cs'), code)
  return execFileSync('dotnet', ['run', '--no-restore', '--nologo'], { cwd: root, encoding: 'utf8' }).trim()
}

function runCpp(root, code, name) {
  const source = join(root, `${name}.cpp`)
  const binary = join(root, name)
  writeFileSync(source, code)
  execFileSync('g++', ['-std=c++20', '-Wall', '-Wextra', '-Werror', source, '-o', binary], { stdio: 'pipe' })
  return execFileSync(binary, [], { cwd: root, encoding: 'utf8' }).trim()
}

test('every active C# Academy lesson has a compiler-valid completion fixture', () => {
  const lessons = lessonsFor('csharp')
  assert.equal(lessons.length, Object.keys(fixtures.csharp).length)
  const root = mkdtempSync(join(tmpdir(), 'zenith-csharp-curriculum-'))
  try {
    execFileSync('dotnet', ['new', 'console', '--force', '--no-restore'], { cwd: root, stdio: 'pipe' })
    execFileSync('dotnet', ['restore', '--nologo'], { cwd: root, stdio: 'pipe' })
    for (const lesson of lessons) {
      const code = fixtures.csharp[lesson.id]
      assert.ok(code, `missing C# fixture for ${lesson.id}`)
      const verification = verifyLessonCode(lesson, code)
      assert.equal(verification.complete, true, `${lesson.id} should satisfy every verifier check`)
      assert.equal(runCSharp(root, code), expectedRuntimeOutput(lesson), `${lesson.id} runtime output mismatch`)
    }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('every active C++ Academy lesson has a compiler-valid completion fixture', () => {
  const lessons = lessonsFor('cpp')
  assert.equal(lessons.length, Object.keys(fixtures.cpp).length)
  const root = mkdtempSync(join(tmpdir(), 'zenith-cpp-curriculum-'))
  try {
    for (const lesson of lessons) {
      const code = fixtures.cpp[lesson.id]
      assert.ok(code, `missing C++ fixture for ${lesson.id}`)
      const verification = verifyLessonCode(lesson, code)
      assert.equal(verification.complete, true, `${lesson.id} should satisfy every verifier check`)
      assert.equal(runCpp(root, code, lesson.id), expectedRuntimeOutput(lesson), `${lesson.id} runtime output mismatch`)
    }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
