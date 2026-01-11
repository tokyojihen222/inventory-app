
import ShoppingListView from '@/components/ShoppingListView';
import { getShoppingList, getPurchaseCandidates } from '@/app/actions';

export const dynamic = 'force-dynamic';

export default async function ShoppingListPage() {
    const list = await getShoppingList();
    const candidates = await getPurchaseCandidates();

    // Serialize plain objects
    const serializedList = JSON.parse(JSON.stringify(list));
    const serializedCandidates = JSON.parse(JSON.stringify(candidates));

    return (
        <ShoppingListView
            initialList={serializedList}
            candidates={serializedCandidates}
        />
    );
}
