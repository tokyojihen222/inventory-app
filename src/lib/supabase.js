import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export const createClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("Supabase environment variables are missing!");
        // In development, this might happen during build but shouldn't crash unless called.
        // In production, this causes the "Application error" if called.
        // We throw a clear error that the Error Boundary can catch.
        throw new Error("Supabase configuration is missing. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    }

    return createSupabaseClient(supabaseUrl, supabaseKey);
}
