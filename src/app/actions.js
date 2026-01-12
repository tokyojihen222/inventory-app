'use server';

import sql from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { itemSchema } from '@/lib/schemas';

export async function getItems() {
    return await sql`SELECT * FROM items ORDER BY category, name`;
}

export async function bulkAddItems(items) {
    let count = 0;

    // バリデーションと登録をループ処理
    // 注: 本来はバッチ処理すべきですが、Postgres.jsでの複雑なUPSERTを避けるため
    // 安全に1件ずつ処理します（件数は多くないので問題ないはずです）
    for (const item of items) {
        try {
            // バリデーション
            const data = itemSchema.parse({
                name: item.name,
                category: item.category || '未分類',
                quantity: item.quantity || 1,
                threshold: 1,
                unit: item.unit || '個',
                last_purchase_price: item.last_purchase_price || null
            });

            // 既存の商品があるか名前で検索
            const [existing] = await sql`SELECT id, quantity FROM items WHERE name = ${data.name}`;

            if (existing) {
                // 更新
                await updateInventory(existing.id, data.quantity, 'purchase');
                // 価格と単位も更新
                await sql`
                    UPDATE items 
                    SET unit = ${data.unit}, last_purchase_price = ${data.last_purchase_price}
                    WHERE id = ${existing.id}
                `;
            } else {
                // 新規作成
                await sql`
                    INSERT INTO items (name, category, quantity, threshold, unit, last_purchase_price, predicted_next_purchase)
                    VALUES (${data.name}, ${data.category}, ${data.quantity}, ${data.threshold}, ${data.unit}, ${data.last_purchase_price}, NOW() + INTERVAL '1 month')
                `;
            }
            count++;
        } catch (e) {
            console.error(`Failed to add item ${item.name}:`, e);
            // 1件失敗しても他は続行
        }
    }
    revalidatePath('/');
    return { success: true, count };
}

export async function addItem(formData) {
    try {
        const rawData = {
            name: formData.get('name'),
            category: formData.get('category'),
            quantity: formData.get('quantity'),
            threshold: formData.get('threshold'),
            unit: formData.get('unit'),
            last_purchase_price: formData.get('last_purchase_price') ? Number(formData.get('last_purchase_price')) : null,
        };

        const data = itemSchema.parse(rawData);

        await sql`
            INSERT INTO items (name, category, quantity, threshold, unit, last_purchase_price, predicted_next_purchase)
            VALUES (${data.name}, ${data.category}, ${data.quantity}, ${data.threshold}, ${data.unit}, ${data.last_purchase_price}, NOW() + INTERVAL '1 month')
        `;

        revalidatePath('/');
    } catch (e) {
        console.error('Failed to add item:', e);
        throw new Error(e.message || '商品の追加に失敗しました');
    }
}

export async function updateItem(id, formData) {
    try {
        const rawData = {
            name: formData.get('name'),
            category: formData.get('category'),
            quantity: formData.get('quantity'),
            threshold: formData.get('threshold'),
            unit: formData.get('unit'),
            last_purchase_price: formData.get('last_purchase_price') ? Number(formData.get('last_purchase_price')) : null,
        };

        const data = itemSchema.parse(rawData);

        await sql`
            UPDATE items 
            SET name = ${data.name}, category = ${data.category}, quantity = ${data.quantity}, threshold = ${data.threshold}, unit = ${data.unit}, last_purchase_price = ${data.last_purchase_price}
            WHERE id = ${id}
        `;

        revalidatePath('/');
    } catch (e) {
        console.error('Failed to update item:', e);
        throw new Error(e.message || '商品の更新に失敗しました');
    }
}

export async function deleteItem(id) {
    await sql`DELETE FROM items WHERE id = ${id}`;
    revalidatePath('/');
}

