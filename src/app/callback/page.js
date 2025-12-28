'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState('認証処理中...');

    // 二重実行防止用のRef
    const processingRef = useRef(false);
    // デバッグ用ステート
    const [debugInfo, setDebugInfo] = useState('');

    useEffect(() => {
        // デバッグ情報収集
        if (typeof window !== 'undefined') {
            const keys = Object.keys(localStorage).filter(k => k.startsWith('sb-'));
            const data = keys.map(k => `${k}: ${localStorage.getItem(k)?.substring(0, 20)}...`).join('\n');
            setDebugInfo(`Storage Keys: ${keys.join(', ')}\nValues: ${data}`);
        }
    }, []);

    useEffect(() => {
        const handleAuth = async () => {
            const code = searchParams.get('code');
            const error = searchParams.get('error');
            const error_description = searchParams.get('error_description');

            if (error) {
                console.error('Auth error param:', error, error_description);
                setStatus(`認証エラー: ${error_description || error}`);
                setTimeout(() => router.push('/login'), 3000);
                return;
            }

            if (!code) {
                // コードがない場合は何もしない（画面ロード直後など）
                return;
            }

            // ガード処理: 既に実行中ならスキップ
            if (processingRef.current) return;
            processingRef.current = true;

            try {
                const supabase = createClient();

                // Exchange the code for a session
                const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

                if (exchangeError) {
                    console.error('Exchange error:', exchangeError);
                    setStatus('認証に失敗しました: ' + exchangeError.message);
                    // 失敗したらフラグを戻して再試行可能にするか、リダイレクトするか
                    // ここではリダイレクト
                    setTimeout(() => router.push('/login'), 3000);
                    return;
                }

                if (data.session) {
                    // Cookieを明示的にセット（Client Side）
                    document.cookie = `session=authenticated; path=/; max-age=${60 * 60 * 24 * 30}; secure; samesite=lax`;

                    setStatus('ログイン成功！リダイレクト中...');
                    router.push('/');
                    router.refresh(); // Middlewareの状態を反映させるためリフレッシュ
                }
            } catch (e) {
                console.error('Unexpected error:', e);
                setStatus('予期しないエラーが発生しました');
                setTimeout(() => router.push('/login'), 3000);
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
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'white'
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
            <pre style={{
                marginTop: '20px',
                textAlign: 'left',
                fontSize: '12px',
                background: 'rgba(0,0,0,0.5)',
                padding: '10px',
                borderRadius: '8px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
            }}>
                {debugInfo}
            </pre>
        </div>
    );
}

function LoadingFallback() {
    return <div style={{ color: 'white', textAlign: 'center' }}>読み込み中...</div>;
}

export default function AuthCallbackPage() {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            backgroundColor: '#0a0a0f',
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
