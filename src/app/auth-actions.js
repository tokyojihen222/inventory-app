'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const SESSION_PASSWORD = process.env.SESSION_PASSWORD || 'admin'; // Default password for dev

export async function login(prevState, formData) {
    const password = formData.get('password');

    if (password === SESSION_PASSWORD) {
        // Set a simple session cookie
        (await cookies()).set('session', 'authenticated', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
        });
        redirect('/');
    } else {
        return { error: 'パスワードが間違っています' };
    }
}

export async function logout() {
    (await cookies()).delete('session');
    redirect('/login');
}
