# Zenith Learning

House of Elvara · by Vadik Goel

Zenith is an adaptive computing and software-engineering learning platform. It is designed around the principle that the learner should become capable of understanding unfamiliar technologies, debugging unfamiliar systems and building independently.

## Implemented foundation

- Premium public landing page
- Responsive application shell with mobile navigation
- Real PostgreSQL-backed registration/login/session architecture
- Server-side password hashing with Node `scrypt`
- Data-driven concept/course/chapter/lesson model
- Adaptive onboarding entry point
- Interactive Learning Lab with Monaco
- Honest execution boundary: UI does not claim code ran when no execution service is configured
- Engineering Map with GSAP transitions and lazy Three.js technical visualization
- Project, GitHub evidence and credential surfaces
- PostgreSQL schema for learner state, mastery, events, reward ledger, course wallets, progress and certificates
- Course-specific coins separated from global XP
- Vercel-ready Next.js structure with environment-variable boundaries

## Database setup

1. Create a PostgreSQL database.
2. Apply `db/schema.sql`.
3. Copy `.env.example` to `.env.local` and configure `DATABASE_URL`.
4. Install dependencies with `npm install`.
5. Run `npm run dev`.

The authentication routes fail closed with a clear configuration error when the database is unavailable; they do not silently switch to fake accounts.

## Execution service

Actual learner code must execute outside the privileged Next.js process. Configure `EXECUTION_SERVICE_URL` and `EXECUTION_SERVICE_TOKEN` for an isolated runner that enforces CPU, memory, timeout, output, filesystem and network restrictions. Until configured, Zenith explicitly shows that execution is unavailable rather than fabricating terminal output or rewards.

## Product architecture

The long-term system follows:

`Concept → Technology → Domain → Project → Capability`

and the learning loop:

`Question → Concept → Mental Model → Explanation → Prediction → Experiment → Code → Execute → Observe → Debug → Understand → Apply → Transfer → Master`

The 200-point product specification in `text.pdf` remains the source of truth for the broader roadmap. The implementation order is deliberately layered so the initial vertical slice can evolve into the full platform without being discarded.
