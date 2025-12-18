const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
let databaseUrl = process.env.DATABASE_URL;

if (fs.existsSync(envPath)) {
  console.log('Found .env.local at:', envPath);
  const envConfig = fs.readFileSync(envPath, 'utf8');
  const lines = envConfig.split('\n');
  console.log(`Read ${lines.length} lines.`);
  for (const line of lines) {
    if (!line.trim() || line.startsWith('#')) continue;
    const [key, ...values] = line.split('=');
    if (key.trim() === 'DATABASE_URL') {
      console.log('Found DATABASE_URL key');
      let value = values.join('=').trim();
      // Remove surrounding quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      databaseUrl = value;
      break;
    }
  }
} else {
  console.log('.env.local NOT found at:', envPath);
}

if (!databaseUrl) {
  console.error('DATABASE_URL not found in environment or .env.local');
  process.exit(1);
}

const sql = postgres(databaseUrl);

async function migrate() {
  console.log('Migrating database...');
  try {
    // Add unit column
    await sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'unit') THEN 
          ALTER TABLE items ADD COLUMN unit TEXT DEFAULT '個' CHECK (unit IN ('個', 'パック', 'ケース')); 
        END IF; 
      END $$;
    `;

    // Add last_purchase_price column
    await sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'last_purchase_price') THEN 
          ALTER TABLE items ADD COLUMN last_purchase_price INTEGER; 
        END IF; 
      END $$;
    `;

    console.log('Migration successful: Added last_purchase_price and unit columns if they did not exist.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sql.end();
  }
}

migrate();
