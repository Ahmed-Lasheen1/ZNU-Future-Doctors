import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rbgfupgwmgvvrrzuawpo.supabase.co'
const supabaseKey = 'sb_publishable_sRkT46SRWK8SDMdLsz-CGg_A1vHAd6B'

export const supabase = createClient(supabaseUrl, supabaseKey)