import { getItems } from './actions';
import InventoryView from '@/components/InventoryView';

export const dynamic = 'force-dynamic';

export default async function Home() {
    const rawItems = await getItems();
    // Next.js cannot pass Date objects to Client Components from Server Components.
    // We strictly serialize them to plain JSON objects (dates become ISO strings).
    const items = JSON.parse(JSON.stringify(rawItems));

    return (
        <InventoryView initialItems={items} />
    );
}
