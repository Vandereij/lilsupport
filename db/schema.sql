-- Users table is managed by Supabase Auth (auth.users)
-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  bio text,
  avatar_url text,
  qr_code_url text,
  stripe_account_id text,
  role text check (role in ('supporter', 'recipient')) not null default 'supporter',
  created_at timestamp with time zone default now()
);

-- Payments
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  supporter_id uuid references auth.users(id) on delete set null,
  recipient_id uuid references auth.users(id) on delete set null,
  amount integer not null,
  type text check (type in ('one_time','subscription')) not null,
  status text check (status in ('pending','succeeded','failed')) not null,
  stripe_id text not null,
  created_at timestamp with time zone default now()
);

-- Badges (stretch)
create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  supporter_id uuid references auth.users(id) on delete set null,
  recipient_id uuid references auth.users(id) on delete set null,
  generation int not null,
  image_url text,
  created_at timestamp with time zone default now()
);

-- Useful indexes
create index if not exists idx_profiles_username on public.profiles (username);
create index if not exists idx_payments_recipient on public.payments (recipient_id);
create index if not exists idx_payments_supporter on public.payments (supporter_id);
