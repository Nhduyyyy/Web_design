-- RLS policies for event registrations + payments (Option B)
-- This enables authenticated users to create/read/update their own rows.

begin;

-- Ensure RLS is enabled
alter table public.event_registrations enable row level security;
alter table public.payments enable row level security;

-- Clean up old policies if they exist (idempotent-ish)
drop policy if exists "event_registrations: select own" on public.event_registrations;
drop policy if exists "event_registrations: insert own" on public.event_registrations;
drop policy if exists "event_registrations: update own" on public.event_registrations;

drop policy if exists "payments: select own" on public.payments;
drop policy if exists "payments: insert own" on public.payments;

-- EVENT REGISTRATIONS: users can read/insert/update their own registrations
create policy "event_registrations: select own"
  on public.event_registrations
  for select
  using (user_id = auth.uid());

create policy "event_registrations: insert own"
  on public.event_registrations
  for insert
  with check (user_id = auth.uid());

create policy "event_registrations: update own"
  on public.event_registrations
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- PAYMENTS: users can read their own payments
create policy "payments: select own"
  on public.payments
  for select
  using (user_id = auth.uid());

-- PAYMENTS: users can create payments only for their own booking OR their own event registration
create policy "payments: insert own"
  on public.payments
  for insert
  with check (
    user_id = auth.uid()
    and (
      (
        booking_id is not null
        and exists (
          select 1 from public.bookings b
          where b.id = booking_id
            and b.user_id = auth.uid()
        )
      )
      or
      (
        event_registration_id is not null
        and exists (
          select 1 from public.event_registrations r
          where r.id = event_registration_id
            and r.user_id = auth.uid()
        )
      )
    )
  );

commit;

