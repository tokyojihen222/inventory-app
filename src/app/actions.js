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
    const rawData = {
        name: formData.get('name'),
        category: formData.get('category'),
        quantity: formData.get('quantity'),
        threshold: formData.get('threshold'),
        unit: formData.get('unit'),
        last_purchase_price: formData.get('last_purchase_price') ? Number(formData.get('last_purchase_price')) : null,
    };

    // Validate data - will throw error if invalid (caught by Next.js error boundary)
    const data = itemSchema.parse(rawData);

    // Initial prediction: 1 month from now
    await sql`
    INSERT INTO items (name, category, quantity, threshold, unit, last_purchase_price, predicted_next_purchase)
    VALUES (${data.name}, ${data.category}, ${data.quantity}, ${data.threshold}, ${data.unit}, ${data.last_purchase_price}, NOW() + INTERVAL '1 month')
  `;

    revalidatePath('/');
}

export async function updateItem(id, formData) {
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
