import sql from '@/lib/db';

export async function calculatePrediction(itemId) {
    // Get history for the item, sorted by date desc
    const history = await sql`
    SELECT * FROM history 
    WHERE item_id = ${itemId} AND type IN ('purchase', 'consume')
    ORDER BY date DESC
  `;

    if (history.length < 2) return null;

    // Simple algorithm: Calculate average interval between "purchase" events
    const purchases = history.filter(h => h.type === 'purchase');

    if (purchases.length < 2) return null;

    let totalDays = 0;
    let intervals = 0;

    for (let i = 0; i < purchases.length - 1; i++) {
        const current = new Date(purchases[i].date);
        const prev = new Date(purchases[i + 1].date);
        const diffTime = Math.abs(current - prev);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        totalDays += diffDays;
        intervals++;
    }

    if (intervals === 0) return null;

    const avgInterval = totalDays / intervals;

    // Predict next purchase based on last purchase date + avgInterval
    const lastPurchase = new Date(purchases[0].date);
    const nextPurchase = new Date(lastPurchase);
    nextPurchase.setDate(nextPurchase.getDate() + avgInterval);

    return {
        avgInterval: Math.round(avgInterval),
        nextPurchaseDate: nextPurchase.toISOString()
    };
}
