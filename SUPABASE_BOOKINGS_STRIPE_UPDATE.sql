-- Stripe payment tracking updates for booking_reservations
-- Run this in Supabase SQL editor after SUPABASE_BOOKINGS_SETUP.sql

alter table public.booking_reservations
  add column if not exists payment_id text null,
  add column if not exists payment_provider text null default 'stripe',
  add column if not exists paid_at timestamptz null,
  add column if not exists payment_metadata jsonb null;

create index if not exists idx_booking_reservations_payment_id
  on public.booking_reservations(payment_id);
