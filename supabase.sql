create table if not exists links (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  url text not null,
  manage_hash text not null,
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists clicks (
  id bigint generated always as identity primary key,
  link_id uuid not null references links(id) on delete cascade,
  created_at timestamptz not null default now(),
  country text,
  device text,
  source text
);

create index if not exists clicks_link_time on clicks (link_id, created_at);

-- Tablolara dışarıdan erişimi kapat; sadece sunucu (service key) erişir
alter table links enable row level security;
alter table clicks enable row level security;
