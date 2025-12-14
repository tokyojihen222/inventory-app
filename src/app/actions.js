'use server';

import sql from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { itemSchema } from '@/lib/schemas';

export async function getItems() {
    return await sql`SELECT * FROM items ORDER BY category, name`;
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
