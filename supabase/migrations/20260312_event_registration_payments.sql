-- Enable payments for event registrations (Option B)
-- Run this on your Supabase database.

begin;

-- 1) Allow payments.booking_id to be nullable (so a payment can belong to an event registration)
alter table public.payments
  alter column booking_id drop not null;

-- 2) Add event_registration_id FK
alter table public.payments
  add column if not exists event_registration_id uuid;

alter table public.payments
  add constraint payments_event_registration_id_fkey
  foreign key (event_registration_id)
  references public.event_registrations(id)
  on delete cascade;

create index if not exists idx_payments_event_registration_id
  on public.payments(event_registration_id);

-- 3) Enforce XOR: exactly one of booking_id or event_registration_id must be set
alter table public.payments
  drop constraint if exists payments_booking_xor_event_registration_chk;

alter table public.payments
  add constraint payments_booking_xor_event_registration_chk
  check (
    (booking_id is null) <> (event_registration_id is null)
  );

commit;

