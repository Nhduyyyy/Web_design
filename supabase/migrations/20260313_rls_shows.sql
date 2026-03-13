-- RLS policies for shows: role 'user' và 'admin' được phép xem danh sách vở diễn (SELECT).
-- Dùng cho trang Vở diễn (TuongPerformance.jsx).

begin;

alter table public.shows enable row level security;

-- Cho phép user (và admin) SELECT để xem danh sách vở diễn
drop policy if exists "shows: select for user and admin" on public.shows;
create policy "shows: select for user and admin"
  on public.shows
  for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('user', 'admin')
    )
  );

-- Tuỳ chọn: cho phép khách (chưa đăng nhập) cũng xem danh sách vở diễn.
-- Bỏ comment 3 dòng dưới nếu muốn public read.
-- drop policy if exists "shows: select anon" on public.shows;
-- create policy "shows: select anon"
--   on public.shows for select using (auth.role() = 'anon');

commit;
