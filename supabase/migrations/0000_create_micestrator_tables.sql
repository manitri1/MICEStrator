-- MICEstrator 핵심 테이블

create table if not exists events (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  status      text default 'draft',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists phase_results (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid references events(id) on delete cascade,
  phase_number integer not null check (phase_number between 1 and 6),
  output_json  jsonb not null,
  completed_at timestamptz default now()
);

create table if not exists brand_memory (
  event_id          uuid primary key references events(id) on delete cascade,
  primary_color     text,
  secondary_colors  jsonb,
  design_mood       text,
  font_style        text,
  visual_keywords   jsonb,
  updated_at        timestamptz default now()
);

-- 인덱스
create index if not exists idx_phase_results_event_id on phase_results(event_id);
create index if not exists idx_phase_results_phase_number on phase_results(event_id, phase_number);
