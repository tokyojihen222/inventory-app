const postgres = require('postgres');

// Get Direct Connection URL from command line argument
const directUrl = process.argv[2];

if (!directUrl) {
    console.error('Usage: node migrate_direct.js "postgresql://..."');
    console.error('\nPlease provide the Direct Connection URL (port 5432) as an argument.');
    console.error('You can find this in Supabase: Connect → Connection String → Direct connection');
    process.exit(1);
}

console.log('Connecting to database via Direct Connection...');

const sql = postgres(directUrl, {
    ssl: 'require',
    max: 1,
    idle_timeout: 20,
    connect_timeout: 30
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

        // Add constraint separately
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
        console.log('\nNext steps:');
        console.log('1. Your database schema is now updated');
        console.log('2. The Vercel app should work now (no redeploy needed)');
        console.log('3. Try accessing your app again');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        await sql.end();
        console.log('\nConnection closed');
    }
}

migrate().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
