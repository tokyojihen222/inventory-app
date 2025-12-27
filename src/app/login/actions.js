'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function signInWithGoogle() {
    const supabase = await createClient()

    // 動的なホスト取得をやめ、確認済みの正しいURLを固定で使用する
    const callbackUrl = 'https://inventory-b2mssg86g-tokyojihen222s-projects.vercel.app/callback'

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: callbackUrl,
        },
    })

    if (error) {
        console.error('Login error:', error)
        redirect('/login?error=auth')
    }

    if (data.url) {
        redirect(data.url)
    }
}
