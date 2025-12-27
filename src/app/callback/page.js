'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState('認証処理中...');

    useEffect(() => {
        const handleAuth = async () => {
            try {
                const code = searchParams.get('code');

                if (!code) {
                    setStatus('認証コードがありません');
                    setTimeout(() => router.push('/login?error=no_code'), 2000);
                    return;
                }

                const supabase = createClient();

                // Exchange the code for a session
                const { data, error } = await supabase.auth.exchangeCodeForSession(code);

                if (error) {
                    console.error('Auth error:', error);
                    setStatus('認証エラー: ' + error.message);
                    setTimeout(() => router.push('/login?error=auth'), 2000);
                    return;
                }

                if (data.session) {
                    // Set our custom session cookie
                    document.cookie = `session=authenticated; path=/; max-age=${60 * 60 * 24 * 30}; ${process.env.NODE_ENV === 'production' ? 'secure;' : ''}`;

                    setStatus('ログイン成功！リダイレクト中...');
                    router.push('/');
                }
            } catch (e) {
                console.error('Unexpected error:', e);
                setStatus('予期しないエラーが発生しました');
                setTimeout(() => router.push('/login?error=unexpected'), 2000);
            }
        };

        handleAuth();
    }, [searchParams, router]);

    return (
        <div style={{
            textAlign: 'center',
            padding: '2rem',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
            <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(168, 85, 247, 0.3)',
                borderTopColor: '#a855f7',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 1rem'
            }} />
            <p style={{ margin: 0 }}>{status}</p>
        </div>
    );
}

function LoadingFallback() {
    return (
        <div style={{
            textAlign: 'center',
            padding: '2rem',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
            <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(168, 85, 247, 0.3)',
                borderTopColor: '#a855f7',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 1rem'
            }} />
            <p style={{ margin: 0 }}>読み込み中...</p>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            backgroundColor: '#0a0a0f',
            color: 'white',
            fontFamily: 'system-ui, sans-serif'
        }}>
            <Suspense fallback={<LoadingFallback />}>
                <AuthCallbackContent />
            </Suspense>
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
