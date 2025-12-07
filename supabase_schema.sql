-- Enable UUID extension if needed (not strictly used here but good practice)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create items table
CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  quantity INTEGER DEFAULT 0,
  unit TEXT,
  threshold INTEGER DEFAULT 1,
  last_purchased_at TIMESTAMP WITH TIME ZONE,
  predicted_next_purchase TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create history table
CREATE TABLE IF NOT EXISTS history (
  id SERIAL PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES items(id),
  date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  quantity_change INTEGER NOT NULL,
  cost INTEGER,
  type TEXT CHECK(type IN ('purchase', 'consume', 'adjustment'))
);

-- Initial Data (Optional)
INSERT INTO items (name, category, quantity, unit, threshold) VALUES
('醤油', '調味料', 1, '本', 1),
('マヨネーズ', '調味料', 1, '本', 1),
('トイレットペーパー', '日用品', 6, 'ロール', 4);
