import { createClient } from '@supabase/supabase-js'

console.log('ENV RAW:', import.meta.env.VITE_SUPABASE_URL)

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('SUPABASE URL:', supabaseUrl)
console.log('SUPABASE KEY:', supabaseAnonKey)

export const supabase = createClient(supabaseUrl, supabaseAnonKey)