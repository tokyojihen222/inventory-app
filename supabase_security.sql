-- Create a table to track login attempts by IP address
CREATE TABLE IF NOT EXISTS login_attempts (
    ip_address TEXT PRIMARY KEY,
    attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    blocked_until TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security (RLS) is good practice, 
-- but since we are accessing this from server-side (postgres.js) with connection string, 
-- we bypass RLS by default unless using Supabase JS client with anon key.
-- Since we use 'postgres' library with connection string, we have admin access.
-- So no policies needed for now.
