'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import sql from '@/lib/db';

const SESSION_PASSWORD = process.env.SESSION_PASSWORD || 'admin'; // Default password for dev

export async function login(prevState, formData) {
    const password = formData.get('password');
    // Get IP address (handle proxy headers for Vercel)
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';

    // 1. Check if blocked
    const [record] = await sql`
        SELECT * FROM login_attempts WHERE ip_address = ${ip}
    `;

    if (record && record.blocked_until && new Date(record.blocked_until) > new Date()) {
        const resetTime = new Date(record.blocked_until).toLocaleTimeString('ja-JP');
        return { error: `ログイン試行回数が多すぎます。${resetTime} までお待ちください。` };
    }

    if (password === SESSION_PASSWORD) {
        // Success: Reset attempts
        await sql`
            INSERT INTO login_attempts (ip_address, attempts, blocked_until)
            VALUES (${ip}, 0, NULL)
            ON CONFLICT (ip_address)
            DO UPDATE SET attempts = 0, blocked_until = NULL, last_attempt_at = NOW()
        `;

        // Set a simple session cookie
        (await cookies()).set('session', 'authenticated', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
        });
        redirect('/');
    } else {
        // Failure: Increment attempts
        const newAttempts = (record?.attempts || 0) + 1;
        let blockedUntil = null;

        if (newAttempts >= 5) {
            // Block for 10 minutes
            blockedUntil = new Date(Date.now() + 10 * 60 * 1000).toISOString();
        }

        await sql`
            INSERT INTO login_attempts (ip_address, attempts, blocked_until)
            VALUES (${ip}, ${newAttempts}, ${blockedUntil})
            ON CONFLICT (ip_address)
            DO UPDATE SET attempts = ${newAttempts}, blocked_until = ${blockedUntil}, last_attempt_at = NOW()
        `;

        if (blockedUntil) {
            return { error: 'パスワードを5回間違えたため、10分間ロックされました。' };
        }

        return { error: `パスワードが間違っています (残り${5 - newAttempts}回)` };
    }
}

export async function logout() {
    (await cookies()).delete('session');
    redirect('/login');
}
