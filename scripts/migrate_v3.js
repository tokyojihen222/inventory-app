const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
let databaseUrl = process.env.DATABASE_URL;

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    const lines = envConfig.split('\n');
    for (const line of lines) {
        if (!line.trim() || line.startsWith('#')) continue;
        const [key, ...values] = line.split('=');
        if (key.trim() === 'DATABASE_URL') {
            let value = values.join('=').trim();
            // Remove surrounding quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            databaseUrl = value;
            break;
        }
    }
}

if (!databaseUrl) {
    console.error('DATABASE_URL not found');
    process.exit(1);
}

console.log('Connecting to database...');

const sql = postgres(databaseUrl, {
    prepare: false,
    ssl: 'require',
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10
});

async function migrate() {
    try {
        console.log('Adding columns...');

        // Add unit column
        await sql`
            ALTER TABLE items 
            ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT '個'
        `;
        console.log('✓ Added unit column');

        // Update existing NULL or invalid units to '個' before applying constraint
        await sql`UPDATE items SET unit = '個' WHERE unit IS NULL OR unit NOT IN ('個', 'パック', 'ケース')`;
        console.log('✓ Updated existing rows to have default unit');

        // Add constraint separately (in case column already exists)
        try {
            await sql`
                ALTER TABLE items 
                ADD CONSTRAINT items_unit_check CHECK (unit IN ('個', 'パック', 'ケース'))
            `;
            console.log('✓ Added unit constraint');
        } catch (e) {
            if (e.message.includes('already exists')) {
                console.log('✓ Unit constraint already exists');
            } else {
                throw e;
            }
        }

        // Add last_purchase_price column
        await sql`
            ALTER TABLE items 
            ADD COLUMN IF NOT EXISTS last_purchase_price INTEGER
        `;
        console.log('✓ Added last_purchase_price column');

        console.log('\n✅ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        await sql.end();
        console.log('Connection closed');
    }
}

migrate().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
