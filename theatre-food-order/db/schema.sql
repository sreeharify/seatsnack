-- Reel Bites: theatre food ordering — schema for Neon (Postgres)
-- Run this once in the Neon SQL editor before deploying.

create extension if not exists pgcrypto;

create table if not exists theatres (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table if not exists screens (
  id uuid primary key default gen_random_uuid(),
  theatre_id uuid not null references theatres(id) on delete cascade,
  name text not null
);

create table if not exists shows (
  id uuid primary key default gen_random_uuid(),
  screen_id uuid not null references screens(id) on delete cascade,
  movie_name text,
  show_time timestamptz not null,
  interval_time timestamptz
);

create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  theatre_id uuid not null references theatres(id) on delete cascade,
  name text not null,
  price_paise integer not null,
  is_active boolean not null default true
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number serial,
  theatre_id uuid references theatres(id),
  screen_id uuid references screens(id),
  show_id uuid references shows(id),
  seat_label text not null,
  deliver_at text not null default 'interval', -- 'now' | 'interval'
  status text not null default 'pending_payment', -- pending_payment | confirmed | preparing | ready | delivered | cancelled
  total_paise integer not null,
  razorpay_order_id text,
  razorpay_payment_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id),
  name text not null,
  price_paise integer not null,
  quantity integer not null
);

create index if not exists idx_orders_screen_status on orders (screen_id, status);
create index if not exists idx_screens_theatre on screens (theatre_id);
create index if not exists idx_menu_items_theatre on menu_items (theatre_id);
create index if not exists idx_shows_screen on shows (screen_id);
