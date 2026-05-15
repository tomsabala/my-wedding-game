-- Enable full replica identity so Supabase Realtime carries row data
ALTER TABLE players REPLICA IDENTITY FULL;

-- Add players table to the Supabase realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE players;
