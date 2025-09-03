create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  role text check (role in ('supporter','recipient')) not null default 'supporter',
  created_at timestamp with time zone default now()
);

create table if not exists public.profiles (
  id uuid primary key references public.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  bio text,
  avatar_url text,
  qr_code_url text,
  stripe_account_id text,
  created_at timestamp with time zone default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  supporter_id uuid references public.users(id) on delete set null,
  recipient_id uuid references public.users(id) on delete set null,
  amount int not null,
  type text check (type in ('one_time','subscription')) not null,
  status text check (status in ('pending','succeeded','failed')) not null default 'pending',
  stripe_id text,
  created_at timestamp with time zone default now()
);

create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  supporter_id uuid references public.users(id) on delete cascade,
  recipient_id uuid references public.users(id) on delete cascade,
  generation int not null,
  image_url text,
  created_at timestamp with time zone default now()
);

alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.payments enable row level security;
alter table public.badges enable row level security;

create policy "Users can read self" on public.users
  for select using (auth.uid() = id);
create policy "Users can insert self" on public.users
  for insert with check (auth.uid() = id);
create policy "Users update self" on public.users
  for update using (auth.uid() = id);

create policy "Profiles are public readable" on public.profiles
  for select using (true);
create policy "Owner can upsert profile" on public.profiles
  for insert with check (auth.uid() = id);
create policy "Owner update profile" on public.profiles
  for update using (auth.uid() = id);

create policy "User can read own payments" on public.payments
  for select using (auth.uid() = supporter_id or auth.uid() = recipient_id);
create policy "Webhook inserts payments" on public.payments
  for insert to anon, authenticated with check (true);
