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
        // デバッグ情報収集
        if (typeof window !== 'undefined') {
            const keys = Object.keys(localStorage).filter(k => k.startsWith('sb-'));
            const data = keys.map(k => `${k}: ${localStorage.getItem(k)?.substring(0, 20)}...`).join('\n');
            const urlInfo = `URL: ${window.location.href}\nHash: ${window.location.hash}`;
            setDebugInfo(`Current URL Info:\n${urlInfo}\n\nStorage Keys: ${keys.join(', ')}\nValues: ${data}`);
        }
    }, []);

    useEffect(() => {
        const handleAuth = async () => {
            const supabase = createClient();

            const handleSuccess = async () => {
                // メールアドレスチェック（簡易ホワイトリスト）
                const { data: { user } } = await supabase.auth.getUser();
                // 許可するメールアドレスリスト
                const allowedEmails = ['tokyojihen222@gmail.com'];

                if (!user || (user.email && !allowedEmails.includes(user.email))) {
                    console.error('Unauthorized access attempt:', user?.email);
                    await supabase.auth.signOut();
                    setStatus(`アクセス権限がありません: ${user?.email}`);
                    setTimeout(() => window.location.href = '/login?error=unauthorized', 3000);
                    return;
                }

                // Cookieを明示的にセット（Client Side）
                document.cookie = `session=authenticated; path=/; max-age=${60 * 60 * 24 * 30}; secure; samesite=lax`;
                setStatus('ログイン成功！リダイレクト中...');
                // ハードリダイレクトでキャッシュ回避
                window.location.href = '/';
            };

            // 1. まずハッシュに含まれるImplicit Flowのトークンなどのセッション確認を試みる
            // start up時にURLハッシュがあればsupabase-jsが自動的に解析してsessionにセットする
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError) {
                console.error('Session error:', sessionError);
            }

            if (session) {
                setDebugInfo(prev => prev + '\n\n[SUCCESS] Session found via Implicit Flow/Storage');
                handleSuccess();
                return;
            }

            // 2. セッションがなければPKCEのCodeフローを試みる
            const code = searchParams.get('code');
            const error = searchParams.get('error');
            const error_description = searchParams.get('error_description');

            if (error) {
                console.error('Auth error param:', error, error_description);
                setStatus(`認証エラー: ${error_description || error}`);
                setTimeout(() => window.location.href = '/login', 3000);
                return;
            }

            if (!code) {
                // コードもセッションもない場合は待機（onAuthStateChangeが拾う可能性があるため即死させない）
                // ただしImplicit Flowの場合は即座にgetSessionで取れるはずなので、
                // ここに来る＝認証情報なしの可能性が高い
                if (!window.location.hash) {
                    // ハッシュもコードもなければ何もしない（通常アクセス）
                    return;
                }
                // ハッシュがあるのにセッションが取れなかった場合
                setStatus('認証情報を解析中...');

                // onAuthStateChangeでのキャッチを少し待つ
                const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                    if (event === 'SIGNED_IN' && session) {
                        handleSuccess();
                    }
                });
                return;
            }

            // ガード処理: 既に実行中ならスキップ
            if (processingRef.current) return;
            processingRef.current = true;

            try {
                // Exchange the code for a session
                const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

                if (exchangeError) {
                    console.error('Exchange error:', exchangeError);
                    setStatus('認証に失敗しました: ' + exchangeError.message);
                    setTimeout(() => window.location.href = '/login', 3000);
                    return;
                }

                if (data.session) {
                    handleSuccess();
                }
            } catch (e) {
                console.error('Unexpected error:', e);
                setStatus('予期しないエラーが発生しました');
                setTimeout(() => window.location.href = '/login', 3000);
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
