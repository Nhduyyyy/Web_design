-- RLS policies for bookings: user và admin được phép SELECT / INSERT / UPDATE
-- Giải quyết lỗi PGRST116 khi updateBooking không trả về dòng (do thiếu policy SELECT).

begin;

alter table public.bookings enable row level security;

-- Helper: admin là user có role = 'admin' trong profiles
-- (user_id trong bookings tham chiếu profiles.id, profiles.id = auth.users.id)

drop policy if exists "bookings: select own or admin" on public.bookings;
create policy "bookings: select own or admin"
  on public.bookings
  for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

drop policy if exists "bookings: insert own or admin" on public.bookings;
create policy "bookings: insert own or admin"
  on public.bookings
  for insert
  with check (
    user_id = auth.uid()
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

drop policy if exists "bookings: update own or admin" on public.bookings;
create policy "bookings: update own or admin"
  on public.bookings
  for update
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    user_id = auth.uid()
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

commit;
