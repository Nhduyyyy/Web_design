-- Add FK so we can join livestream_comments with profiles for viewer name
ALTER TABLE public.livestream_comments
  ADD CONSTRAINT livestream_comments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id);
