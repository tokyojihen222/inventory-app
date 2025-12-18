import { NextResponse } from 'next/server';
import postgres from 'postgres';

export const dynamic = 'force-dynamic';

export async function GET() {
    const dbUrl = process.env.DATABASE_URL;

    // Mask password for display
    const maskedUrl = dbUrl ? dbUrl.replace(/:([^:@]+)@/, ':***@') : 'undefined';

    const debugInfo = {
        envVarExists: !!dbUrl,
        connectionString: maskedUrl,
        timestamp: new Date().toISOString(),
    };

    if (!dbUrl) {
        return NextResponse.json({
            status: 'error',
            message: 'DATABASE_URL is missing',
            debugInfo
        }, { status: 500 });
    }

    try {
        // Create a dedicated connection for testing
        const sql = postgres(dbUrl, {
            prepare: false,
            ssl: 'require',
            connect_timeout: 10
        });

        // Try a simple query
        const result = await sql`SELECT 1 as connected`;
        await sql.end();

        return NextResponse.json({
            status: 'success',
            message: 'Connected to database successfully!',
            result,
            debugInfo
        });

    } catch (error) {
        return NextResponse.json({
            status: 'error',
            message: error.message,
            code: error.code,
            stack: error.stack,
            debugInfo
        }, { status: 500 });
    }
}
