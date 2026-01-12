import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// 処理時間を長めに確保 (Vercel Serverless Function Config)
export const maxDuration = 60;

export async function POST(request) {
    try {
        const formData = await request.formData();
        // Support both 'files' (new) and 'file' (old) keys for robustness
        const files = formData.getAll('files').length > 0 ? formData.getAll('files') : formData.getAll('file');

        if (!files || files.length === 0) {
            return NextResponse.json({ success: false, error: 'ファイルがありません' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('API Key Missing');
            return NextResponse.json({ success: false, error: 'APIキーが設定されていません' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const genAI = new GoogleGenerativeAI(apiKey);
        const modelName = 'gemini-1.5-flash';
        const model = genAI.getGenerativeModel({ model: modelName });

        const prompt = `
    あなたは家事手伝いの専門家です。提供されたレシート画像の解析を行ってください。
    画像が複数ある場合は、それらは「1つの長いレシートを分割撮影したもの」または「同時の買い物レシート」です。情報を統合して解析してください。
    家計簿と在庫管理のためのデータを抽出してください。

    【重要：抽出ルール】
    1. store_name: 
       - レシート最上部にあるロゴや大きな文字から店名を特定してください。
       - "Tel"や"住所"ではありません。
    2. purchase_date: 
       - **重要**: 今日の日付ではなく、必ず【レシートに印字されている日付】を抽出してください。
       - YYYY-MM-DD形式に変換してください。不明な場合はnull。
    3. total_amount: 
       - レシートの「合計」「小計」「Total」などの欄から数値を探してください。
       - **重要**: 0や空欄は避けてください。明示的な合計がない場合は、各商品の金額を足し合わせて推測してください。
    4. itemsリスト:
       - raw_name: レシート記載のそのままの商品名
       - name: 在庫管理用に変換した一般的な名称 (例: "セブンのおにぎり" → "おにぎり")
       - category: 「食品」「調味料」「消耗品」「日用品」「その他」から選択
       - unit: 「個」「パック」「ケース」から推測
       - price: 単価 (数値)
       - quantity: 数量 (数値)
       - is_fresh: 生鮮食品(肉、魚、野菜、果物、惣菜など)の場合 true
    
    5. JSON形式のみ出力
    {
      "store_name": "...",
      "purchase_date": "YYYY-MM-DD",
      "total_amount": 1000,
      "items": [
        { "raw_name": "...", "name": "...", "category": "...", "quantity": 1, "unit": "個", "price": 100, "is_fresh": false }
      ]
    }
    `;

        const imageParts = await Promise.all(files.map(async (file) => {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            return {
                inlineData: {
                    data: buffer.toString('base64'),
                    mimeType: file.type || 'image/jpeg',
                },
            };
        }));

        try {
            const result = await model.generateContent([prompt, ...imageParts]);
            const responseText = result.response.text();

            const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(jsonStr);
            // Support both old format (array) and new format (object)
            const resultItems = Array.isArray(data) ? data : data.items;
            const meta = Array.isArray(data) ? {} : {
                store_name: data.store_name,
                purchase_date: data.purchase_date,
                total_amount: data.total_amount
            };

            return NextResponse.json({
                success: true,
                items: resultItems,
                ...meta
            });

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