export async function updateInventory(id, change, type = 'adjustment') {
    try {
        // トランザクション（sql.begin）はSupabase Transaction Poolerと相性が悪いため削除
        // 1. Get current item
        const [item] = await sql`SELECT quantity FROM items WHERE id = ${id}`;
        if (!item) return { success: false, error: 'Item not found' };

        const newQuantity = item.quantity + change;

        // 2. Update quantity
        await sql`UPDATE items SET quantity = ${newQuantity} WHERE id = ${id}`;

        // 3. Record history
        await sql`
            INSERT INTO history (item_id, quantity_change, type)
            VALUES (${id}, ${change}, ${type})
        `;

        // Calculate prediction (optional)
        if (type === 'purchase') {
            await updatePrediction(id);
        }

        revalidatePath('/');
        return { success: true };
    } catch (e) {
        console.error('Failed to update inventory:', e);
        // エラーをthrowするとNext.jsのエラー画面になるため、オブジェクトで返すのが理想だが
        // 現状の呼び出し元（InventoryTable）が対応していないためthrowする。
        // ただし、呼び出し元でこれをcatchしてalertする。
        throw new Error(`在庫更新エラー: ${e.message}`);
    }
}

// Helper to handle prediction update which might need DB access
async function updatePrediction(id) {
    const { calculatePrediction } = await import('@/lib/analytics');
    const prediction = await calculatePrediction(id); // Ensure this is async

    if (prediction) {
        await sql`UPDATE items SET predicted_next_purchase = ${prediction.nextPurchaseDate} WHERE id = ${id}`;
    }
}

// Shopping List Actions

export async function getShoppingList() {
    return await sql`SELECT * FROM shopping_list ORDER BY created_at ASC`;
}

export async function addShoppingItem(name) {
    if (!name || name.trim() === '') return;
    await sql`INSERT INTO shopping_list (name) VALUES (${name})`;
    revalidatePath('/shopping-list');
}

export async function toggleShoppingItem(id, checked) {
    await sql`UPDATE shopping_list SET checked = ${checked} WHERE id = ${id}`;
    revalidatePath('/shopping-list');
}

export async function deleteShoppingItem(id) {
    await sql`DELETE FROM shopping_list WHERE id = ${id}`;
    revalidatePath('/shopping-list');
}

export async function getPurchaseCandidates() {
    // Candidates are items where:
    // 1. Quantity <= Threshold
    // 2. OR Predicted next purchase <= Now + 7 days
    const candidates = await sql`
        SELECT * FROM items 
        WHERE quantity <= threshold 
        OR (predicted_next_purchase IS NOT NULL AND predicted_next_purchase <= NOW() + INTERVAL '7 days')
        ORDER BY predicted_next_purchase ASC
    `;
    return candidates;
}

// Household Account Actions

export async function recordPurchase(data) {
    // data: { store_name, purchase_date, items: [{ name, price, quantity, category }] }

    // 1. Create Purchase Record
    const [purchase] = await sql`
        INSERT INTO purchases (store_name, purchase_date, total_amount)
        VALUES (
            ${data.store_name}, 
            ${data.purchase_date || new Date().toISOString()}, 
            ${data.total_amount !== undefined ? data.total_amount : data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
        )
        RETURNING id
    `;

    // 2. Insert Items
    for (const item of data.items) {
        await sql`
            INSERT INTO purchase_items (purchase_id, name, price, quantity, category)
            VALUES (
                ${purchase.id},
                ${item.raw_name || item.name},
                ${item.price},
                ${item.quantity},
                ${item.category}
            )
        `;
    }

    revalidatePath('/kakeibo');
}

export async function getMonthlyExpenses(year, month) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`; // '2025-01-01'
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

    const purchases = await sql`
        SELECT * FROM purchases
        WHERE purchase_date >= ${startDate} AND purchase_date < ${endDate}
        ORDER BY purchase_date DESC
    `;

    const items = await sql`
        SELECT pi.*, p.purchase_date 
        FROM purchase_items pi
        JOIN purchases p ON pi.purchase_id = p.id
        WHERE p.purchase_date >= ${startDate} AND p.purchase_date < ${endDate}
    `;

    // Calculate category summary
    const categorySummary = items.reduce((acc, item) => {
        const cat = item.category || 'その他';
        if (!acc[cat]) acc[cat] = 0;
        acc[cat] += item.price * item.quantity;
        return acc;
    }, {});

    // Calculate store summary
    const storeSummary = purchases.reduce((acc, p) => {
        const store = p.store_name || '不明';
        if (!acc[store]) acc[store] = 0;
        acc[store] += p.total_amount;
        return acc;
    }, {});

    const total = purchases.reduce((sum, p) => sum + p.total_amount, 0);

    return {
        purchases,
        categorySummary,
        storeSummary,
        total
    };
}
