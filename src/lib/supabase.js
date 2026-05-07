import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ⚠️ Substitua pelas suas credenciais do painel Supabase
// Settings > API > Project URL e anon public key
const SUPABASE_URL = 'https://SEU_PROJETO.supabase.co';
const SUPABASE_ANON_KEY = 'SUA_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ──────────────────────────────────────────────
// SQL para criar as tabelas no Supabase
// Execute no SQL Editor do painel Supabase
// ──────────────────────────────────────────────
/*
-- Perfis de usuário (complementa auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  role text not null default 'user', -- 'user' | 'business'
  avatar text,
  venue_name text,
  venue_id text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Perfis visíveis por todos" on public.profiles for select using (true);
create policy "Usuário edita próprio perfil" on public.profiles for update using (auth.uid() = id);

-- Eventos
create table public.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id),
  name text not null,
  venue text not null,
  address text,
  category text,
  category_label text,
  is_live boolean default false,
  starts_at text,
  ends_at text,
  crowd_level int default 0,
  crowd_label text default 'Aguardando',
  queue_minutes int default 0,
  rating numeric default 0,
  review_count int default 0,
  checked_in_count int default 0,
  accessible boolean default false,
  accessibility_notes text,
  now_playing text,
  next_act text,
  price text,
  distance_km numeric default 0,
  gradient text[] default array['#1D9E75','#085041'],
  coupons_count int default 0,
  description text,
  age_restriction text default 'Livre',
  created_at timestamptz default now()
);
alter table public.events enable row level security;
create policy "Eventos visíveis por todos" on public.events for select using (true);
create policy "Dono cria evento" on public.events for insert with check (auth.uid() = owner_id);
create policy "Dono edita evento" on public.events for update using (auth.uid() = owner_id);

-- Cupons
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  owner_id uuid references auth.users(id),
  event_name text,
  venue text,
  type text not null,
  type_label text,
  icon text,
  title text not null,
  description text,
  conditions text,
  expires_at text,
  total_qty int not null,
  remaining_qty int not null,
  is_nearby boolean default false,
  gradient text[],
  highlight_color text,
  created_at timestamptz default now()
);
alter table public.coupons enable row level security;
create policy "Cupons visíveis por todos" on public.coupons for select using (true);
create policy "Dono cria cupom" on public.coupons for insert with check (auth.uid() = owner_id);
create policy "Dono atualiza cupom" on public.coupons for update using (auth.uid() = owner_id);

-- Resgates
create table public.redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid references public.coupons(id),
  user_id uuid references auth.users(id),
  qr_code text unique,
  redeemed_at timestamptz default now()
);
alter table public.redemptions enable row level security;
create policy "Usuário vê seus resgates" on public.redemptions for select using (auth.uid() = user_id);
create policy "Usuário resgata" on public.redemptions for insert with check (auth.uid() = user_id);

-- Feed posts
create table public.feed_posts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  event_name text,
  user_id uuid references auth.users(id),
  user_name text,
  user_initials text,
  user_color text default '#9FE1CB',
  text text not null,
  tag text,
  type text default 'geral',
  likes int default 0,
  replies int default 0,
  verified boolean default false,
  created_at timestamptz default now()
);
alter table public.feed_posts enable row level security;
create policy "Posts visíveis por todos" on public.feed_posts for select using (true);
create policy "Usuário cria post" on public.feed_posts for insert with check (auth.uid() = user_id);
create policy "Usuário edita próprio post" on public.feed_posts for update using (auth.uid() = user_id);


https://urolqcerirouztkpelld.supabase.co
sb_publishable_NihcK_P8z1KL_gJWRRBi7g_JZD8Kfq1
*/
