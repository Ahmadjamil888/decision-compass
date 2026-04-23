-- ============ ROLES ============
create type public.app_role as enum ('admin', 'member');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

-- has_role security definer (avoids RLS recursion)
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- updated_at helper
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- auto-create profile + member role on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  insert into public.user_roles (user_id, role)
  values (new.id, 'member')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ DECISION THREADS ============
create table public.decision_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  source text,
  raw_thread text not null,
  decision text not null,
  alternatives jsonb not null default '[]'::jsonb,
  constraints jsonb not null default '[]'::jsonb,
  expected_outcome text,
  relations jsonb not null default '[]'::jsonb,
  confidence numeric(3,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_decision_threads_user on public.decision_threads(user_id, created_at desc);

create trigger update_decision_threads_updated_at
  before update on public.decision_threads
  for each row execute function public.update_updated_at_column();

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at_column();

-- ============ RLS ============
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.decision_threads enable row level security;

-- Profiles: any signed-in user can view; users edit their own
create policy "Profiles viewable by authenticated"
  on public.profiles for select
  to authenticated using (true);

create policy "Users update own profile"
  on public.profiles for update
  to authenticated using (auth.uid() = id);

create policy "Users insert own profile"
  on public.profiles for insert
  to authenticated with check (auth.uid() = id);

-- User roles: viewable by authenticated; only admins can change
create policy "Roles viewable by authenticated"
  on public.user_roles for select
  to authenticated using (true);

create policy "Admins manage roles"
  on public.user_roles for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Decision threads: owner CRUD; admins can view all
create policy "Users view own threads"
  on public.decision_threads for select
  to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

create policy "Users insert own threads"
  on public.decision_threads for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users update own threads"
  on public.decision_threads for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own threads"
  on public.decision_threads for delete
  to authenticated
  using (auth.uid() = user_id);