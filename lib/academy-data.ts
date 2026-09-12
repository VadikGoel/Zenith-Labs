export type Lesson = {
  id: string
  title: string
  points: number
  instructions: string[]
  starterCode: string
  /** Optional explicit prerequisite; omitted lessons use sequential fallback during migration. */
  prerequisiteId?: string
  /** substrings that must appear in the code for verification to pass */
  checks: string[]
  successOutput: string[]
}

export type Module = {
  id: string
  title: string
  lessons: Lesson[]
}

export type Track = {
  id: string
  name: string
  language: string
  available: boolean
  modules: Module[]
}

const lesson = (id: string, title: string, points: number, instructions: string[], starterCode: string, checks: string[], output: string[], prerequisiteId?: string): Lesson => ({
  id, title, points, instructions, starterCode, checks, successOutput: output,
  ...(prerequisiteId ? { prerequisiteId } : {}),
})

export const tracks: Track[] = [
  {
    id: 'csharp', name: 'C# Mastery', language: 'csharp', available: true,
    modules: [
      {
        id: 'cs-foundations', title: 'Foundations', lessons: [
          lesson('cs-hello', 'Hello, Zenith', 10, ['Declare Program', 'Add static Main', 'Print Hello, Zenith'], `using System;\nclass Program { static void Main() { /* TODO */ } }`, ['Console.WriteLine', 'Hello, Zenith'], ['Hello, Zenith', 'VERIFICATION PASSED — 2/2 assertions green']),
          lesson('cs-vars', 'Variables & Types', 15, ['Declare an int credits', 'Declare a string studio', 'Use interpolation'], `using System;\nclass Program { static void Main() { /* TODO */ } }`, ['int credits', 'string studio', '$"'], ['Zenith grants 42 credits', 'VERIFICATION PASSED — 3/3 assertions green'], 'cs-hello'),
          lesson('cs-branching', 'Decisions & Branching', 15, ['Declare score', 'Use if/else', 'Print the result'], `using System;\nclass Program { static void Main() { int score = 80; /* TODO */ } }`, ['int score', 'if (', 'else', 'Console.WriteLine'], ['PASS', 'VERIFICATION PASSED — 4/4 assertions green'], 'cs-vars'),
          lesson('cs-methods', 'Methods & Return Values', 20, ['Define Add', 'Use two int parameters', 'Return and print the sum'], `using System;\nclass Program { /* TODO Add */ static void Main() { /* TODO */ } }`, ['static int Add', 'return', 'Add(', 'Console.WriteLine'], ['42', 'VERIFICATION PASSED — 4/4 assertions green'], 'cs-branching'),
          lesson('cs-loops', 'Loops & Repetition', 20, ['Create a loop', 'Repeat three times', 'Print each value'], `using System;\nclass Program { static void Main() { /* TODO */ } }`, ['for (', 'Console.WriteLine'], ['1', '2', '3', 'VERIFICATION PASSED — 2/2 assertions green'], 'cs-methods'),
        ],
      },
      {
        id: 'cs-types', title: 'Core Types & Collections', lessons: [
          lesson('cs-arrays', 'Arrays', 15, ['Create an int array', 'Read an element', 'Print it'], `using System;\nclass Program { static void Main() { /* TODO */ } }`, ['int[]', 'Console.WriteLine'], ['20', 'VERIFICATION PASSED — 2/2 assertions green']),
          lesson('cs-lists', 'Lists & Generics', 20, ['Create List<int>', 'Add values', 'Read a value'], `using System;\nusing System.Collections.Generic;\nclass Program { static void Main() { /* TODO */ } }`, ['List<int>', '.Add(', 'Console.WriteLine'], ['30', 'VERIFICATION PASSED — 3/3 assertions green']),
          lesson('cs-dictionary', 'Dictionaries', 20, ['Create a Dictionary', 'Store a key/value pair', 'Read by key'], `using System;\nusing System.Collections.Generic;\nclass Program { static void Main() { /* TODO */ } }`, ['Dictionary<', '[', 'Console.WriteLine'], ['Zenith', 'VERIFICATION PASSED — 3/3 assertions green']),
          lesson('cs-exceptions', 'Exceptions & Recovery', 25, ['Use try/catch', 'Handle an exception', 'Print a recovery message'], `using System;\nclass Program { static void Main() { /* TODO */ } }`, ['try', 'catch', 'Console.WriteLine'], ['Recovered', 'VERIFICATION PASSED — 3/3 assertions green']),
          lesson('cs-enums', 'Enums & Domain Values', 20, ['Define an enum', 'Select a member', 'Print the value'], `using System;\nenum Status { Draft, Ready, Live }\nclass Program { static void Main() { /* TODO */ } }`, ['enum Status', 'Status.', 'Console.WriteLine'], ['Live', 'VERIFICATION PASSED — 3/3 assertions green']),
        ],
      },
      {
        id: 'cs-oop', title: 'Object Orientation', lessons: [
          lesson('cs-class', 'Classes & Records', 20, ['Define Agent', 'Instantiate it', 'Print it'], `using System;\n// TODO: record Agent(string Name, int Version)\nclass Program { static void Main() { /* TODO */ } }`, ['record Agent', 'new Agent', 'Console.WriteLine'], ['Agent { Name = Sentinel, Version = 2 }', 'VERIFICATION PASSED — 3/3 assertions green']),
          lesson('cs-properties', 'Properties & Encapsulation', 20, ['Define a class', 'Add a property', 'Read the property'], `class Agent { /* TODO */ }`, ['class Agent', 'public string Name', 'Name'], ['Sentinel', 'VERIFICATION PASSED — 3/3 assertions green']),
          lesson('cs-inheritance', 'Inheritance & Polymorphism', 25, ['Create a base type', 'Derive a type', 'Override behavior'], `class Agent { public virtual string Run() => "base"; }\nclass Sentinel : Agent { /* TODO */ }`, ['virtual', 'class Sentinel : Agent', 'override'], ['sentinel', 'VERIFICATION PASSED — 3/3 assertions green']),
          lesson('cs-interfaces', 'Interfaces & Contracts', 25, ['Define an interface', 'Implement it', 'Call the contract'], `interface IRunner { string Run(); }\nclass Agent { /* TODO */ }`, ['interface IRunner', 'IRunner', 'Run()'], ['running', 'VERIFICATION PASSED — 3/3 assertions green']),
          lesson('cs-delegates', 'Delegates & Events', 25, ['Declare a delegate', 'Assign a method', 'Invoke it'], `using System;\nclass Program { delegate int Operation(int a, int b); static void Main() { /* TODO */ } }`, ['delegate', 'Operation', 'Console.WriteLine'], ['42', 'VERIFICATION PASSED — 3/3 assertions green']),
        ],
      },
      {
        id: 'cs-advanced', title: 'Advanced C#', lessons: [
          lesson('cs-linq', 'LINQ Queries', 25, ['Create a collection', 'Filter it with LINQ', 'Print the result'], `using System;\nusing System.Linq;\nclass Program { static void Main() { /* TODO */ } }`, ['using System.Linq', '.Where(', 'Console.WriteLine'], ['20', 'VERIFICATION PASSED — 3/3 assertions green']),
          lesson('cs-async', 'Async & Await', 30, ['Define an async method', 'Await a Task', 'Return a result'], `using System.Threading.Tasks;\nclass Program { /* TODO */ }`, ['async', 'await', 'Task'], ['42', 'VERIFICATION PASSED — 3/3 assertions green']),
          lesson('cs-files', 'Files & Streams', 25, ['Use a file API', 'Write text', 'Read text'], `using System.IO;\nclass Program { static void Main() { /* TODO */ } }`, ['File.WriteAllText', 'File.ReadAllText'], ['Zenith', 'VERIFICATION PASSED — 2/2 assertions green']),
          lesson('cs-generics', 'Generic Design', 30, ['Define a generic type', 'Use a type parameter', 'Instantiate it'], `class Box<T> { /* TODO */ }\nclass Program { static void Main() { /* TODO */ } }`, ['class Box<T>', 'T', 'new Box<'], ['generic ok', 'VERIFICATION PASSED — 3/3 assertions green']),
          lesson('cs-testing', 'Testing & Production Habits', 35, ['Define a deterministic unit test', 'Assert expected behavior', 'Keep the test isolated'], `using System;\nclass Program { static void Main() { /* TODO */ } }`, ['Assert', 'Expected', 'Actual'], ['PASS', 'VERIFICATION PASSED — 3/3 assertions green']),
        ],
      },
    ],
  },
  {
    id: 'cpp', name: 'C++ Systems', language: 'cpp', available: true,
    modules: [
      {
        id: 'cpp-core', title: 'Core Language', lessons: [
          lesson('cpp-hello', 'Streams & Output', 10, ['Include iostream', 'Define main', 'Print Zenith Systems Online'], `#include <iostream>\nint main() { /* TODO */ return 0; }`, ['std::cout', 'Zenith Systems Online'], ['Zenith Systems Online', 'VERIFICATION PASSED — 2/2 assertions green']),
          lesson('cpp-refs', 'References & Const', 20, ['Write boost(int&)', 'Double the value', 'Call it from main'], `#include <iostream>\n// TODO: void boost(int& power)\nint main() { int power = 100; /* TODO */ return 0; }`, ['int& power', 'boost(power)', 'std::cout'], ['power = 200', 'VERIFICATION PASSED — 3/3 assertions green'], 'cpp-hello'),
          lesson('cpp-vectors', 'Vectors & Iteration', 20, ['Include vector', 'Create vector<int>', 'Iterate and print'], `#include <iostream>\n#include <vector>\nint main() { /* TODO */ return 0; }`, ['std::vector', 'for (', 'std::cout'], ['10 20 30', 'VERIFICATION PASSED — 3/3 assertions green'], 'cpp-refs'),
          lesson('cpp-structs', 'Structs & Value Types', 15, ['Define a struct', 'Create an instance', 'Print a member'], `#include <iostream>\nstruct Agent { /* TODO */ };\nint main() { /* TODO */ return 0; }`, ['struct Agent', 'Agent', 'std::cout'], ['Sentinel', 'VERIFICATION PASSED — 3/3 assertions green'], 'cpp-vectors'),
          lesson('cpp-functions', 'Functions & Overloads', 20, ['Define a function', 'Call it', 'Demonstrate overload syntax'], `#include <iostream>\nint add(int a, int b) { return a + b; }\nint main() { /* TODO */ return 0; }`, ['int add', 'add(', 'std::cout'], ['42', 'VERIFICATION PASSED — 3/3 assertions green'], 'cpp-structs'),
        ],
      },
      {
        id: 'cpp-memory', title: 'Memory & RAII', lessons: [
          lesson('cpp-unique', 'Smart Pointers', 25, ['Include memory', 'Create unique_ptr<int>', 'Dereference it'], `#include <iostream>\n#include <memory>\nint main() { /* TODO */ return 0; }`, ['std::unique_ptr', 'std::cout'], ['7', 'VERIFICATION PASSED — 2/2 assertions green'], 'cpp-functions'),
          lesson('cpp-raii', 'RAII & Ownership', 25, ['Create a resource-owning type', 'Release in destructor', 'Use scope-based ownership'], `#include <iostream>\nclass Resource { public: Resource() { std::cout << "acquire\\n"; } ~Resource() { /* TODO */ } };\nint main() { /* TODO */ }`, ['class Resource', '~Resource()', 'Resource resource', 'std::cout'], ['acquire', 'release', 'VERIFICATION PASSED — 4/4 assertions green'], 'cpp-unique'),
          lesson('cpp-shared', 'Shared Ownership', 25, ['Use shared_ptr', 'Create an owner', 'Share the resource'], `#include <memory>\nint main() { /* TODO */ return 0; }`, ['std::shared_ptr', 'std::make_shared'], ['shared', 'VERIFICATION PASSED — 2/2 assertions green'], 'cpp-raii'),
          lesson('cpp-move', 'Move Semantics', 30, ['Define an rvalue-aware function', 'Use std::move', 'Avoid an unnecessary copy'], `#include <utility>\n#include <string>\nvoid take(std::string value) { /* TODO */ }\nint main() { /* TODO */ }`, ['std::move', 'std::string', 'take('], ['moved', 'VERIFICATION PASSED — 3/3 assertions green'], 'cpp-shared'),
          lesson('cpp-rule', 'Rule of Zero & Five', 30, ['Define ownership semantics', 'Use RAII members', 'Keep special members correct'], `#include <memory>\nclass Buffer { std::unique_ptr<int[]> data; /* TODO */ };`, ['std::unique_ptr', 'class Buffer'], ['ownership safe', 'VERIFICATION PASSED — 2/2 assertions green'], 'cpp-move'),
        ],
      },
      {
        id: 'cpp-templates', title: 'Templates & STL', lessons: [
          lesson('cpp-algorithms', 'STL Algorithms', 25, ['Include algorithm', 'Sort a vector', 'Print the result'], `#include <algorithm>\n#include <vector>\n#include <iostream>\nint main() { /* TODO */ return 0; }`, ['std::sort', 'std::vector', 'std::cout'], ['1 2 3', 'VERIFICATION PASSED — 3/3 assertions green'], 'cpp-rule'),
          lesson('cpp-maps', 'Maps & Associative Containers', 25, ['Create a map', 'Insert a key/value', 'Read the value'], `#include <map>\n#include <iostream>\nint main() { /* TODO */ return 0; }`, ['std::map', '[', 'std::cout'], ['Zenith', 'VERIFICATION PASSED — 3/3 assertions green'], 'cpp-algorithms'),
          lesson('cpp-templates', 'Function Templates', 30, ['Define a template function', 'Accept a generic value', 'Return it'], `template <typename T>\nT echo(T value) { /* TODO */ }\nint main() { /* TODO */ }`, ['template <typename T>', 'T echo', 'return'], ['42', 'VERIFICATION PASSED — 3/3 assertions green'], 'cpp-maps'),
          lesson('cpp-lambdas', 'Lambdas & Callables', 25, ['Create a lambda', 'Capture a value', 'Invoke it'], `#include <iostream>\nint main() { /* TODO */ return 0; }`, ['[', ']', 'std::cout'], ['42', 'VERIFICATION PASSED — 3/3 assertions green'], 'cpp-templates'),
          lesson('cpp-iterators', 'Iterators & Ranges', 30, ['Obtain iterators', 'Traverse a collection', 'Print values'], `#include <iostream>\n#include <vector>\nint main() { /* TODO */ return 0; }`, ['begin()', 'end()', 'std::cout'], ['10 20 30', 'VERIFICATION PASSED — 3/3 assertions green'], 'cpp-lambdas'),
        ],
      },
      {
        id: 'cpp-systems', title: 'Systems Programming', lessons: [
          lesson('cpp-errors', 'Error Handling', 25, ['Represent failure explicitly', 'Handle an error', 'Keep normal flow clear'], `#include <iostream>\n#include <stdexcept>\nint main() { /* TODO */ }`, ['try', 'catch', 'std::exception'], ['Recovered', 'VERIFICATION PASSED — 3/3 assertions green'], 'cpp-iterators'),
          lesson('cpp-files', 'File I/O', 25, ['Open a file', 'Write data', 'Read data safely'], `#include <fstream>\n#include <iostream>\nint main() { /* TODO */ }`, ['std::ofstream', 'std::ifstream'], ['Zenith', 'VERIFICATION PASSED — 2/2 assertions green'], 'cpp-errors'),
          lesson('cpp-concurrency', 'Threads & Synchronization', 35, ['Start a thread', 'Synchronize shared work', 'Join before exit'], `#include <thread>\nint main() { /* TODO */ }`, ['std::thread', 'join()', 'mutex'], ['thread complete', 'VERIFICATION PASSED — 3/3 assertions green'], 'cpp-files'),
          lesson('cpp-performance', 'Performance & Profiling', 30, ['Identify an allocation', 'Prefer appropriate value ownership', 'Measure a hot path'], `#include <chrono>\n#include <iostream>\nint main() { /* TODO */ }`, ['std::chrono', 'high_resolution_clock', 'std::cout'], ['timed', 'VERIFICATION PASSED — 3/3 assertions green'], 'cpp-concurrency'),
          lesson('cpp-production', 'Production Systems Capstone', 35, ['Combine RAII and STL', 'Handle failure', 'Produce deterministic output'], `#include <iostream>\n#include <memory>\n#include <vector>\nint main() { /* TODO */ }`, ['std::unique_ptr', 'std::vector', 'return 0'], ['SYSTEM READY', 'VERIFICATION PASSED — 3/3 assertions green'], 'cpp-performance'),
        ],
      },
    ],
  },
  { id: 'java', name: 'Java Enterprise', language: 'java', available: false, modules: [] },
  { id: 'python', name: 'Python for AI', language: 'python', available: false, modules: [] },
]

export const maxPoints = tracks
  .flatMap((t) => t.modules)
  .flatMap((m) => m.lessons)
  .reduce((sum, l) => sum + l.points, 0)
