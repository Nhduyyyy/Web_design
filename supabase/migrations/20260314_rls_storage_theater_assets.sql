-- RLS policies cho bucket 'theater-assets': cho phép chủ nhà hát (owner) upload logo/cover.
-- Code upload path dạng: {theaterId}/{theaterId}-logo.{ext} hoặc {theaterId}/{theaterId}-cover.{ext}
-- Policy phải cho phép INSERT/UPDATE khi thư mục đầu = id nhà hát mà user là owner.

begin;

-- INSERT: chỉ khi thư mục đầu trong path là theater_id của nhà hát mà auth.uid() là owner
drop policy if exists "theater_assets_insert" on storage.objects;
create policy "theater_assets_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'theater-assets'
    and (storage.foldername(name))[1] in (
      select id::text from public.theaters where owner_id = auth.uid()
    )
  );

-- UPDATE: cần cho upsert (ghi đè file đã tồn tại)
drop policy if exists "theater_assets_update" on storage.objects;
create policy "theater_assets_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'theater-assets'
    and (storage.foldername(name))[1] in (
      select id::text from public.theaters where owner_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'theater-assets'
    and (storage.foldername(name))[1] in (
      select id::text from public.theaters where owner_id = auth.uid()
    )
  );

-- SELECT: công khai xem (giữ policy hiện tại nếu đã có; nếu chưa có thì tạo)
drop policy if exists "theater_assets_select" on storage.objects;
create policy "theater_assets_select"
  on storage.objects
  for select
  to public
  using (bucket_id = 'theater-assets');

-- DELETE: chủ nhà hát được xóa file trong thư mục theater của mình
drop policy if exists "theater_assets_delete" on storage.objects;
create policy "theater_assets_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'theater-assets'
    and (storage.foldername(name))[1] in (
      select id::text from public.theaters where owner_id = auth.uid()
    )
  );

commit;
