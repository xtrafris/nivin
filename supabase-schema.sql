-- Voer dit één keer uit in de Supabase SQL Editor (Project → SQL Editor → New query)
-- om de tabel aan te maken waar je hele wijnkelder in wordt bewaard.

create table if not exists cellar (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Row Level Security aanzetten (Supabase-standaard).
alter table cellar enable row level security;

-- Omdat dit een persoonlijke app is zonder inlogsysteem, staat deze policy
-- lezen en schrijven toe voor iedereen die de (publieke) anon-sleutel heeft.
-- Dat is precies dezelfde sleutel die in je Vercel-omgevingsvariabelen staat,
-- dus alleen jouw eigen app gebruikt 'm in de praktijk. Wil je dit later
-- steviger afschermen, dan voeg je een login/auth-systeem toe en verfijn je
-- deze policy naar "alleen de eigenaar".
create policy "Iedereen met de anon-sleutel mag lezen en schrijven"
  on cellar
  for all
  using (true)
  with check (true);
