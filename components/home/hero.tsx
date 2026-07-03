import Link from 'next/link'
import { ArrowUpRight, Terminal } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Slow floating radial glow overlay */}
      <div
        aria-hidden="true"
        className="animate-zenith-float pointer-events-none absolute -top-40 right-[-10%] size-[36rem] rounded-full bg-[radial-gradient(circle_at_center,--alpha(var(--color-primary)/14%),transparent_65%)]"
      />
      <div
        aria-hidden="true"
        className="animate-zenith-float pointer-events-none absolute -bottom-56 left-[-12%] size-[32rem] rounded-full bg-[radial-gradient(circle_at_center,--alpha(var(--color-accent)/12%),transparent_65%)]"
        style={{ animationDelay: '-7s' }}
      />

      <div className="mx-auto grid max-w-7xl gap-12 px-6 pb-24 pt-24 lg:grid-cols-[7fr_5fr] lg:items-end lg:px-10 lg:pb-32 lg:pt-36">
        {/* Asymmetrical left-heavy headline block */}
        <div>
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-4 py-1.5 font-mono text-xs tracking-tight text-primary">
            <Terminal className="size-3.5" aria-hidden="true" />
            AI-Powered Digital Engineering Studio
          </p>
          <h1 className="text-5xl font-semibold leading-[1.02] tracking-tighter text-balance md:text-7xl lg:text-8xl">
            Engineering the{' '}
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Autonomous
            </span>{' '}
            Web
          </h1>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/contact"
              className="group inline-flex items-center gap-2 rounded-md rounded-tr-3xl bg-primary px-6 py-3.5 text-sm font-medium tracking-tight text-primary-foreground shadow-[0_0_32px_-8px_var(--color-primary)] transition-all hover:shadow-[0_0_48px_-8px_var(--color-primary)] active:scale-[0.98]"
            >
              Deploy With Us
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link
              href="/academy"
              className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-neutral-900/40 px-6 py-3.5 text-sm font-medium tracking-tight text-foreground/90 backdrop-blur-md transition-all hover:border-accent/50 hover:text-accent-foreground hover:shadow-[0_0_24px_-8px_var(--color-accent)] active:scale-[0.98]"
            >
              Enter the Academy
            </Link>
          </div>
        </div>

        {/* Right meta column */}
        <div className="flex flex-col gap-6 lg:pb-2">
          <p className="max-w-md text-base leading-relaxed text-muted-foreground text-pretty">
            We fuse generative model infrastructure with obsessive interface
            craft — deploying autonomous agents, inference pipelines, and
            interfaces that feel inevitable.
          </p>
          <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-white/5 bg-white/5">
            {[
              { value: '140+', label: 'Agents shipped' },
              { value: '11ms', label: 'p50 inference' },
              { value: '99.99%', label: 'Pipeline uptime' },
            ].map((stat) => (
              <div key={stat.label} className="bg-[#060608] p-4 lg:p-5">
                <dt className="sr-only">{stat.label}</dt>
                <dd className="text-xl font-semibold tracking-tighter text-foreground lg:text-2xl">
                  {stat.value}
                </dd>
                <dd className="mt-1 text-xs text-muted-foreground">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
