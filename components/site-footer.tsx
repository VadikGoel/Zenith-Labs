import Link from 'next/link'

const footerColumns = [
  {
    heading: 'Studio',
    links: [
      { label: 'Home', href: '/' },
      { label: 'About', href: '/about' },
      { label: 'Services', href: '/services' },
    ],
  },
  {
    heading: 'Learn',
    links: [
      { label: 'Zenith Academy', href: '/academy' },
      { label: 'C# Track', href: '/academy' },
      { label: 'C++ Track', href: '/academy' },
    ],
  },
  {
    heading: 'Connect',
    links: [
      { label: 'Contact', href: '/contact' },
      { label: 'Project Planning', href: '/contact' },
      { label: 'Careers', href: '/about' },
    ],
  },
]

const techStack = ['Next.js', 'React', 'Tailwind', 'Python', 'NVIDIA NIM', 'TypeScript']

const pipelineNodes = [
  { name: 'llama-3.3-nemotron', region: 'us-east' },
  { name: 'nv-embedqa-e5', region: 'us-west' },
  { name: 'vista-3d-nim', region: 'eu-central' },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-white/5 bg-[#060608]">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-20">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="flex size-7 items-center justify-center rounded-md border border-primary/40 bg-primary/10 font-mono text-sm font-bold text-primary"
              >
                Z
              </span>
              <span className="text-sm font-semibold tracking-tighter">Zenith Labs</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground text-pretty">
              An elite AI-powered digital engineering studio. We wire generative
              infrastructure into consumer-grade experiences.
            </p>
            {/* Tech stack badges */}
            <ul className="mt-6 flex flex-wrap gap-2">
              {techStack.map((tech) => (
                <li
                  key={tech}
                  className="rounded-full border border-white/5 bg-neutral-900/40 px-3 py-1 font-mono text-xs text-muted-foreground"
                >
                  {tech}
                </li>
              ))}
            </ul>
          </div>

          {/* Structured links */}
          {footerColumns.map((col) => (
            <div key={col.heading}>
              <h3 className="text-xs font-semibold uppercase tracking-tight text-muted-foreground">
                {col.heading}
              </h3>
              <ul className="mt-4 flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm tracking-tight text-foreground/70 transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* NVIDIA NIM API Pipeline Status Indicator */}
        <div className="mt-14 rounded-xl border border-white/5 bg-neutral-900/40 p-5 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-success animate-zenith-blip"
              />
              <p className="font-mono text-xs uppercase tracking-tight text-foreground/80">
                NVIDIA NIM API Pipeline — All Systems Operational
              </p>
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {pipelineNodes.map((node) => (
                <li key={node.name} className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="size-1.5 rounded-full bg-success animate-zenith-blip"
                  />
                  <span className="font-mono text-xs text-muted-foreground">
                    {node.name}
                    <span className="text-muted-foreground/50"> · {node.region}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-white/5 pt-8 md:flex-row md:items-center">
          <p className="text-xs text-muted-foreground">
            © 2026 Zenith Labs. Engineering the Autonomous Web.
          </p>
          <p className="font-mono text-xs text-muted-foreground/60">
            build v4.2.1 — edge runtime
          </p>
        </div>
      </div>
    </footer>
  )
}
