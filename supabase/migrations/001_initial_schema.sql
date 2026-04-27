-- =============================
-- Table: profiles
-- =============================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- =============================
-- Table: records
-- =============================
create table public.records (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null check (type in ('Ausgabe', 'Einnahme')),
  amount      numeric(12, 2) not null check (amount > 0),
  place       text not null,
  items       text not null,
  created_at  timestamptz not null default now()
);

alter table public.records enable row level security;

create policy "users can view own records"
  on public.records for select
  using (auth.uid() = user_id);

create policy "users can insert own records"
  on public.records for insert
  with check (auth.uid() = user_id);

create policy "users can update own records"
  on public.records for update
  using (auth.uid() = user_id);

create policy "users can delete own records"
  on public.records for delete
  using (auth.uid() = user_id);

create index records_user_id_idx on public.records(user_id);
create index records_created_at_idx on public.records(created_at desc);