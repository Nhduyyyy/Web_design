-- Allow users to update their own payment and event_registration
-- Needed for completeEventPayment() which updates payments + event_registrations client-side.

begin;

-- PAYMENTS: user can update their own pending payments
drop policy if exists "payments: update own" on public.payments;
create policy "payments: update own"
  on public.payments
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- EVENT_REGISTRATIONS: user can update their own registrations
-- (payment_status + status after successful payment)
drop policy if exists "event_registrations: update own" on public.event_registrations;
create policy "event_registrations: update own"
  on public.event_registrations
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

commit;
