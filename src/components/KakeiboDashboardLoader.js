'use client';

import dynamic from 'next/dynamic';

const KakeiboDashboard = dynamic(() => import('./KakeiboDashboard'), {
    ssr: false,
    loading: () => <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>読み込み中...</div>
});

export default function KakeiboDashboardLoader(props) {
    return <KakeiboDashboard {...props} />;
}
