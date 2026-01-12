import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// 処理時間を長めに確保 (Vercel Serverless Function Config)
export const maxDuration = 60;

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ success: false, error: 'ファイルがありません' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('API Key Missing');
            return NextResponse.json({ success: false, error: 'APIキーが設定されていません' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        // スクリーンショットで「5 RPM」の枠があることが確認できた "gemini-2.5-flash" を使用します
        const modelName = 'gemini-2.5-flash';
        const model = genAI.getGenerativeModel({ model: modelName });

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const prompt = `
    あなたは家事手伝いの専門家です。このレシート画像を解析し、家計簿と在庫管理のためのデータを抽出してください。
    【出力ルール】
    1. store_name: レシート掲載の店名
    2. purchase_date: 購入日時 (YYYY-MM-DD形式、不明ならnull)
    3. itemsリスト:
       - raw_name: レシート記載のそのままの商品名
       - name: 在庫管理用に変換した一般的な名称 (例: "セブンのおにぎり" → "おにぎり")
       - category: 「食品」「調味料」「消耗品」「日用品」「その他」から選択
       - unit: 「個」「パック」「ケース」から推測
       - price: 単価 (数値)
       - quantity: 数量 (数値)
       - is_fresh: 生鮮食品(肉、魚、野菜、果物、惣菜など)の場合 true
    4. JSON形式のみ出力
    {
      "store_name": "...",
      "purchase_date": "...",
      "items": [
        { "raw_name": "...", "name": "...", "category": "...", "quantity": 1, "unit": "個", "price": 100, "is_fresh": false }
      ]
    }
    `;

        const imagePart = {
            inlineData: {
                data: buffer.toString('base64'),
                mimeType: file.type || 'image/jpeg',
            },
        };

        try {
            const result = await model.generateContent([prompt, imagePart]);
            const responseText = result.response.text();

            const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const items = JSON.parse(jsonStr);
            return NextResponse.json({ success: true, items });

        } catch (genError) {
            console.error('Generation Error:', genError);

            // If model not found or other API error, try to list available models for debugging
            let debugInfo = '';
            try {
                const listResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
                if (listResp.ok) {
                    const listData = await listResp.json();
                    const availableModels = listData.models ? listData.models.map(m => m.name) : [];
                    debugInfo = `Available models: ${availableModels.join(', ')}`;
                } else {
                    debugInfo = `Failed to list models: ${listResp.status} ${listResp.statusText}`;
                }
            } catch (listErr) {
                debugInfo = `Could not list models: ${listErr.message}`;
            }

            return NextResponse.json({
                success: false,
                error: `AI生成エラー: ${genError.message}. \n\n[デバッグ情報] API Key Prefix: ${apiKey.substring(0, 4)}... \n${debugInfo}`
            }, { status: 500 });
        }

    } catch (error) {
        console.error('Scan Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
