create table if not exists learners (
  id uuid primary key default gen_random_uuid(), email text unique not null, password_hash text not null,
  display_name text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists learner_profiles (
  learner_id uuid primary key references learners(id) on delete cascade,
  age_group text, native_language text, reading_language text, computer_literacy text,
  programming_experience text, known_technologies jsonb not null default '[]', goals jsonb not null default '[]',
  domains jsonb not null default '[]', career_interests jsonb not null default '[]', learning_preferences jsonb not null default '{}',
  primary_language text, updated_at timestamptz not null default now()
);
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(), learner_id uuid not null references learners(id) on delete cascade,
  token_hash text unique not null, expires_at timestamptz not null, created_at timestamptz not null default now()
);
create table if not exists concepts (
  id text primary key, definition text not null, difficulty int not null default 1,
  prerequisites jsonb not null default '[]', relationships jsonb not null default '[]', mistakes jsonb not null default '[]'
);
create table if not exists concept_mastery (
  learner_id uuid references learners(id) on delete cascade, concept_id text references concepts(id) on delete cascade,
  state text not null default 'UNKNOWN', score numeric not null default 0, attempts int not null default 0,
  successes int not null default 0, failures int not null default 0, retention numeric not null default 0,
  transfer_ability numeric not null default 0, hint_dependence numeric not null default 0, last_practiced timestamptz,
  primary key (learner_id, concept_id)
);
create table if not exists courses (
  id text primary key, slug text unique not null, title text not null, version int not null default 1, description text not null
);
create table if not exists chapters (
  id text primary key, course_id text not null references courses(id) on delete cascade, position int not null,
  title text not null, required_coins int not null default 0, required_mastery numeric not null default 0,
  required_exercises int not null default 0, prerequisite_chapter_id text references chapters(id)
);
create table if not exists learning_events (
  id uuid primary key default gen_random_uuid(), learner_id uuid not null references learners(id) on delete cascade,
  course_id text references courses(id), activity_id text not null, event_type text not null,
  evidence jsonb not null default '{}', created_at timestamptz not null default now()
);
create table if not exists reward_ledger (
  id uuid primary key default gen_random_uuid(), learner_id uuid not null references learners(id) on delete cascade,
  course_id text references courses(id), activity_id text not null, reward_type text not null, amount int not null,
  timestamp timestamptz not null default now(), idempotency_key text unique not null, validation_source text not null,
  curriculum_version int not null default 1
);
create table if not exists course_wallets (
  learner_id uuid references learners(id) on delete cascade, course_id text references courses(id) on delete cascade,
  coins int not null default 0, primary key (learner_id, course_id)
);
create table if not exists progress (
  learner_id uuid references learners(id) on delete cascade, course_id text references courses(id) on delete cascade,
  current_chapter_id text, xp int not null default 0, primary key (learner_id, course_id)
);
create table if not exists certificates (
  id uuid primary key default gen_random_uuid(), certificate_id text unique not null, learner_id uuid not null references learners(id),
  course_id text not null references courses(id), course_version int not null, status text not null default 'VALID',
  competencies jsonb not null default '[]', issued_at timestamptz not null default now()
);
create index if not exists idx_sessions_token on sessions(token_hash);
create index if not exists idx_events_learner_time on learning_events(learner_id, created_at desc);
create index if not exists idx_rewards_learner on reward_ledger(learner_id, timestamp desc);
