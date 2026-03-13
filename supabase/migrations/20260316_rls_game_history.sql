-- RLS policies for game_history: admin có thể SELECT (xem tất cả), UPDATE và DELETE.
-- User thường chỉ xem được bản ghi của chính mình (user_id = auth.uid()).

begin;

alter table public.game_history enable row level security;

-- SELECT: user xem được lịch sử của mình, admin xem được tất cả
drop policy if exists "game_history: select own or admin" on public.game_history;
create policy "game_history: select own or admin"
  on public.game_history
  for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- INSERT: chỉ user tạo bản ghi của mình (khi chơi game) hoặc admin
drop policy if exists "game_history: insert own or admin" on public.game_history;
create policy "game_history: insert own or admin"
  on public.game_history
  for insert
  with check (
    user_id = auth.uid()
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- UPDATE: chỉ admin được sửa bản ghi
drop policy if exists "game_history: update admin only" on public.game_history;
create policy "game_history: update admin only"
  on public.game_history
  for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- DELETE: chỉ admin được xóa bản ghi
drop policy if exists "game_history: delete admin only" on public.game_history;
create policy "game_history: delete admin only"
  on public.game_history
  for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

commit;
