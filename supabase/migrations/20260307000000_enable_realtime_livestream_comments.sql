-- Enable Realtime for livestream_comments (required for postgres_changes)
-- Run this in Supabase SQL Editor if Realtime is not receiving new comments

ALTER PUBLICATION supabase_realtime ADD TABLE livestream_comments;
