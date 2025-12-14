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
        // Use explicit model version to avoid 404s with aliases
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-001' });

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const prompt = `
    あなたは家事手伝いの専門家です。このレシート画像を解析し、購入された商品をリストアップしてください。
    
    【出力ルール】
    1. 商品名は、具体的な製品名ではなく、管理しやすい「一般的な名称」に変換してください。
       (例: "セブンイレブンのおにぎり" → "おにぎり", "キューピーハーフ" → "マヨネーズ", "クリネックス" → "ティッシュ")
    2. カテゴリは「食品」「調味料」「消耗品」「日用品」「その他」の中から最も適切なものを選んでください。
    3. 数量が読み取れない場合は 1 としてください。
    4. 結果は以下のJSON配列形式のみを出力してください。Markdownのコードブロックは不要です。
    
    [
      { "name": "商品名", "category": "カテゴリ", "quantity": 数値, "price": 単価(数値) },
      ...
    ]
    `;

        const imagePart = {
            inlineData: {
                data: buffer.toString('base64'),
                mimeType: file.type || 'image/jpeg',
            },
        };

        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();

        // Markdownコードブロック除去
        const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        let items = [];
        try {
            items = JSON.parse(jsonStr);
        } catch (e) {
            console.error('JSON Parse Error:', responseText);
            return NextResponse.json({ success: false, error: 'AIの応答を解析できませんでした' }, { status: 500 });
        }

        return NextResponse.json({ success: true, items });

    } catch (error) {
        console.error('Scan Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
