import { getItems } from './actions';
import InventoryView from '@/components/InventoryView';

export const dynamic = 'force-dynamic';

export default async function Home() {
    let items = [];
    let error = null;

    try {
        const rawItems = await getItems();
        // Next.js cannot pass Date objects to Client Components from Server Components.
        // We strictly serialize them to plain JSON objects (dates become ISO strings).
        items = JSON.parse(JSON.stringify(rawItems));
    } catch (e) {
        console.error('Failed to fetch items:', e);
        error = e.message || 'Unknown error';
    }

    if (error) {
        return (
            <div style={{ padding: '2rem', color: 'red' }}>
                <h1>エラーが発生しました</h1>
                <p>以下のエラーメッセージをコピーして共有してください：</p>
                <div style={{
                    background: '#f8f9fa',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    marginTop: '1rem',
                    fontFamily: 'monospace',
                    color: '#333',
                    whiteSpace: 'pre-wrap'
                }}>
                    {error}
                </div>
            </div>
        );
    }

    return (
        <InventoryView initialItems={items} />
    );
}
