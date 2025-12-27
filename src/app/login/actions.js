'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function signInWithGoogle() {
    const supabase = await createClient()

    // 動的にコールバックURLを構築
    const headersList = await headers()
    const host = headersList.get('host')
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
    const callbackUrl = `${protocol}://${host}/callback`

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
