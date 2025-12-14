import { z } from 'zod';

export const itemSchema = z.object({
    name: z.string().min(1, '商品名は必須です').max(100, '商品名は100文字以内で入力してください'),
    category: z.string().max(50, 'カテゴリは50文字以内で入力してください').optional().or(z.literal('')),
    quantity: z.coerce.number().int().min(0, '在庫数は0以上の整数である必要があります'),
    threshold: z.coerce.number().int().min(0, '通知閾値は0以上の整数である必要があります'),
});
