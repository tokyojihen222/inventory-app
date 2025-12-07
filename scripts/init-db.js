const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'inventory.db');
const db = new Database(dbPath);

const initDb = () => {
    // Items table
    db.prepare(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      quantity INTEGER DEFAULT 0,
      unit TEXT,
      threshold INTEGER DEFAULT 1,
      last_purchased_at TEXT,
      predicted_next_purchase TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

    // History table
    db.prepare(`
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      date TEXT DEFAULT CURRENT_TIMESTAMP,
      quantity_change INTEGER NOT NULL,
      cost INTEGER,
      type TEXT CHECK(type IN ('purchase', 'consume', 'adjustment')),
      FOREIGN KEY (item_id) REFERENCES items (id)
    )
  `).run();

    console.log('Database initialized successfully.');
};

initDb();
