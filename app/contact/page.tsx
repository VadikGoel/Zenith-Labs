import type { Metadata } from 'next'
import { ContactPlanner } from '@/components/contact/contact-planner'

export const metadata: Metadata = {
  title: 'Contact — Zenith Labs',
  description:
    'Plan your project with Zenith Labs. Scope your build with our interactive budget planner and engagement tiers.',
}

export default function ContactPage() {
  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="animate-zenith-float pointer-events-none absolute -top-32 left-[-8%] size-[28rem] rounded-full bg-[radial-gradient(circle_at_center,--alpha(var(--color-accent)/10%),transparent_65%)]"
      />

      <div className="mx-auto max-w-7xl px-6 pb-28 pt-20 lg:px-10 lg:pb-36 lg:pt-28">
        <header className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-tight text-primary">
            Contact &amp; Project Planning
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tighter text-balance md:text-6xl">
            Let&apos;s scope your system
          </h1>
        </header>

        <div className="mt-14">
          <ContactPlanner />
        </div>
      </div>
    </div>
  )
}
