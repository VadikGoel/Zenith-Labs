export type Concept={id:string;title:string;definition:string;prerequisites:string[]};
export type Lesson={id:string;title:string;conceptIds:string[];body:string;question:string;answer:string;starter:string};
export type Chapter={id:string;title:string;requiredCoins:number;requiredMastery:number;lessons:Lesson[]};
export type Course={id:string;title:string;description:string;version:number;chapters:Chapter[]};

export const concepts:Concept[]=[
{id:'variables',title:'Variables',definition:'A named binding that associates an identifier with a value according to the rules of a programming language.',prerequisites:[]},
{id:'values',title:'Values & Types',definition:'Values are runtime data; types constrain and describe the operations and representations that apply to those values.',prerequisites:['variables']},
{id:'control-flow',title:'Control Flow',definition:'The rules by which execution chooses which statements run and in what order.',prerequisites:['values']},
{id:'functions',title:'Functions',definition:'A reusable unit of behavior with inputs, execution semantics and optionally a returned result.',prerequisites:['control-flow']},
{id:'data-structures',title:'Data Structures',definition:'Organized representations of data chosen to support required operations and performance characteristics.',prerequisites:['values','functions']},
{id:'algorithms',title:'Algorithms',definition:'A precise procedure for transforming inputs into outputs under defined correctness and resource constraints.',prerequisites:['control-flow','functions','data-structures']},
];
const lessons:Lesson[]=[
{id:'l1',title:'What is a variable?',conceptIds:['variables'],body:'Before syntax, build the model: a variable is a binding. Ask what name is bound, what value is associated, and when that association changes.',question:'If x is assigned 10 and then assigned 20, what changed: the identifier, the value, or both?',answer:'The binding remains x; its associated value changes from 10 to 20.',starter:'let x = 10;\nx = 20;\nconsole.log(x);'},
{id:'l2',title:'Values and types',conceptIds:['values'],body:'Types describe the set of values and operations a program can reason about. Different languages enforce these constraints at different stages.',question:'Why can two languages represent the same idea with different type rules?',answer:'Because language semantics choose different compile-time and runtime guarantees, representations and operations.',starter:'const count: number = 3;\nconsole.log(count + 1);'},
{id:'l3',title:'Make a decision',conceptIds:['control-flow'],body:'Programs become useful when execution can branch. Predict the path before running the code.',question:'Which branch runs when score is 72?',answer:'The branch whose condition contains 72; evaluate conditions in order and stop at the first true branch.',starter:'const score = 72;\nif (score >= 80) console.log("A");\nelse console.log("Keep going");'},
{id:'l4',title:'Functions as boundaries',conceptIds:['functions'],body:'A function gives a behavior a name and defines its input/output boundary. Good boundaries reduce cognitive load.',question:'What should a function contract tell another engineer?',answer:'Its purpose, inputs, output, important side effects, failure behavior and relevant constraints.',starter:'function add(a: number, b: number) {\n  return a + b;\n}\nconsole.log(add(2, 3));'},
{id:'l5',title:'Choose a data structure',conceptIds:['data-structures'],body:'Do not choose a collection because it is popular. Start with required operations, constraints and access patterns.',question:'Why might a map be preferable to an array for key-based lookup?',answer:'A map models key-to-value lookup directly and can provide appropriate lookup performance without scanning unrelated elements.',starter:'const users = new Map([["vadik", 1]]);\nconsole.log(users.get("vadik"));'},
{id:'l6',title:'Algorithmic thinking',conceptIds:['algorithms'],body:'An algorithm is more than code. State the problem, invariant, correctness argument and resource costs before optimizing implementation.',question:'What does complexity analysis help you decide?',answer:'Whether an approach remains practical as input size and resource constraints grow.',starter:'function sum(xs: number[]) {\n  let total = 0;\n  for (const x of xs) total += x;\n  return total;\n}'},
];
export const course:Course={id:'programming-foundations',title:'Programming Foundations',version:1,description:'A concept-first path from values and control flow to algorithms and engineering judgment.',chapters:[
{id:'ch1',title:'Mental Models of Programs',requiredCoins:0,requiredMastery:0,lessons:lessons.slice(0,2)},
{id:'ch2',title:'Control & Abstraction',requiredCoins:60,requiredMastery:70,lessons:lessons.slice(2,4)},
{id:'ch3',title:'Data & Algorithms',requiredCoins:140,requiredMastery:80,lessons:lessons.slice(4,6)},
]};
export const domainCards=[['Web','HTTP · browsers · services'],['Systems','memory · processes · OS'],['AI / ML','math · models · inference'],['Security','identity · crypto · secure coding'],['Cloud / SRE','containers · scaling · reliability'],['Graphics','geometry · GPU · rendering'],['Embedded','MCUs · interrupts · drivers'],['Robotics','sensors · control · autonomy']];
