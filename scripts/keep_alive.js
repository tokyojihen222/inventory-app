const postgres = require('postgres');

// データベース接続情報 (環境変数から取得)
// 接続できない場合はエラー終了
if (!process.env.POSTGRES_URL) {
    console.error('Error: POSTGRES_URL environment variable is not set.');
    process.exit(1);
}

const sql = postgres(process.env.POSTGRES_URL, {
    ssl: 'require',
    max: 1,
});

async function ping() {
    try {
        console.log('Pinging database...');
        // 単純なクエリを実行して接続を確認
        const result = await sql`SELECT 1 as pong`;
        console.log('Database responded:', result);
        console.log('Keep-alive ping successful.');
    } catch (error) {
        console.error('Keep-alive ping failed:', error);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

ping();
