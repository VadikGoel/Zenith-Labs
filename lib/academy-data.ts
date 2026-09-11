export type Lesson = {
  id: string
  title: string
  points: number
  instructions: string[]
  starterCode: string
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

export const tracks: Track[] = [
  {
    id: 'csharp',
    name: 'C# Mastery',
    language: 'csharp',
    available: true,
    modules: [
      {
        id: 'cs-basics',
        title: 'Foundations',
        lessons: [
          {
            id: 'cs-hello',
            title: 'Hello, Zenith',
            points: 10,
            instructions: ['Declare a class named Program', 'Add a static Main method', 'Print "Hello, Zenith" using Console.WriteLine'],
            starterCode: `using System;

class Program
{
    static void Main()
    {
        // TODO: print "Hello, Zenith"
    }
}`,
            checks: ['Console.WriteLine', 'Hello, Zenith'],
            successOutput: ['> dotnet run --project lesson-01', 'Hello, Zenith', '', 'VERIFICATION PASSED — 2/2 assertions green'],
          },
          {
            id: 'cs-vars',
            title: 'Variables & Types',
            points: 15,
            instructions: ['Declare an int named credits with value 42', 'Declare a string named studio set to "Zenith"', 'Print both values with string interpolation'],
            starterCode: `using System;

class Program
{
    static void Main()
    {
        // TODO: declare credits (int) and studio (string)
        // TODO: print with $"..." interpolation
    }
}`,
            checks: ['int credits', 'string studio', '$"'],
            successOutput: ['> dotnet run --project lesson-02', 'Zenith grants 42 credits', '', 'VERIFICATION PASSED — 3/3 assertions green'],
          },
          {
            id: 'cs-branching',
            title: 'Decisions & Branching',
            points: 15,
            instructions: ['Declare an int named score', 'Use an if/else statement to choose a result', 'Print the selected result with Console.WriteLine'],
            starterCode: `using System;

class Program
{
    static void Main()
    {
        int score = 80;
        // TODO: choose a result with if/else
    }
}`,
            checks: ['int score', 'if (', 'else', 'Console.WriteLine'],
            successOutput: ['> dotnet run --project lesson-03', 'PASS', '', 'VERIFICATION PASSED — 4/4 assertions green'],
          },
          {
            id: 'cs-methods',
            title: 'Methods & Return Values',
            points: 20,
            instructions: ['Define a method named Add', 'Give it two int parameters', 'Return their sum and call it from Main'],
            starterCode: `using System;

class Program
{
    // TODO: define Add

    static void Main()
    {
        // TODO: call Add and print the result
    }
}`,
            checks: ['static int Add', 'return', 'Add(', 'Console.WriteLine'],
            successOutput: ['> dotnet run --project lesson-04', '42', '', 'VERIFICATION PASSED — 4/4 assertions green'],
          },
        ],
      },
      {
        id: 'cs-oop',
        title: 'Object Orientation',
        lessons: [
          {
            id: 'cs-class',
            title: 'Classes & Records',
            points: 20,
            instructions: ['Define a record named Agent with Name and Version', 'Instantiate one Agent in Main', 'Print the record using Console.WriteLine'],
            starterCode: `using System;

// TODO: define record Agent(string Name, int Version)

class Program
{
    static void Main()
    {
        // TODO: create and print an Agent
    }
}`,
            checks: ['record Agent', 'new Agent', 'Console.WriteLine'],
            successOutput: ['> dotnet run --project lesson-05', 'Agent { Name = Sentinel, Version = 2 }', '', 'VERIFICATION PASSED — 3/3 assertions green'],
          },
        ],
      },
    ],
  },
  {
    id: 'cpp',
    name: 'C++ Systems',
    language: 'cpp',
    available: true,
    modules: [
      {
        id: 'cpp-basics',
        title: 'Core Language',
        lessons: [
          {
            id: 'cpp-hello',
            title: 'Streams & Output',
            points: 10,
            instructions: ['Include the iostream header', 'Write a main function returning int', 'Print "Zenith Systems Online" via std::cout'],
            starterCode: `#include <iostream>

int main()
{
    // TODO: print "Zenith Systems Online"
    return 0;
}`,
            checks: ['std::cout', 'Zenith Systems Online'],
            successOutput: ['> g++ -std=c++20 lesson-06.cpp && ./a.out', 'Zenith Systems Online', '', 'VERIFICATION PASSED — 2/2 assertions green'],
          },
          {
            id: 'cpp-refs',
            title: 'References & Const',
            points: 20,
            instructions: ['Write a function boost taking int& power', 'Multiply power by 2 inside the function', 'Call boost from main and print the result'],
            starterCode: `#include <iostream>

// TODO: void boost(int& power)

int main()
{
    int power = 100;
    // TODO: call boost(power) and print
    return 0;
}`,
            checks: ['int& power', 'boost(power)', 'std::cout'],
            successOutput: ['> g++ -std=c++20 lesson-07.cpp && ./a.out', 'power = 200', '', 'VERIFICATION PASSED — 3/3 assertions green'],
          },
          {
            id: 'cpp-vectors',
            title: 'Vectors & Iteration',
            points: 20,
            instructions: ['Include the vector header', 'Create a vector of integers', 'Iterate over the values and print them'],
            starterCode: `#include <iostream>
#include <vector>

int main()
{
    // TODO: create values and iterate over them
    return 0;
}`,
            checks: ['std::vector', 'for (', 'std::cout'],
            successOutput: ['> g++ -std=c++20 lesson-08.cpp && ./a.out', '10 20 30', '', 'VERIFICATION PASSED — 3/3 assertions green'],
          },
        ],
      },
      {
        id: 'cpp-mem',
        title: 'Memory & RAII',
        lessons: [
          {
            id: 'cpp-unique',
            title: 'Smart Pointers',
            points: 25,
            instructions: ['Include the memory header', 'Create a std::unique_ptr<int> holding 7', 'Dereference and print the value'],
            starterCode: `#include <iostream>
#include <memory>

int main()
{
    // TODO: create unique_ptr and print *ptr
    return 0;
}`,
            checks: ['std::unique_ptr', 'std::cout'],
            successOutput: ['> g++ -std=c++20 lesson-09.cpp && ./a.out', '7', '', 'VERIFICATION PASSED — 2/2 assertions green'],
          },
          {
            id: 'cpp-raii',
            title: 'RAII & Ownership',
            points: 25,
            instructions: ['Create a local resource-owning type', 'Release the resource from its destructor', 'Construct the object in a scope and let scope end ownership'],
            starterCode: `#include <iostream>

class Resource
{
public:
    Resource() { std::cout << "acquire\\n"; }
    ~Resource() { /* TODO: release */ }
};

int main()
{
    // TODO: construct Resource in a scope
}`,
            checks: ['class Resource', '~Resource()', 'Resource resource', 'std::cout'],
            successOutput: ['> g++ -std=c++20 lesson-10.cpp && ./a.out', 'acquire', 'release', '', 'VERIFICATION PASSED — 4/4 assertions green'],
          },
        ],
      },
    ],
  },
  {
    id: 'java',
    name: 'Java Enterprise',
    language: 'java',
    available: false,
    modules: [],
  },
  {
    id: 'python',
    name: 'Python for AI',
    language: 'python',
    available: false,
    modules: [],
  },
]

export const maxPoints = tracks
  .flatMap((t) => t.modules)
  .flatMap((m) => m.lessons)
  .reduce((sum, l) => sum + l.points, 0)
