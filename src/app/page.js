import { getItems } from './actions';
import InventoryView from '@/components/InventoryView';

export const dynamic = 'force-dynamic';

export default async function Home() {
    const items = await getItems();

    return (
        <InventoryView initialItems={items} />
    );
}
