
import { getMonthlyExpenses } from '@/app/actions';
import dynamic from 'next/dynamic';

const KakeiboDashboard = dynamic(() => import('@/components/KakeiboDashboard'), {
    ssr: false,
    loading: () => <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>読み込み中...</div>
});

export const dynamicMode = 'force-dynamic';

export default async function KakeiboPage({ searchParams }) {
    // Resolve searchParams before using properties
    const resolvedSearchParams = await searchParams;
    const now = new Date();
    const year = resolvedSearchParams?.year ? parseInt(resolvedSearchParams.year) : now.getFullYear();
    const month = resolvedSearchParams?.month ? parseInt(resolvedSearchParams.month) : now.getMonth() + 1;

    const data = await getMonthlyExpenses(year, month);

    // Serialize data for client component
    const serializedData = JSON.parse(JSON.stringify(data));

    return (
        <KakeiboDashboard
            data={serializedData}
            currentMonth={month}
            currentYear={year}
        />
    );
}
