-- Kraken Motorsports Booking System Setup
-- Run this once in Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.booking_slots (
  id uuid primary key default gen_random_uuid(),
  event_id uuid null references public.events(id) on delete set null,
  title text null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  is_open boolean not null default true,
  price_cents integer not null default 0,
  currency text not null default 'USD',
  capacity integer not null default 1,
  booked_count integer not null default 0,
  created_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_slots_time_check check (end_time > start_time),
  constraint booking_slots_capacity_check check (capacity >= 1),
  constraint booking_slots_booked_count_check check (booked_count >= 0)
);

create table if not exists public.booking_reservations (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.booking_slots(id) on delete cascade,
  user_id uuid null references public.profiles(id) on delete set null,
  full_name text not null,
  email text not null,
  discord text null,
  notes text null,
  is_paid boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  cancel_reason text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.booking_reservations
  add column if not exists is_paid boolean not null default false;

create index if not exists idx_booking_slots_start_time on public.booking_slots(start_time);
create index if not exists idx_booking_slots_is_open on public.booking_slots(is_open);
create index if not exists idx_booking_reservations_slot_id on public.booking_reservations(slot_id);
create index if not exists idx_booking_reservations_status on public.booking_reservations(status);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_booking_slots_touch on public.booking_slots;
create trigger trg_booking_slots_touch
before update on public.booking_slots
for each row execute function public.touch_updated_at();

drop trigger if exists trg_booking_reservations_touch on public.booking_reservations;
create trigger trg_booking_reservations_touch
before update on public.booking_reservations
for each row execute function public.touch_updated_at();

insert into public.site_settings (key, value_text)
values
  ('booking_open_hour', '10'),
  ('booking_close_hour', '22'),
  ('booking_slot_minutes', '30'),
  ('booking_default_price_cents', '2500'),
  ('booking_currency', 'USD'),
  ('booking_default_capacity', '1')
on conflict (key) do nothing;
