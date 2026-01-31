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

        const modelName = 'gemini-3-flash-preview';
        const model = genAI.getGenerativeModel({ model: modelName });

        const prompt = `
    あなたは家事手伝いの専門家です。提供されたレシート画像の解析を行ってください。
    画像が複数ある場合は、それらは「1つの長いレシートを分割撮影したもの」または「同時の買い物レシート」です。情報を統合して解析してください。

    【解析ステップ】
    1. **店名の特定**: レシート最上部のロゴやテキスト、電話番号付近の「〜店」という表記を探し、チェーン名と店舗名を組み合わせてください。
       - 不明な場合でも、レシートの中で「一番大きく目立つ文字」を店名として仮定してください。「不明」やnullは避けてください。
    2. **日付の特定**: レシート内の日付（YYYY/MM/DD形式など）をすべて探し、購入日として最も適切なものを選んでください。
    3. **合計金額の特定**: 「合計」「小計」「Total」の行を探してください。もし見つからない場合、数字の中で「最大の値」または「商品の合算値」を合計として採用してください。0円は避けてください。

    【出力フォーマット】
    JSON形式のみ出力してください。理由や思考過程は出力しないでください。

    {
      "store_name": "...", 
      "purchase_date": "YYYY-MM-DD",
      "total_amount": 1000,
      "items": [
        { "raw_name": "...", "name": "...", "category": "...", "quantity": 1, "unit": "個", "price": 100, "is_fresh": false }
      ]
    }
    
    * store_name は必ず文字列を返してください (null不可)。
    * total_amount は必ず数値を返してください (0不可)。
    * purchase_date は見つからなければ null 可。
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
