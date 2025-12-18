import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
}

const sql = postgres(connectionString, {
    prepare: false, // Supabase Transaction Pooler compatibility
    ssl: 'require'
});

export default sql;
