import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
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

        const schema = {
            description: "Receipt extraction",
            type: SchemaType.OBJECT,
            properties: {
                store_name: {
                    type: SchemaType.STRING,
                    description: "Store name properly extracted from logo or text. Must be a non-empty string.",
                    nullable: false
                },
                purchase_date: {
                    type: SchemaType.STRING,
                    description: "Date of purchase yyyy-mm-dd",
                    nullable: true
                },
                total_amount: {
                    type: SchemaType.NUMBER,
                    description: "Total amount of the receipt",
                    nullable: false
                },
                items: {
                    type: SchemaType.ARRAY,
                    items: {
                        type: SchemaType.OBJECT,
                        properties: {
                            raw_name: { type: SchemaType.STRING },
                            name: { type: SchemaType.STRING },
                            category: { type: SchemaType.STRING },
                            unit: { type: SchemaType.STRING },
                            price: { type: SchemaType.NUMBER },
                            quantity: { type: SchemaType.NUMBER },
                            is_fresh: { type: SchemaType.BOOLEAN }
                        },
                        required: ["raw_name", "price", "quantity"]
                    }
                }
            },
            required: ["store_name", "total_amount", "items"]
        };

        const modelName = 'gemini-3-flash-preview';
        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });

        const prompt = `
    あなたは家事手伝いの専門家です。提供されたレシート画像の解析を行ってください。
    画像が複数ある場合は、それらは「1つの長いレシートを分割撮影したもの」または「同時の買い物レシート」です。情報を統合して解析してください。

    【解析ステップ】 (思考プロセス)
    1. **店名の特定**: 
       - ロゴ、ヘッダーテキスト、電話番号付近の店舗名を探す。
       - ロゴと店舗名が離れている場合（チェーン名＋○○店）、必ず結合する。
       - どうしても見つからない場合でも、レシート内の「一番目立つ大きな文字」を店名として採用する。NULLは不可。
    2. **日付の特定**: YYYY/MM/DD形式の日付を探す。
    3. **合計金額の特定**: 「合計」「小計」「Total」を探す。見つからない場合は最大値や合計計算を行う。0円は不可。

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

            console.log("Gemini Raw Response:", responseText); // Debug log

            const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(jsonStr);

            // Support both old format (array) and new format (object)
            const resultItems = Array.isArray(data) ? data : (data.items || []);

            // --- Backend Fallback Logic ---
            let finalTotal = data.total_amount;
            if (!finalTotal || finalTotal === 0) {
                // Calculate from items if total is missing or 0
                const calculatedTotal = resultItems.reduce((acc, item) => acc + ((item.price || 0) * (item.quantity || 1)), 0);
                if (calculatedTotal > 0) {
                    finalTotal = calculatedTotal;
                }
            }

            let finalStoreName = data.store_name;
            if (!finalStoreName || finalStoreName === "null" || finalStoreName.trim() === "") {
                finalStoreName = "店舗名不明";
            }

            const meta = {
                store_name: finalStoreName,
                purchase_date: data.purchase_date,
                total_amount: finalTotal
            };

            return NextResponse.json({
                success: true,
                items: resultItems,
                ...meta
            });

        } catch (genError) {
            console.error('Generation Error:', genError);
            return NextResponse.json({
                success: false,
                error: `AI生成エラー: ${genError.message}`
            }, { status: 500 });
        }

    } catch (error) {
        console.error('Scan Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
