import type { Metadata } from 'next'
import { BrainCircuit, Network, Palette, ShieldCheck, UserRound } from 'lucide-react'
import { StackMatrix } from '@/components/about/stack-matrix'

export const metadata: Metadata = {
  title: 'About — Zenith Labs',
  description:
    'The mission and vision behind Zenith Labs: connecting generative AI infrastructure like NVIDIA NIMs to gorgeous consumer experiences.',
}

const missionPillars = [
  {
    icon: BrainCircuit,
    title: 'Model infrastructure first',
    body: 'We treat NVIDIA NIMs and inference microservices as the foundation, not an afterthought — provisioned, tuned, and observable before a single pixel ships.',
  },
  {
    icon: Palette,
    title: 'Consumer-grade experience',
    body: 'Raw model capability means nothing without an interface people love. We engineer the last mile where intelligence meets delight.',
  },
  {
    icon: Network,
    title: 'Connected, not bolted-on',
    body: 'Agents, retrieval, and generation are woven directly into product flows — never a chat widget stapled to the corner of a page.',
  },
  {
    icon: ShieldCheck,
    title: 'Reliability as a feature',
    body: 'Evals, guardrails, and durable orchestration make our systems boring in the best way: they simply keep working.',
  },
]

const team = [
  { role: 'Chief Executive', focus: 'Strategy & Vision' },
  { role: 'Chief Technology', focus: 'Model Infrastructure' },
  { role: 'Head of Design', focus: 'Interface Craft' },
  { role: 'Head of Agents', focus: 'Autonomous Systems' },
]

export default function AboutPage() {
  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="animate-zenith-float pointer-events-none absolute -top-32 left-1/3 size-[30rem] rounded-full bg-[radial-gradient(circle_at_center,--alpha(var(--color-accent)/10%),transparent_65%)]"
      />

      <div className="mx-auto max-w-7xl px-6 pb-28 pt-20 lg:px-10 lg:pb-36 lg:pt-28">
        {/* Intro */}
        <header className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-tight text-primary">
            About the Studio
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tighter text-balance md:text-6xl">
            Intelligence deserves a beautiful body
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground text-pretty">
            Zenith Labs exists to close the gap between generative AI model
            infrastructure — NVIDIA NIMs, inference pipelines, autonomous
            agents — and the gorgeous consumer experiences those systems
            deserve to live inside.
          </p>
        </header>

        {/* Mission grid */}
        <section aria-labelledby="mission-heading" className="mt-20">
          <h2 id="mission-heading" className="sr-only">
            Core mission
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {missionPillars.map((pillar) => (
              <article
                key={pillar.title}
                className="rounded-2xl border border-white/5 bg-neutral-900/40 p-7 shadow-2xl backdrop-blur-md transition-colors hover:border-primary/25 lg:p-8"
              >
                <pillar.icon className="size-5 text-primary" aria-hidden="true" />
                <h3 className="mt-5 text-lg font-semibold tracking-tighter">
                  {pillar.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
                  {pillar.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Interactive Core Stack Matrix */}
        <section aria-labelledby="stack-heading" className="mt-20">
          <h2 id="stack-heading" className="sr-only">
            Core technology stack
          </h2>
          <StackMatrix />
        </section>

        {/* Executive team placeholders */}
        <section aria-labelledby="team-heading" className="mt-20">
          <h2
            id="team-heading"
            className="text-2xl font-semibold tracking-tighter md:text-3xl"
          >
            Leadership
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {team.map((member) => (
              <div
                key={member.role}
                className="flex flex-col items-start rounded-2xl border border-white/5 bg-neutral-900/40 p-6 shadow-2xl backdrop-blur-md"
              >
                <div className="flex size-14 items-center justify-center rounded-full border border-accent/30 bg-accent/10">
                  <UserRound className="size-6 text-accent-foreground/70" aria-hidden="true" />
                </div>
                <p className="mt-5 text-sm font-semibold tracking-tight">
                  {member.role}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{member.focus}</p>
                <span className="mt-4 rounded-full border border-white/5 bg-[#060608]/60 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-tight text-muted-foreground">
                  Announcing soon
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
