-- Enable Row Level Security (RLS) on all tables
-- This effectively locks down the tables from being accessed via Supabase's public API (PostgREST),
-- preventing access even if someone gets your Anon Key.
-- Our application connects using the 'postgres' (admin) user, which bypasses RLS, so the app will continue to work.

ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE history ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- Note: We do NOT create any "Policies" intentionally.
-- Enabling RLS without policies means "Deny All" for public access.
-- This is exactly what we want since only our server code should touch this data.
