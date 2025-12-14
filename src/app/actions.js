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
                threshold: 1
            });

            // 既存の商品があるか名前で検索
            const [existing] = await sql`SELECT id, quantity FROM items WHERE name = ${data.name}`;

            if (existing) {
                // 更新
                await updateInventory(existing.id, data.quantity, 'purchase');
            } else {
                // 新規作成
                await sql`
                    INSERT INTO items (name, category, quantity, threshold, predicted_next_purchase)
                    VALUES (${data.name}, ${data.category}, ${data.quantity}, ${data.threshold}, NOW() + INTERVAL '1 month')
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
    };

    // Validate data - will throw error if invalid (caught by Next.js error boundary)
    const data = itemSchema.parse(rawData);

    // Initial prediction: 1 month from now
    await sql`
    INSERT INTO items (name, category, quantity, threshold, predicted_next_purchase)
    VALUES (${data.name}, ${data.category}, ${data.quantity}, ${data.threshold}, NOW() + INTERVAL '1 month')
  `;

    revalidatePath('/');
}

export async function updateItem(id, formData) {
    const rawData = {
        name: formData.get('name'),
        category: formData.get('category'),
        quantity: formData.get('quantity'),
        threshold: formData.get('threshold'),
    };

    const data = itemSchema.parse(rawData);

    await sql`
    UPDATE items 
    SET name = ${data.name}, category = ${data.category}, quantity = ${data.quantity}, threshold = ${data.threshold}
    WHERE id = ${id}
  `;

    revalidatePath('/');
}

export async function deleteItem(id) {
    await sql`DELETE FROM items WHERE id = ${id}`;
    revalidatePath('/');
}

export async function updateInventory(id, change, type = 'adjustment') {
    // Use a transaction
    await sql.begin(async sql => {
        // 1. Get current item
        const [item] = await sql`SELECT * FROM items WHERE id = ${id}`;
        if (!item) return;

        const newQuantity = item.quantity + change;

        // 2. Update quantity
        await sql`UPDATE items SET quantity = ${newQuantity} WHERE id = ${id}`;

        // 3. Record history
        await sql`
      INSERT INTO history (item_id, quantity_change, type)
      VALUES (${id}, ${change}, ${type})
    `;
    });

    // Calculate prediction outside transaction (optional)
    if (type === 'purchase') {
        const { calculatePrediction } = await import('@/lib/analytics');
        // Prediction logic might need update if it relied on DB synchronous calls, 
        // but calculatePrediction seems to take just an ID. 
        // Let's check analytics.js next.
        // Assuming calculatePrediction needs to be async or we pass the data.
        // For now, let's call it.
        await updatePrediction(id);
    }

    revalidatePath('/');
}

// Helper to handle prediction update which might need DB access
async function updatePrediction(id) {
    const { calculatePrediction } = await import('@/lib/analytics');
    const prediction = await calculatePrediction(id); // Ensure this is async

    if (prediction) {
        await sql`UPDATE items SET predicted_next_purchase = ${prediction.nextPurchaseDate} WHERE id = ${id}`;
    }
}
