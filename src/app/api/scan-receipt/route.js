import { NextResponse } from 'next/server';
import Tesseract from 'tesseract.js';
import sql from '@/lib/db';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Perform OCR
        const { data: { text } } = await Tesseract.recognize(buffer, 'jpn', {
            logger: m => console.log(m)
        });

        console.log('OCR Text:', text);

        // Parse text and match items
        const lines = text.split('\n');
        const items = await sql`SELECT * FROM items`;
        const matches = [];
        let totalCost = 0;

        // Supabase (postgres.js) transaction
        await sql.begin(async sql => {
            for (const line of lines) {
                for (const item of items) {
                    if (line.includes(item.name)) {
                        // Found a match!
                        const priceMatch = line.match(/(\d{1,3}(,\d{3})*)/);
                        const price = priceMatch ? parseInt(priceMatch[0].replace(/,/g, ''), 10) : 0;

                        // Update inventory
                        const newQuantity = item.quantity + 1;
                        await sql`UPDATE items SET quantity = ${newQuantity} WHERE id = ${item.id}`;

                        // Record history
                        await sql`
              INSERT INTO history (item_id, quantity_change, cost, type)
              VALUES (${item.id}, 1, ${price}, 'purchase')
            `;

                        matches.push({ name: item.name, price });
                        totalCost += price;
                        // Break inner loop (items) to match next line. 
                        // Note: This logic assumes one item per line, or first match wins.
                        break;
                    }
                }
            }
        });

        return NextResponse.json({ success: true, matches, total: totalCost });

    } catch (error) {
        console.error('OCR Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
