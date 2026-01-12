
import { getMonthlyExpenses } from '@/app/actions';
import KakeiboDashboardLoader from '@/components/KakeiboDashboardLoader';

export const dynamic = 'force-dynamic';

export default async function KakeiboPage({ searchParams }) {
    // Resolve searchParams before using properties
    const resolvedSearchParams = await searchParams;
    const now = new Date();
    const year = resolvedSearchParams?.year ? parseInt(resolvedSearchParams.year) : now.getFullYear();
    const month = resolvedSearchParams?.month ? parseInt(resolvedSearchParams.month) : now.getMonth() + 1;

    let data;
    try {
        data = await getMonthlyExpenses(year, month);
    } catch (error) {
        console.error("Failed to fetch kakeibo data:", error);
        // Fallback data to prevent crash
        data = {
            purchases: [],
            categorySummary: {},
            storeSummary: {},
            total: 0
        };
    }

    // Serialize data for client component
    const serializedData = JSON.parse(JSON.stringify(data));

    return (
        <KakeiboDashboardLoader
            data={serializedData}
            currentMonth={month}
            currentYear={year}
        />
    );
}
