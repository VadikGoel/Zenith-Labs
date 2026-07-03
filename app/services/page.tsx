import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight, Bot, Braces, Gauge, Server } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Services — Zenith Labs',
  description:
    'Autonomous agent deployments, NVIDIA NIM inference pipelines, high-end frontend engineering, and continuous evaluation from Zenith Labs.',
}

const services = [
  {
    icon: Bot,
    name: 'Agent Engineering',
    tier: 'Flagship',
    body: 'End-to-end autonomous agent systems: tool orchestration, long-term memory, guardrails, and human-in-the-loop escalation paths.',
    deliverables: ['Agent architecture', 'Tool integrations', 'Eval harness', 'Observability'],
  },
  {
    icon: Server,
    name: 'Inference Infrastructure',
    tier: 'Core',
    body: 'NVIDIA NIM microservice deployment, GPU capacity planning, and latency-budgeted pipelines that hold their p99 under load.',
    deliverables: ['NIM deployment', 'Autoscaling', 'Latency tuning', 'Cost modeling'],
  },
  {
    icon: Braces,
    name: 'Interface Engineering',
    tier: 'Core',
    body: 'Consumer-grade frontends over AI systems — streaming UX, optimistic states, and motion design that earns the premium.',
    deliverables: ['Design system', 'Streaming UI', 'Motion layer', 'Accessibility'],
  },
  {
    icon: Gauge,
    name: 'Evaluation & Reliability',
    tier: 'Continuous',
    body: 'Automated eval suites, regression gates, and production monitoring so model behavior never silently degrades.',
    deliverables: ['Eval suites', 'CI gates', 'Drift alerts', 'Incident playbooks'],
  },
]

export default function ServicesPage() {
  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="animate-zenith-float pointer-events-none absolute -top-32 right-[-8%] size-[28rem] rounded-full bg-[radial-gradient(circle_at_center,--alpha(var(--color-primary)/10%),transparent_65%)]"
      />

      <div className="mx-auto max-w-7xl px-6 pb-28 pt-20 lg:px-10 lg:pb-36 lg:pt-28">
        <header className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-tight text-primary">
            Services
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tighter text-balance md:text-6xl">
            Four disciplines, one seamless build
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground text-pretty">
            Every engagement is staffed across infrastructure, agents,
            interface, and evaluation — so nothing is lost between the model
            and the person using it.
          </p>
        </header>

        <div className="mt-16 grid gap-4 md:grid-cols-2">
          {services.map((service) => (
            <article
              key={service.name}
              className="flex flex-col rounded-2xl border border-white/5 bg-neutral-900/40 p-7 shadow-2xl backdrop-blur-md transition-colors hover:border-primary/25 lg:p-8"
            >
              <div className="flex items-center justify-between">
                <service.icon className="size-5 text-primary" aria-hidden="true" />
                <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-[10px] uppercase tracking-tight text-accent-foreground/80">
                  {service.tier}
                </span>
              </div>
              <h2 className="mt-5 text-xl font-semibold tracking-tighter">
                {service.name}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
                {service.body}
              </p>
              <ul className="mt-6 flex flex-wrap gap-2">
                {service.deliverables.map((item) => (
                  <li
                    key={item}
                    className="rounded-full border border-white/5 bg-[#060608]/60 px-3 py-1 font-mono text-xs text-muted-foreground"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-6 rounded-2xl border border-primary/20 bg-primary/5 p-8 backdrop-blur-md md:flex-row md:items-center lg:p-10">
          <div>
            <h2 className="text-2xl font-semibold tracking-tighter">
              Have a system in mind?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Scope your build with our interactive project planner.
            </p>
          </div>
          <Link
            href="/contact"
            className="group inline-flex items-center gap-2 rounded-md rounded-tr-3xl bg-primary px-6 py-3.5 text-sm font-medium tracking-tight text-primary-foreground shadow-[0_0_32px_-8px_var(--color-primary)] transition-all hover:shadow-[0_0_48px_-8px_var(--color-primary)]"
          >
            Plan a Project
            <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
