'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Global Application Error:', error);
    }, [error]);

    return (
        <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
            <h2 style={{ color: '#d32f2f' }}>アプリケーションでエラーが発生しました</h2>
            <p style={{ marginBottom: '1rem' }}>以下のエラーメッセージをコピーして開発者に共有してください：</p>

            <div style={{
                background: '#f8d7da',
                color: '#721c24',
                padding: '1rem',
                borderRadius: '8px',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                textAlign: 'left',
                margin: '0 auto',
                maxWidth: '800px',
                border: '1px solid #f5c6cb'
            }}>
                {error.toString()}
                {error.stack && (
                    <details style={{ marginTop: '1rem' }}>
                        <summary>Stack Trace</summary>
                        <pre style={{ fontSize: '0.8rem', overflowX: 'auto' }}>
                            {error.stack}
                        </pre>
                    </details>
                )}
            </div>

            <button
                onClick={
                    // Attempt to recover by trying to re-render the segment
                    () => reset()
                }
                style={{
                    marginTop: '2rem',
                    padding: '0.5rem 1rem',
                    fontSize: '1rem',
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                再読み込み
            </button>
        </div>
    );
}
